#!/usr/bin/env npx ts-node

import * as fs from 'fs-extra';
const stripBom = require('strip-bom');

import { convertAbility } from './battleActions';
import { battleData } from './gameData';
import { GetBattleInitData } from './schemas/get_battle_init_data';
import { LangType } from './util';

// tslint:disable no-console

function main(fileNames: string[]) {
  for (const i of fileNames) {
    const captured = JSON.parse(stripBom(fs.readFileSync(i).toString()));

    // These scripts will mostly be used to mine JP, so assume Japanese,
    // unless we have an RK Squared style capture with a GL URL.
    const lang =
      captured.url && captured.url.startsWith('http://ffrk.denagames.com/')
        ? LangType.Gl
        : LangType.Jp;
    console.debug(`Processing ${i} as ${lang}`);

    // Handle both RK Squared captures (which include metadata, with the reply
    // as a `data` property) and direct captures.
    const battleInitData = (captured.data || captured) as GetBattleInitData;

    const { battle } = battleInitData;

    for (const character of [...battle.buddy, ...battle.supporter]) {
      for (const abilityData of character.abilities) {
        console.log(convertAbility(battleData[lang], abilityData));
      }
      for (const soulStrike of character.soul_strikes) {
        console.log(convertAbility(battleData[lang], soulStrike));
      }
    }

    for (const magicite of [...battle.main_beast, ...battle.sub_beast]) {
      for (const abilityData of magicite.active_skills) {
        console.log(convertAbility(battleData[lang], abilityData));
      }
    }
  }
}

main(process.argv.slice(2));
