import { BattleData } from './gameData';
import { withPlus } from './util';

import * as _ from 'lodash';

interface StatusAilment {
  _name: string;
  canNotSetToEnemy: boolean;
  exclusive: {
    types: number[];
  };
  duration?: {
    a: number;
    b: number;
    c: number;
  };
  funcMap: {
    update?: string;
    abilityDoneHook?: string;
    set?: string;
  };

  // One-off parameters for individual handler functions.
  increaseLevel?: number;
}

interface StatusAilmentDescription {
  isBuff: boolean;
  description: string;
}

interface StatusAilmentBundleDescription {
  description: string;
  statusAilmentIds: number[];
}

/**
 * Many of FFRK's status ailments are implemented using funcMap properties to
 * give the names of handler functions.
 *
 * We can key off of these handler functions' names to interpret status
 * ailments instead of hard-coding individual status IDs or trying to parse
 * internal status names.  This interface provides mappings to let us do that.
 */
interface StatusAilmentHandler {
  [functionName: string]: (status: StatusAilment) => StatusAilmentDescription | null;
}

const setterHandlers: StatusAilmentHandler = {
  setForIncreaseHeavyChargeLevel: (statusAilment: StatusAilment) => {
    if (!statusAilment.increaseLevel) {
      return null;
    }
    return {
      isBuff: statusAilment.increaseLevel > 0,
      description: `Heavy Charge ${withPlus(statusAilment.increaseLevel)}`,
    };
  },
  setForUnsetHeavyCharge: () => ({
    isBuff: false,
    description: 'Heavy Charge =0',
  }),
};

// noinspection SpellCheckingInspection
const statusAilmentBundleAliases: { [key: string]: string } = {
  ESNA: 'negative effects',
};

function isInBundle(battleData: BattleData, bundleId: number, statusAilmentId: number) {
  return battleData.extra.statusAilmentBundles[bundleId].ids.indexOf(statusAilmentId) !== -1;
}

export function isCommonBuff(battleData: BattleData, statusAilmentId: number) {
  return isInBundle(battleData, battleData.conf.STATUS_AILMENTS_BUNDLE.ESNA, statusAilmentId);
}

export function isCommonDebuff(battleData: BattleData, statusAilmentId: number) {
  return isInBundle(battleData, battleData.conf.STATUS_AILMENTS_BUNDLE.DISPEL, statusAilmentId);
}

export function describeStatusAilment(
  battleData: BattleData,
  statusAilmentId: number,
): StatusAilmentDescription | null {
  const status = battleData.extra.statusAilments[statusAilmentId];
  if (!status) {
    return null;
  }

  if (status.funcMap.set && setterHandlers[status.funcMap.set]) {
    return setterHandlers[status.funcMap.set](status);
  }

  // Fall back to default.
  return {
    isBuff: isCommonBuff(battleData, statusAilmentId),
    description: _.startCase(_.camelCase(status._name)),
  };
}

export function describeStatusAilmentBundle(
  battleData: BattleData,
  bundleId: number,
): StatusAilmentBundleDescription | null {
  const bundle = battleData.extra.statusAilmentBundles[bundleId];
  if (!bundle) {
    return null;
  }
  return {
    description: statusAilmentBundleAliases[bundle._name] || bundle._name,
    statusAilmentIds: bundle.ids,
  };
}
