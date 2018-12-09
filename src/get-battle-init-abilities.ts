#!/usr/bin/env npx ts-node

import * as fs from 'fs-extra';

const stripBom = require('strip-bom');

import { convertAbility } from './battleActions';
import { tryLoadAll } from './enlirData';
import { battleData } from './gameData';
import { logger } from './logger';
import { Buddy, GetBattleInitData, Supporter } from './schemas/get_battle_init_data';
import { LangType } from './util';

// tslint:disable no-console

function getBattleInitAbilities(fileNames: string[]) {
  const enlir = tryLoadAll();

  const result: any[] = [];
  for (const fileName of fileNames) {
    result.push({});
    const thisResult = result[result.length - 1];
    const captured = JSON.parse(stripBom(fs.readFileSync(fileName).toString()));

    // These scripts will mostly be used to mine JP, so assume Japanese,
    // unless we have an RK Squared style capture with a GL URL.
    const lang =
      captured.url && captured.url.startsWith('http://ffrk.denagames.com/')
        ? LangType.Gl
        : LangType.Jp;
    logger.debug(`Processing ${fileName} as ${lang}`);

    // Handle both RK Squared captures (which include metadata, with the reply
    // as a `data` property) and direct captures.
    const battleInitData = (captured.data || captured) as GetBattleInitData;

    const { battle } = battleInitData;

    const allCharacters: Array<[string, Buddy[] | Supporter[]]> = [
      ['buddy', battle.buddy],
      ['supporter', battle.supporter],
    ];
    for (const [characterType, characterList] of allCharacters) {
      thisResult[characterType] = [];
      for (const character of characterList) {
        const thisCharacterResult: any = {
          name: character.params[0].disp_name,
        };

        const enlirCharacter = enlir.characters ? enlir.characters[+character.id] : null;
        if (enlirCharacter) {
          thisCharacterResult.nameGl = enlirCharacter.name;
        }

        thisCharacterResult.abilities = character.abilities.map(i =>
          convertAbility(battleData[lang], i, enlir),
        );
        thisCharacterResult.soulBreaks = character.soul_strikes.map(i =>
          convertAbility(battleData[lang], i, enlir),
        );

        thisResult[characterType].push(thisCharacterResult);
      }
    }

    thisResult.magicite = [];
    for (const magicite of [...battle.main_beast, ...battle.sub_beast]) {
      const enlirMagicite = enlir.magicite ? enlir.magicite[+magicite.id] : null;
      const thisMagicite: any = {
        nameGl: enlirMagicite ? enlirMagicite.name : null,
        skills: [],
      };
      for (const abilityData of magicite.active_skills) {
        thisMagicite.skills.push(convertAbility(battleData[lang], abilityData, enlir));
      }
      thisResult.magicite.push(thisMagicite);
    }
  }

  return result;
}

if (require.main === module) {
  const result = getBattleInitAbilities(process.argv.slice(2));
  console.log(JSON.stringify(result.length === 1 ? result[0] : result, null, 2));
}
