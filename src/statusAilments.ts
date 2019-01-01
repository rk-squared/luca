import { NamedArgs } from './battleActionDetails'; // FIXME: Circular dependency
import { BattleData, getStatName } from './gameData';
import { withPlus, commaSeparated } from './util';

import * as _ from 'lodash';

interface StatusAilment {
  _name: string;
  isCustomParam?: boolean;
  isPrimitiveParamBoost?: boolean;
  canNotSetToEnemy?: boolean;

  exclusive: {
    /**
     * Array of status ailment IDs that this is exclusive with.
     */
    types: number[];
  };

  /**
   * Duration equals (c + a * user's MND + b * opponent's MND) msec.
   */
  duration?: {
    a: number;
    b: number;
    c: number;
  };

  boosts: Array<{
    paramName: string;
    rate?: number;
    absolute?: number;
  }>;

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

  /**
   * Is this "neutral"?  Neutral status ailments aren't inherently buffs or
   * debuffs, so they should be described accordingly where possible.  Stat
   * changes can be good or bad, so they fall under this category.
   */
  isNeutral: boolean;

  duration?: number;

  description: string;
}

interface StatusAilmentBundleDescription {
  description: string;
  statusAilmentIds: number[];
}

interface StatusHandlerType {
  isMatch: (status: StatusAilment) => boolean;
  describe: (status: StatusAilment, args?: NamedArgs) => StatusAilmentDescription;
}

export const statusHandlers: { [key: string]: StatusHandlerType } = {
  genericStatBuff: {
    isMatch: (status: StatusAilment) =>
      !!(
        status.isPrimitiveParamBoost &&
        status.boosts &&
        status._name === 'CUSTOM_' + status.boosts.map(i => i.paramName.toUpperCase()).join('_')
      ),
    describe: (status: StatusAilment, args?: NamedArgs) => {
      let description = commaSeparated(status.boosts.map(i => getStatName(i.paramName)));
      if (args && args.statusAilmentsBoostValue) {
        description +=
          ' ' + args.statusAilmentsBoostValue + (args.statusAilmentsBoostIsAbsolute ? '' : '%');
      }
      return {
        description,
        isBuff: false,
        isNeutral: true,
        duration: args ? args.statusAilmentsOptionsDuration : undefined,
      };
    },
  },
};

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
      isNeutral: false,
      description: `Heavy Charge ${withPlus(statusAilment.increaseLevel)}`,
    };
  },
  setForUnsetHeavyCharge: () => ({
    isBuff: false,
    isNeutral: false,
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

export function getStatusVerb({ isBuff, isNeutral }: StatusAilmentDescription) {
  if (isNeutral) {
    return '';
  } else {
    return isBuff ? 'grants ' : 'causes ';
  }
}

export function describeStatusAilment(
  battleData: BattleData,
  statusAilmentId: number,
  args?: NamedArgs,
): StatusAilmentDescription | null {
  const status = battleData.extra.statusAilments[statusAilmentId];
  if (!status) {
    return null;
  }

  for (const { isMatch, describe } of _.values(statusHandlers)) {
    if (isMatch(status)) {
      return describe(status, args);
    }
  }

  if (status.funcMap.set && setterHandlers[status.funcMap.set]) {
    return setterHandlers[status.funcMap.set](status);
  }

  // Fall back to default.
  return {
    isBuff: isCommonBuff(battleData, statusAilmentId),
    isNeutral: false,
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
