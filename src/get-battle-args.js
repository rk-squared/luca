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
      args[actionName] = args[actionName] || {};

      j(defineNode.arguments[2])
        .find(j.CallExpression, setValue)
        .forEach(setPath => {
          const setNode = setPath.node;
          if (setNode.arguments.length !== 2) {
            return;
          }

          const namedArg = setNode.arguments[0].value;
          logDebug('  ' + namedArg);

          let argSource;
          if (j.match(setNode.arguments[1], getValue)) {
            argSource = getValueArgument(setNode.arguments[1]);
          } else if (j.match(setNode.arguments[1], getBooleanValue)) {
            argSource = getBooleanValueArgument(setNode.arguments[1]);
          }
          if (argSource) {
            logDebug('    ' + argSource);
            const match = argSource.match(/^arg(\d+)$/);
            if (match) {
              args[actionName][namedArg] = +match[1];
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
