#!/usr/bin/env npx ts-node

import * as fs from 'fs-extra';

import { convertAbility } from './battleActions';

// tslint:disable no-console

function main(fileNames: string[]) {
  for (const i of fileNames) {
    const battleInitData = JSON.parse(fs.readFileSync(i).toString());
    for (const character of battleInitData.data.battle.buddy) {
      for (const abilityData of character.abilities) {
        console.log(convertAbility(abilityData));
      }
    }
  }
}

main(process.argv.slice(2));
