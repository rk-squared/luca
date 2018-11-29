import { battleActionDetails, NamedArgs } from './battleActionDetails';
import {
  attackId,
  battleData,
  damageTypeLookup,
  describeTarget,
  elementTypeLookup,
  isAprilFoolId,
  schoolTypeLookup,
} from './gameData';
import { BuddyAbility, Options } from './schemas/get_battle_init_data';

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

export const actionLookup: { [i: number]: ActionMapItem } = _.fromPairs(
  battleData.ns.battle.AbilityFactory.actionMap.map((i: any) => [i.actionId, i]),
) as any;

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

export function getBattleActionDetails(actionId: number) {
  if (!actionLookup[actionId]) {
    return null;
  }
  const action = actionLookup[actionId];

  const actionName = action.className;
  if (!battleActionDetails[actionName]) {
    return null;
  }
  return battleActionDetails[actionName];
}

export function getNamedArgs(actionId: number, options: Options): NamedArgs | null {
  const action = actionLookup[actionId];
  const details = getBattleActionDetails(actionId);
  if (!action || !details) {
    return null;
  }

  const args = getArgs(options);

  // Map arguments that are specified in FFRK JS code and that we manually
  // define in our own TS code to match.
  const result: NamedArgs = _.fromPairs(
    _.map(details.args, (value, key) => [key, args[value as number]]),
  );

  // Map arguments that are specified in FFRK actionMap options.
  if (action.elements && action.elements.args.length) {
    result.elements = _.filter(action.elements.args.map(i => args[i]));
  }
  if (action.ignoresReflectionArg) {
    result.ignoresReflection = args[action.ignoresReflectionArg];
  }
  if (action.ignoresMirageAndMightyGuardArg) {
    result.ignoresMirageAndMightyGuard = args[action.ignoresMirageAndMightyGuardArg];
  }
  if (action.ignoresStatusAilmentsBarrierArg) {
    result.ignoresStatusAilmentsBarrier = args[action.ignoresStatusAilmentsBarrierArg];
  }
  if (action.burstAbilityArgs && action.burstAbilityArgs.length) {
    result.burstAbility = _.filter(action.burstAbilityArgs.map(i => args[i]));
  }

  return result;
}

export function getMultiplier(args: NamedArgs | null): number | null {
  if (args && args.barrageNum != null && args.damageFactor) {
    return ((args.barrageNum || 1) * args.damageFactor) / 100;
  } else {
    return null;
  }
}

export function getElements(args: NamedArgs | null): string | null {
  if (!args) {
    return null;
  } else if (args.elements && args.elements.length) {
    return args.elements.map(i => elementTypeLookup[i]).join(', ');
  } else if (args.matkElement) {
    return elementTypeLookup[args.matkElement];
  } else {
    return null;
  }
}

export function getAbilityDescription(
  actionId: number,
  options: Options,
  args: NamedArgs | null,
): string | null {
  const details = getBattleActionDetails(actionId);
  if (details && args) {
    return details.formatEnlir(options, args);
  } else {
    return null;
  }
}

const toBool = (value: string | number) => !!+value;
const toBoolOrNull = (value: string | number | undefined) => (value == null ? null : toBool(value));
const msecToSec = (msec: string | number) => +msec / 1000;

export function convertAbility(abilityData: BuddyAbility): any {
  const { options } = abilityData;

  const toDo = null; // TODO: Resolve these

  if (options.alias_name !== '' && options.alias_name !== options.name) {
    throw new Error(`Received unexpected alias ${options.alias_name} for ${options.name}`);
  }

  if (+abilityData.ability_id === attackId && options.name === 'Attack') {
    return null;
  }
  if (isAprilFoolId(+abilityData.ability_id)) {
    return null;
  }

  const school = schoolTypeLookup[+abilityData.category_id] || null;
  const details = getBattleActionDetails(+abilityData.action_id);
  const args = getNamedArgs(+abilityData.action_id, options);

  // Not yet used:
  // const breaksDamageCap = toBool(options.max_damage_threshold_type);

  // Omit options.target_death; it corresponds to TARGET_DEATH, but abilities'
  // effects make it obvious whether they can target dead allies.

  return {
    school,
    name: options.name,
    rarity: toDo,
    type: damageTypeLookup[+abilityData.exercise_type],
    target: describeTarget(
      options.target_range,
      options.target_segment,
      options.active_target_method,
    ),
    formula: details ? details.formula : null,
    multiplier: getMultiplier(args),
    element: getElements(args),
    time: msecToSec(options.cast_time),
    effects: getAbilityDescription(+abilityData.action_id, options, args),
    counter: toBoolOrNull(options.counter_enable),
    autoTarget: toDo,
    sb: options.ss_point == null ? null : +options.ss_point,
    uses: toDo,
    max: toDo,
    orbs: toDo,
    introducingEvent: toDo,
    nameJp: toDo,
    id: +abilityData.ability_id,
    gl: true,
    args: getNamedArgs(+abilityData.action_id, options),
  };
}
