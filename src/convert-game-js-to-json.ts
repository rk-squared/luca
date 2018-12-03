#!/usr/bin/env npx ts-node

import * as fs from 'fs-extra';
import * as path from 'path';

import { logger } from './logger';
import { LangType } from './util';

import * as _ from 'lodash';

const safeEval = require('safe-eval');
const underscore = require('underscore');

// tslint:disable max-classes-per-file

const srcPath = path.join(__dirname, '..', 'src');
const workPath = path.join(__dirname, '..', 'tmp');
fs.ensureDirSync(workPath);

class Module {
  name: string;
  prereqs: string[];
  definition: () => any;
  isInitialized = false;
  value: any;

  constructor(name: string, value: any);
  constructor(name: string, prereqs: string[], definition: () => any);

  constructor(name: string, valueOrPrereqs: any, definition?: () => any) {
    this.name = name;
    if (definition) {
      this.prereqs = this.canonicalizePrereqs(valueOrPrereqs);
      this.definition = definition;
      this.isInitialized = false;
    } else {
      this.prereqs = [];
      this.value = valueOrPrereqs;
      this.isInitialized = true;
    }
  }

  initialize(prereqs: any[]) {
    try {
      this.value = this.definition.apply(undefined, prereqs);
    } catch (e) {
      logger.error(`Error while resolving ${this.name}: ${e}`);
      throw e;
    }
    this.isInitialized = true;
  }

  private canonicalizePrereqs(prereqs: string[]): string[] {
    return prereqs.map(i => {
      const isRelative = i.startsWith('./') || i.startsWith('../');
      if (isRelative) {
        i = path.posix.dirname(this.name) + '/' + i;
      }
      return path.posix.normalize(i);
    });
  }
}

class ModuleSet {
  modules: { [name: string]: Module } = {};

  constructor(modules?: Module[]) {
    if (modules) {
      modules.forEach(i => this.add(i));
    }
  }

  add(module: Module) {
    this.modules[module.name] = module;
  }

  get(name: string) {
    if (!this.modules[name]) {
      throw new Error(`Unknown module ${name} requested`);
    }
    if (!this.modules[name].isInitialized) {
      this.modules[name].initialize(this.getPrereqs(this.modules[name]));
    }
    return this.modules[name].value;
  }

  getPrereqs(module: Module): any[] {
    return module.prereqs.map(i => this.get(i));
  }
}

// noinspection JSUnusedGlobalSymbols
const gameModules = new ModuleSet([
  new Module('underscore', underscore),
  new Module('util', {
    cloneDeep: _.cloneDeep,
    forceArray(value: any) {
      // noinspection JSDeprecatedSymbols
      if (underscore.isUndefined(value) || underscore.isNull(value)) {
        return [];
      } else if (underscore.isArray(value)) {
        return value;
      } else {
        return [value];
      }
    },
  }),
  new Module('lib/ClassBase', {
    extend(props: any) {
      const newClass = function(...args: any[]) {
        // @ts-ignore
        this.params = args;
      };
      _.extend(newClass.prototype, props);
      return newClass;
    },
  }),
]);

// noinspection JSUnusedGlobalSymbols
const FF: any = {
  ns: {
    battle: {
      util: {},
    },
  },
  env: {
    isWWRegion: () => true, // I have no idea what this means.
  },

  // Locally calculated
  extra: {},
};

// noinspection JSUnusedGlobalSymbols
const gameContext = {
  define() {
    const args = Array.prototype.slice.call(arguments);

    const moduleName = typeof args[0] === 'string' ? args.shift() : null;
    const prereqs = Array.isArray(args[0]) ? args.shift() : [];
    const definition: () => any = args.shift();

    logger.debug(`Processing ${moduleName} definition: ${prereqs.join(', ')}`);

    gameModules.add(new Module(moduleName, prereqs, definition));
  },

  require(prereqs: string[] /*, module: () => void*/) {
    logger.debug(`Processing requires: ${prereqs.join(', ')}`);
  },

  FF,
  _: underscore,
};

function getAllStatusAilments() {
  const result: any = {};
  _.forEach(FF.ns.battle.Conf.STATUS_AILMENTS_TYPE, (value, key) => {
    result[value] = {
      _name: key,
      ...FF.ns.battle.StatusAilmentsConfig.getParam(value),
    };
  });
  return result;
}

function getAllStatusAilmentBundles() {
  const result: any = {};
  _.forEach(FF.ns.battle.Conf.STATUS_AILMENTS_BUNDLE, (value, key) => {
    result[value] = {
      _name: key,
      ids: FF.ns.battle.StatusAilmentsConfig.getBundle(value),
    };
  });
  return result;
}

function convertBattleJs(lang: LangType) {
  logger.info(`Processing battle info for ${lang.toUpperCase()}...`);
  const battleJs = fs.readFileSync(path.join(workPath, lang, `battle.js`)).toString();
  safeEval(battleJs, gameContext);

  // console.log(gameModules.get('scenes/battle/Conf'));

  gameModules.get('scenes/battle/AbilityFactory');
  // console.log(FF.ns.battle.AbilityFactory);

  gameModules.get('scenes/battle/StatusAilmentsConfig');
  // console.log(FF.ns.battle.StatusAilmentsConfig);

  FF.extra.statusAilments = getAllStatusAilments();
  FF.extra.statusAilmentBundles = getAllStatusAilmentBundles();

  fs.ensureDirSync(path.join(srcPath, lang));
  fs.writeFileSync(path.join(srcPath, lang, 'battle.json'), JSON.stringify(FF, null, 2));
}

if (require.main === module) {
  for (const lang of _.values(LangType)) {
    convertBattleJs(lang as LangType);
  }
}
