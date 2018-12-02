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
const jsFiles = [
  // Recommended by the FFRK Reddit wiki, although I haven't yet needed it.
  'js/lib.js',

  // The main file we're interested in.
  'js/battle.js',

  // Loaded at game start.  Includes the 'util' module, which some battle.js
  // code depends on.
  'js/pre.js',
];

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

async function downloadAndProcess(url: string, lang: LangType) {
  const localBaseFilename = path.basename(url);
  logger.info(`Processing ${lang.toUpperCase()} ${localBaseFilename}...`);

  const localDirectory = path.join(workPath, lang);
  fs.ensureDirSync(localDirectory);
  const localFilename = path.join(localDirectory, localBaseFilename);

  const response = await axios.get(url);
  const rawJs = response.data;
  const unpackedJs = unpackJs(rawJs);
  const prettyJs = beautify(unpackedJs);
  fs.writeFileSync(localFilename, prettyJs);
}

async function downloadAndProcessAll() {
  return Promise.all(
    _.map(baseUrl, async (url, key) => {
      const lang = key as LangType;
      for (const file of jsFiles) {
        await downloadAndProcess(url + file, lang);
      }
    }),
  );
}

if (require.main === module) {
  downloadAndProcessAll().catch(e => console.error(e));
}
