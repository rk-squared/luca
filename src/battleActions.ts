import { battleData, conf, elementTypeLookup, targetRangeLookup } from './gameData';
import { Options } from './schemas/get_battle_init_data';

import * as converter from 'number-to-words';

import * as _ from 'lodash';

export interface NamedArgs {
  damageFactor?: number;
  barrageNum?: number;
  atkType?: number;
  forceHit?: number;
  isSameTarget?: number;
  healHpFactor?: number;
  elements?: number[];
}

interface BattleActionDetails {
  formula?: 'Physical' | 'Magical' | 'Hybrid';

  /**
   * Map from args1..args30 to named arguments.
   */
  args: { [key in keyof NamedArgs]: number };

  formatEnlir: (options: Options, args: NamedArgs) => string;
}

const toEuroFixed = (value: number) => value.toFixed(2).replace('.', ',');

function formatEnlirAttack(options: Options, args: NamedArgs): string {
  const target = targetRangeLookup[options.target_range];
  const count = _.upperFirst(converter.toWords(args.barrageNum || 0));
  const who = target === 'SELF' || target === 'SINGLE' ? 'single' : 'group';
  const range = args.atkType === conf.ATK_TYPE.INDIRECT ? 'ranged ' : '';
  const multiplier = toEuroFixed((args.damageFactor || 0) / 100);

  let desc;
  if (args.barrageNum === 1) {
    desc = `${count} ${who} ${range}attack (${multiplier})`;
  } else {
    desc = `${count} ${who} ${range}attacks (${multiplier} each)`;
  }

  if (args.forceHit) {
    desc += ', 100% hit rate';
  }

  return desc;
}

export const battleActionDetails: { [actionName: string]: BattleActionDetails } = {
  PhysicalAttackMultiAndHealHpByHitDamageAction: {
    formula: 'Physical',
    args: {
      damageFactor: 1,
      barrageNum: 2,
      atkType: 3,
      forceHit: 4,
      isSameTarget: 6,
      healHpFactor: 7,
    },
    formatEnlir(options: Options, args: NamedArgs): string {
      return (
        formatEnlirAttack(options, args) +
        `, heals the user for ${args.healHpFactor}% of the damage dealt`
      );
    },
  },
};

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
  const result = _.fromPairs(_.map(details.args, (value, key) => [key, args[value as number]]));
  if (action.elements && action.elements.args.length) {
    result.elements = _.filter(action.elements.args.map(i => args[i]));
  }
  return result;
}

export function getMultiplier(args: NamedArgs | null): number | null {
  if (args && args.barrageNum && args.damageFactor) {
    return (args.barrageNum * args.damageFactor) / 100;
  } else {
    return null;
  }
}

export function getElements(args: NamedArgs | null): string | null {
  if (args && args.elements && args.elements.length) {
    return args.elements.map(i => elementTypeLookup[i]).join(', ');
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
