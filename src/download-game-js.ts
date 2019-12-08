#!/usr/bin/env npx ts-node
/**
 * @file
 * Download FFRK's battle.js and beautify it.
 *
 * @see https://www.reddit.com/r/FFRecordKeeper/wiki/index/game_code/battle_js
 */

import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as yargs from 'yargs';

import { logger } from './logger';
import { LangType } from './util';

import * as _ from 'lodash';

const safeEval = require('safe-eval');
const beautify = require('js-beautify').js;

// tslint:disable no-console

const workPath = path.join(__dirname, '..', 'tmp');
fs.ensureDirSync(workPath);

const baseUrl: { [lang in LangType]: string } = {
  [LangType.Gl]: 'https://ffrk.static.denagames.com/dff/static/ww/compile/en/',
  [LangType.Jp]: 'https://dff.sp.mbga.jp/dff/static/',
};
const battleJsFiles = [
  // Recommended by the FFRK Reddit wiki, although I haven't yet needed it.
  'js/lib.js',

  // The main file we're interested in.
  'js/battle.js',

  // Loaded at game start.  Includes the 'util' module, which some battle.js
  // code depends on.
  'js/pre.js',
];

const allJsFiles = battleJsFiles.concat([
  // Additional JavaScript from the /dff/ file that's loaded at startup:
  // vendor.js doesn't work with our very primitive unpacker.
  // 'js/vendor.js',
  'js/templates.js',
  'js/event/challenge/app.js',
  'js/templates_event/challenge.js',
  'js/event/beast/app.js',
  'js/templates_event/beast.js',
  'js/event/extreme/app.js',
  'js/templates_event/extreme.js',
  'js/event/original_scenario/app.js',
  'js/templates_event/original_scenario.js',
  'js/event/wday/app.js',
  'js/templates_event/wday.js',
  'js/event/suppress/app.js',
  'js/templates_event/suppress.js',
  'js/event/rotation/app.js',
  'js/templates_event/rotation.js',
  'js/event/original_scenario/app.js',
  'js/templates_event/original_scenario.js',
  'js/app.js',
]);

// CSS: https://ffrk.static.denagames.com/dff/static/ww/compile/en/css/compile/forAndroid4x/main.css
//  and https://ffrk.static.denagames.com/dff/static/ww/compile/en/css/compile/forAts/main.css
// (not currently automatically implemented)

/**
 * Unpacks any eval-based JavaScript, using the safe-eval module.  See
 * https://www.npmjs.com/package/safe-eval
 *
 * js-beautifier has its own unpacker, but it apparently doesn't expose it...
 * See https://github.com/beautify-web/js-beautify/blob/master/js/src/unpackers/p_a_c_k_e_r_unpacker.js
 */
function unpackJs(rawJs: string) {
  const prefix = 'eval(';
  const suffix = ')';

  if (!rawJs.startsWith(prefix) || !rawJs.endsWith(suffix)) {
    throw new Error('Unexpected JS received');
  }

  return safeEval(rawJs.substring(prefix.length, rawJs.length - suffix.length));
}

async function downloadAndProcess(url: string, file: string, lang: LangType) {
  const localBaseFilename = path.basename(file);
  logger.info(`Processing ${lang.toUpperCase()} ${localBaseFilename}: ${url + file}`);

  const localDirectory = path.join(workPath, lang, path.dirname(file));
  fs.ensureDirSync(localDirectory);
  const localFilename = path.join(localDirectory, localBaseFilename);

  const response = await axios.get(url + file);
  const rawJs = response.data;
  try {
    const unpackedJs = unpackJs(rawJs);
    const prettyJs = beautify(unpackedJs);
    fs.writeFileSync(localFilename, prettyJs);
  } catch (e) {
    fs.writeFileSync(localFilename + '.tmp', rawJs);
    throw e;
  }
}

async function downloadAndProcessList(jsFiles: string[]) {
  return Promise.all(
    _.map(baseUrl, async (url, key) => {
      const lang = key as LangType;
      for (const file of jsFiles) {
        await downloadAndProcess(url, file, lang);
      }
    }),
  );
}

const argv = yargs.option('all', {
  alias: 'a',
  default: false,
  boolean: true,
  description: 'Download all (not just battle.js)',
}).argv;

console.log(argv);

if (require.main === module) {
  downloadAndProcessList(argv.all ? allJsFiles : battleJsFiles).catch(e => console.error(e));
}
