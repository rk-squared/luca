#!/usr/bin/env npx ts-node

import * as fs from 'fs-extra';

import { attackId, damageTypeLookup, schoolTypeLookup } from './gameData';

// tslint:disable no-console

/*
const bar = {
    category_id: '13',
    options: {
      arg4: '2',
      min_damage_threshold_type: '0',
      arg7: '0',
      arg20: '0',
      status_ailments_id: '0',
      arg18: '0',
      ss_point: '65',
      arg28: '0',
      arg12: '0',
      arg22: '0',
      arg17: '0',
      arg15: '0',
      arg1: '2600',
      arg10: '0',
      arg21: '0',
      arg11: '0',
      name: 'Raging Storm',
      arg24: '0',
      arg2: '104',
      arg5: '1',
      alias_name: '',
      panel_name: 'Raging{n}Storm',
      arg14: '50',
      target_segment: '1',
      arg25: '0',
      arg30: '0',
      arg9: '0',
      arg13: '1',
      arg19: '0',
      arg27: '0',
      counter_enable: '1',
      arg23: '0',
      arg29: '0',
      target_range: '1',
      arg26: '0',
      target_death: '1',
      arg3: '0',
      cast_time: '825',
      arg8: '0',
      max_damage_threshold_type: '0',
      arg6: '1',
      target_method: '2',
      active_target_method: '4',
      status_ailments_factor: '0',
      arg16: '0',
      ability_animation_id: '40360'
    },
    exercise_type: '8',
    action_id: '16',
    ability_id: '30231111'
  };
*/

function getArgs(options: any): number[] {
  const result = [];
  for (let i = 1; i <= 30; i++) {
    const arg = `arg${i}`;
    if (options[arg] == null) {
      throw new Error(`Missing ${arg}`);
    }

    const value = options[arg];
    if (isNaN(value) || !Number.isInteger(+value)) {
      throw new Error(`Bad ${arg} "${value}`);
    }

    result[i] = +value;
  }
  return result;
}

function convertAbility(abilityData: any): any {
  const { options } = abilityData;
  // @ts-ignore
  const args = getArgs(options);

  const toDo = null; // TODO: Resolve these

  if (options.alias_name !== '' && options.alias_name !== options.name) {
    throw new Error(`Received unexpected alias ${options.alias_name} for ${options.name}`);
  }

  if (+abilityData.ability_id === attackId && options.name === 'Attack') {
    return null;
  }

  const school = schoolTypeLookup[+abilityData.category_id] || null;

  return {
    school,
    name: options.name,
    rarity: toDo,
    type: damageTypeLookup[+abilityData.exercise_type],
    target: toDo,
    formula: toDo,
    multiplier: toDo,
    element: toDo,
    time: toDo,
    effects: toDo,
    counter: toDo,
    autoTarget: toDo,
    sb: toDo,
    uses: toDo,
    max: toDo,
    orbs: toDo,
    introducingEvent: toDo,
    nameJp: toDo,
    id: +abilityData.ability_id,
    gl: true,
  };
}

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
