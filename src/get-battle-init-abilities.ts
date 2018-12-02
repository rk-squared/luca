#!/usr/bin/env npx ts-node

import * as fs from 'fs-extra';
const stripBom = require('strip-bom');

import { convertAbility } from './battleActions';
import { GetBattleInitData } from './schemas/get_battle_init_data';

// tslint:disable no-console

function main(fileNames: string[]) {
  for (const i of fileNames) {
    const captured = JSON.parse(stripBom(fs.readFileSync(i).toString()));

    // Handle both RK Squared captures (which include metadata, with the reply
    // as a `data` property) and direct captures.
    const battleData = (captured.data || captured) as GetBattleInitData;

    const { battle } = battleData;

    for (const character of [...battle.buddy, ...battle.supporter]) {
      for (const abilityData of character.abilities) {
        console.log(convertAbility(abilityData));
      }
      for (const soulStrike of character.soul_strikes) {
        console.log(convertAbility(soulStrike));
      }
    }

    for (const magicite of [...battle.main_beast, ...battle.sub_beast]) {
      for (const abilityData of magicite.active_skills) {
        console.log(convertAbility(abilityData));
      }
    }
  }
}

main(process.argv.slice(2));
