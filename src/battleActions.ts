import { BattleActionDetails, battleActionDetails, NamedArgs } from './battleActionDetails';
import { BattleActionArgs, BattleData } from './gameData';
import { logger } from './logger';
import {
  BeastActiveSkill,
  BuddyAbility,
  BuddySoulStrike,
  Options,
} from './schemas/get_battle_init_data';

import * as _ from 'lodash';

interface ActionMapItem {
  actionId: number;
  className: string;
  changeCastTimeCondList?: string[];
  elements?: {
    args: number[];
  };
  isAttack?: boolean;
  isHeal?: boolean;
  isHealHp?: boolean;
  isTrance?: boolean;
  enemyTargeting?: number[];
  setSa?: {
    useStatusAilmentsId?: boolean;
    autoConvertSaIdToBundle?: boolean;
    args?: number[];
    bundleArgs: number[];
  };
  unsetSa?: {
    useStatusAilmentsId?: boolean;
    autoConvertSaIdToBundle?: boolean;
    args?: number[];
    bundleArgs: number[];
  };
  isBraveMode?: boolean;
  isPossibleContainMagicDamage?: boolean;
  ignoresMirageAndMightyGuardArg?: number;
  ignoresReflectionArg?: number;
  ignoresStatusAilmentsBarrierArg?: number;
  burstAbilityArgs?: number[];
}

interface ActionLookup {
  [i: number]: ActionMapItem;
}

export function makeActionLookup(battleData: BattleData): { [i: number]: ActionMapItem } {
  return _.fromPairs(
    battleData.ns.battle.AbilityFactory.actionMap.map((i: any) => [i.actionId, i]),
  ) as any;
}

function logMissing(actionLookup: ActionLookup, actionId: number) {
  if (!actionLookup[actionId]) {
    logger.warn(`Unknown action ID ${actionId}`);
  } else {
    logger.warn(`Missing details for action ID ${actionId} (${actionLookup[actionId].className})`);
  }
}

function getArgs(options: Options): number[] {
  const result = [];
  for (let i = 1; i <= 30; i++) {
    const arg = `arg${i}`;
    if (options[arg] == null) {
      throw new Error(`Missing ${arg}`);
    }

    const value = options[arg];
    if (typeof value !== 'string' || isNaN(Number(value)) || !Number.isInteger(+value)) {
      throw new Error(`Bad ${arg} "${value}`);
    }

    result[i] = +value;
  }
  return result;
}

/**
 * Gets details about battle actions for the given action ID.
 *
 * Returns the following:
 * - The action name, if known
 * - The action argument mappings, as automatically extracted from battle.js
 * - The manually maintained action details, including argument mappings,
 *   formatters, etc.
 */
export function getBattleActionDetails(
  battleData: BattleData,
  actionLookup: ActionLookup,
  actionId: number,
): [ActionMapItem | null, BattleActionArgs | null, BattleActionDetails | null] {
  const action = actionLookup[actionId];
  if (!action) {
    return [null, null, null];
  }

  const actionName = action.className;
  const args = battleData.battleActionArgs[actionName];
  const details = battleActionDetails[actionName];
  return [action, args || null, details || null];
}

/**
 * Maps from an FFRK options object (with values like arg1, arg2...) to our
 * NamedArgs (which contains the same values, but with meaningful property
 * names, courtesy of battle.js actions).
 */
export function getNamedArgs(
  battleData: BattleData,
  actionLookup: ActionLookup,
  actionId: number,
  options: Options,
): NamedArgs | null {
  const [action, actionArgs, details] = getBattleActionDetails(battleData, actionLookup, actionId);
  if (!action || !actionArgs || !details) {
    logMissing(actionLookup, actionId);
  }
  if (!action || !actionArgs) {
    return null;
  }
  const argSource = details || actionArgs;

  const args = getArgs(options);

  // Map arguments that are specified in FFRK JS code and that we manually
  // define in our own TS code to match.
  // FIXME: This is ugly.  Refactor and unit test.
  const result: NamedArgs = {
    ..._.fromPairs(_.map(argSource.args, (value, key) => [key, args[value as number]])),
    ..._.fromPairs(
      _.map(argSource.multiArgs, (value, key) => [
        key,
        _.filter((value as number[]).map((i: number) => args[i])),
      ]),
    ),
  };

  // Map arguments that are specified in FFRK actionMap options.
  function tryArg(key: keyof NamedArgs, argNumber: number | undefined) {
    if (argNumber) {
      result[key] = args[argNumber];
    }
  }
  function tryArgList(key: keyof NamedArgs, argNumbers: number[] | undefined) {
    if (argNumbers && argNumbers.length) {
      result[key] = _.filter(argNumbers.map(i => args[i]));
    }
  }
  tryArgList('elements', action.elements && action.elements.args);
  tryArg('ignoresReflection', action.ignoresReflectionArg);
  tryArg('ignoresMirageAndMightyGuard', action.ignoresMirageAndMightyGuardArg);
  tryArg('ignoresStatusAilmentsBarrier', action.ignoresStatusAilmentsBarrierArg);
  tryArgList('burstAbility', action.burstAbilityArgs);
  tryArgList('setSaId', action.setSa && action.setSa.args);
  tryArgList('setSaBundle', action.setSa && action.setSa.bundleArgs);
  tryArgList('unsetSaId', action.unsetSa && action.unsetSa.args);
  tryArgList('unsetSaBundle', action.unsetSa && action.unsetSa.bundleArgs);

  return result;
}

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
): any {
  const { options } = abilityData;
  const actionLookup = makeActionLookup(battleData);

  let alias = null;
  if (options.alias_name !== '' && options.alias_name !== options.name) {
    alias = options.alias_name;
  }

  if (+abilityData.ability_id === battleData.attackId && options.name === 'Attack') {
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
  const args = getNamedArgs(battleData, actionLookup, +abilityData.action_id, options);

  // Not yet used:
  // const breaksDamageCap = toBool(options.max_damage_threshold_type);

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
    id: +abilityData.ability_id,
    action: action ? action.className : null,
    args: getNamedArgs(battleData, actionLookup, +abilityData.action_id, options),
  };
}
