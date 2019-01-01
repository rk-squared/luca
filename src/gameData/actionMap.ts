import { BattleData } from './battleData';

import * as _ from 'lodash';

/**
 * An actionMap item from battle.js's scenes/battle/AbilityFactory module.
 */
export interface ActionMapItem {
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
  isFlightAttack?: boolean;
}

export interface ActionLookup {
  [i: number]: ActionMapItem;
}

export function makeActionLookup(battleData: BattleData): { [i: number]: ActionMapItem } {
  return _.fromPairs(
    battleData.ns.battle.AbilityFactory.actionMap.map((i: any) => [i.actionId, i]),
  ) as any;
}
