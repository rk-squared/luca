import { battleData } from './gameData';
import { Options } from './schemas/get_battle_init_data';

import * as _ from 'lodash';

export const battleActionArgs: { [actionName: string]: { [key: string]: number } } = {
  PhysicalAttackMultiAndHealHpByHitDamageAction: {
    damageFactor: 1,
    barrageNum: 2,
    atkType: 3,
    forceHit: 4,
    isSameTarget: 6,
    healHpFactor: 7,
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
    useStatusAilmentsId: boolean;
    args: number[];
    bundleArgs: number[];
  };
  unsetSa?: {
    useStatusAilmentsId: boolean;
    args: number[];
    bundleArgs: number[];
  };
  isPossibleContainMagicDamage?: boolean;
  ignoresMirageAndMightyGuardArg?: number;
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

export function getNamedArgs(actionId: number, options: Options): any {
  if (!actionLookup[actionId]) {
    return null;
  }

  const action = actionLookup[actionId];
  const actionName = action.className;
  if (!battleActionArgs[actionName]) {
    return null;
  }

  const args = getArgs(options);
  const result = _.fromPairs(
    _.map(battleActionArgs[actionName], (value, key) => [key, args[value]]),
  );
  if (action.elements && action.elements.args.length) {
    result.elements = action.elements.args.map(i => args[i]);
  }
  return result;
}
