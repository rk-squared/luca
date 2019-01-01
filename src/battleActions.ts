import { getBattleActionDetails } from './battleActionDetails';
import { EnlirAll } from './enlirData';
import { ActionLookup, makeActionLookup } from './gameData/actionMap';
import { BattleData } from './gameData/battleData';
import { getNamedArgs, NamedArgs } from './namedArgs';
import {
  BeastActiveSkill,
  BuddyAbility,
  BuddySoulStrike,
  Options,
} from './schemas/get_battle_init_data';

import * as _ from 'lodash';

export function getMultiplier(args: NamedArgs | null): number | null {
  if (args && args.damageFactor) {
    return ((args.barrageNum || 1) * args.damageFactor) / 100;
  } else {
    return null;
  }
}

export function getElements(battleData: BattleData, args: NamedArgs | null): string | null {
  if (!args) {
    return null;
  } else if (args.elements && args.elements.length) {
    return args.elements.map(i => battleData.elementTypeLookup[i]).join(', ');
  } else if (args.atkElement) {
    return battleData.elementTypeLookup[args.atkElement];
  } else if (args.matkElement) {
    return battleData.elementTypeLookup[args.matkElement];
  } else {
    return null;
  }
}

export function getAbilityDescription(
  battleData: BattleData,
  actionLookup: ActionLookup,
  actionId: number,
  options: Options,
  args: NamedArgs | null,
): string | null {
  const [, , details] = getBattleActionDetails(battleData, actionLookup, actionId);
  if (details && args) {
    return details.formatEnlir(battleData, options, args);
  } else {
    return null;
  }
}

function findInEnlir(enlir: EnlirAll | undefined, id: number) {
  if (!enlir) {
    return null;
  } else if (enlir.abilities && enlir.abilities[id]) {
    return enlir.abilities[id];
  } else if (enlir.soulBreaks && enlir.soulBreaks[id]) {
    return enlir.soulBreaks[id];
  } else {
    return null;
  }
}

const toBool = (value: string | number) => !!+value;
const toBoolOrNull = (value: string | number | undefined) => (value == null ? null : toBool(value));
const msecToSec = (msec: string | number) => +msec / 1000;

/**
 * High-level function to convert JSON for a game "ability" (including soul
 * break or magicite skill) to JSON.
 */
export function convertAbility(
  battleData: BattleData,
  abilityData: BuddyAbility | BuddySoulStrike | BeastActiveSkill,
  enlir?: EnlirAll,
): any {
  const { options } = abilityData;
  const actionLookup = makeActionLookup(battleData);

  const id = +abilityData.ability_id;

  let alias = null;
  if (options.alias_name !== '' && options.alias_name !== options.name) {
    alias = options.alias_name;
  }

  if (+abilityData.ability_id === battleData.attackId) {
    return null;
  }
  if (battleData.isAprilFoolId(+abilityData.ability_id)) {
    return null;
  }

  const school = abilityData.category_id
    ? battleData.schoolTypeLookup[+abilityData.category_id] || null
    : null;
  const [action, , details] = getBattleActionDetails(
    battleData,
    actionLookup,
    +abilityData.action_id,
  );
  const args = getNamedArgs(
    battleData,
    actionLookup,
    +abilityData.action_id,
    +abilityData.ability_id,
    options,
  );

  const enlirSkill = findInEnlir(enlir, id);

  const breaksDamageCap = toBool(options.max_damage_threshold_type);

  // Omit options.target_death; it corresponds to TARGET_DEATH, but abilities'
  // effects make it obvious whether they can target dead allies.

  // Not included: rarity, uses, max, orbs
  // Those apply to what the game UI calls abilities, but what the game UI
  // calls abilities is not the same as what the game JSON calls abilities.

  // Also not included: nameJp, gl, introducingEvent
  // Those need to be handled at a higher level and likely require outside
  // data and/or human intervention.
  return {
    school,
    name: options.name.trim(),
    nameGl: enlirSkill ? enlirSkill.name : null,
    alias: alias ? alias.trim() : alias,
    type: battleData.damageTypeLookup[+abilityData.exercise_type],
    target: battleData.describeTarget(
      options.target_range,
      options.target_segment,
      options.active_target_method,
    ),
    formula: details ? details.formula : null,
    multiplier: getMultiplier(args),
    element: getElements(battleData, args),
    time: msecToSec(options.cast_time),
    effects: getAbilityDescription(battleData, actionLookup, +abilityData.action_id, options, args),
    counter: toBoolOrNull(options.counter_enable),
    autoTarget: battleData.describeTargetMethod(
      options.target_range,
      options.target_segment,
      options.active_target_method,
      options.target_method,
    ),
    sb: options.ss_point == null ? null : +options.ss_point,
    breaksDamageCap,
    statusAilmentsId: +options.status_ailments_id,
    statusAilmentsFactor: +options.status_ailments_factor,
    id,
    action: action ? action.className : null,
    args,
  };
}
