#!/usr/bin/env npx jscodeshift --run-in-band --dry --silent --transform
/**
 * @file
 * jscodeshift module for processing FFRK's battle.js and extracting named
 * argument mappings out of it.
 *
 * The resulting mappings aren't complete (some arguments are too complex to
 * easily process like this), but they help.
 *
 * For more information:
 * - https://github.com/facebook/jscodeshift
 * - https://www.toptal.com/javascript/write-code-to-rewrite-your-code
 *
 * Note that this is somewhat of an abuse of jscodeshift: it's intended to
 * facilitate automated refactoring of JavaScript code, but we use it because
 * it also offers a convenient interface for parsing and searching code.
 */

const babylon = require('babylon');
const _ = require('lodash');
const path = require('path');

function logDebug(message) {
  process.stderr.write(message + '\n');
}

// jscodeshift match expression for
// `this.get("arg1")`
// and a function to extract the argument name.
const getValue = {
  type: 'CallExpression',
  callee: {
    type: 'MemberExpression',
    object: {
      type: 'ThisExpression',
    },
    property: {
      type: 'Identifier',
      name: 'get',
    },
  },
  arguments: [
    {
      type: 'StringLiteral',
    },
  ],
};
const getValueArgument = node => node.arguments[0].value;

// jscodeshift match expression for
// `this.set("someValue", ...)`
// and a function to extract the argument name.
const setValue = {
  type: 'CallExpression',
  callee: {
    type: 'MemberExpression',
    object: {
      type: 'ThisExpression',
    },
    property: {
      type: 'Identifier',
      name: 'set',
    },
  },
  arguments: [
    {
      type: 'StringLiteral',
    },
    {},
  ],
};

// jscodeshift match expression for
// !!this.get("arg1")
// and a function to extract the argument name.
const getBooleanValue = {
  type: 'UnaryExpression',
  operator: '!',
  argument: {
    type: 'UnaryExpression',
    operator: '!',
    argument: getValue,
  },
};
const getBooleanValueArgument = node => getValueArgument(node.argument.argument);

// jscodeshift match expression for
// `this.helper.set("someValue", ...)`
const helperSetValue = {
  type: 'CallExpression',
  callee: {
    type: 'MemberExpression',
    object: {
      type: 'MemberExpression',
      object: {
        type: 'ThisExpression',
      },
      property: {
        type: 'Identifier',
        name: 'helper',
      },
    },
    property: {
      type: 'Identifier',
    },
  },
};
function helperSetValueSetter(node) {
  const setterName = node.callee.property.name;
  if (setterName.startsWith('set')) {
    return _.lowerFirst(setterName.substring(3));
  } else {
    return null;
  }
}

function getArgSource(j, argNode) {
  if (j.match(argNode, getValue)) {
    return getValueArgument(argNode);
  } else if (j.match(argNode, getBooleanValue)) {
    return getBooleanValueArgument(argNode);
  } else {
    return null;
  }
}

function getArgSourceNumber(j, argNode, localVariables) {
  if (argNode.type === 'Identifier' && localVariables && localVariables[argNode.name]) {
    return localVariables[argNode.name];
  }
  let argSource = getArgSource(j, argNode);
  if (argSource) {
    logDebug('    ' + argSource);
    const match = argSource.match(/^arg(\d+)$/);
    if (match) {
      return +match[1];
    }
  }
  return null;
}

function getMultiArgSourceNumber(j, arrayNode, localVariables) {
  const result = _.filter(arrayNode.elements.map(i => getArgSourceNumber(j, i, localVariables)));
  return result.length ? result : null;
}

module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;

  const args = {};

  const result = j(fileInfo.source)
    .find(j.CallExpression, {
      callee: {
        type: 'Identifier',
        name: 'define',
      },
    })
    .forEach(definePath => {
      const defineNode = definePath.node;
      if (defineNode.arguments.length !== 3) {
        return;
      }
      const moduleName = defineNode.arguments[0].value;
      if (!moduleName.startsWith('scenes/battle/action/')) {
        return;
      }
      logDebug(moduleName);
      const actionName = path.basename(moduleName);
      args[actionName] = args[actionName] || {
        args: {},
        multiArgs: {},
      };

      const moduleDefinition = defineNode.arguments[2];

      // Process local variables.  We cheat: instead of honoring JS scoping,
      // we grab any variables that look appropriate, with preference to early
      // variables, and hope it works.
      const localVariables = {};
      j(moduleDefinition)
        .find(j.VariableDeclarator, {
          id: {
            type: 'Identifier',
          },
          init: getValue,
        })
        .forEach(variablePath => {
          const variableNode = variablePath.node;
          const argSourceNumber = getArgSourceNumber(j, variableNode.init, localVariables);
          if (argSourceNumber != null) {
            localVariables[variableNode.id.name] = argSourceNumber;
          }
        });

      // Process simple setters.
      j(moduleDefinition)
        .find(j.CallExpression, setValue)
        .forEach(setPath => {
          const setNode = setPath.node;
          if (setNode.arguments.length !== 2) {
            return;
          }

          const namedArg = setNode.arguments[0].value;
          logDebug('  ' + namedArg);

          const argSourceNumber = getArgSourceNumber(j, setNode.arguments[1], localVariables);
          if (argSourceNumber != null) {
            args[actionName].args[namedArg] = argSourceNumber;
          }
        });

      // Process custom setters.
      j(moduleDefinition)
        .find(j.CallExpression, helperSetValue)
        .forEach(setPath => {
          const setNode = setPath.node;
          const namedArg = helperSetValueSetter(setNode);
          if (!namedArg) {
            return;
          }
          logDebug('  ' + namedArg);
          if (setNode.arguments.length === 1) {
            const argSourceNumber = getArgSourceNumber(j, setNode.arguments[0], localVariables);
            if (argSourceNumber) {
              args[actionName].args[namedArg] = argSourceNumber;
            }
          } else if (
            setNode.arguments.length === 2 &&
            namedArg === 'damageCalculateParamAdjustConf' &&
            setNode.arguments[1].type === 'ArrayExpression'
          ) {
            const argSourceNumber = getArgSourceNumber(j, setNode.arguments[0], localVariables);
            if (argSourceNumber != null) {
              args[actionName].args['damageCalculateParamAdjust'] = argSourceNumber;
            }

            const multiArgSourceNumber = getMultiArgSourceNumber(
              j,
              setNode.arguments[1],
              localVariables,
            );
            if (multiArgSourceNumber != null) {
              args[actionName].multiArgs['damageCalculateParamAdjustConf'] = multiArgSourceNumber;
            }
          }
        });
    });

  console.log(JSON.stringify(args, null, 2));

  return result.toSource();
};

// Override the default Babylon parser so that we can pass strictMode: false.
// (FFRK uses the `with` statement.)
module.exports.parser = {
  parse(source) {
    return babylon.parse(source, { strictMode: false });
  },
};
