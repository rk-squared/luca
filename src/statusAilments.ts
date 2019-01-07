import { BattleData, getStatName } from './gameData/battleData';
import { NamedArgs } from './namedArgs';
import { commaSeparated, forceArray, withPlus } from './util';

import * as _ from 'lodash';

/**
 * A status ailment as described within FFRK's battle.js
 */
interface StatusAilment {
  _name: string;
  isCustomParam?: boolean;
  isPrimitiveParamBoost?: boolean;
  isChangeFlightDuration?: boolean;
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
    entry?: string | string[];
    update?: string | string[];
    abilityDoneHook?: string | string[];
    set?: string | string[];
  };

  // One-off parameters for individual handler functions.
  durationTurn?: number;
  flightDuration?: number;
  increaseLevel?: number;
}

/**
 * Status verb used by Enlir.  In general, buffs are "grants," debuffs are
 * "causes," and stat changes don't have a verb.
 */
export enum EnlirStatusVerb {
  GRANTS,
  CAUSES,
  NONE,
}

/**
 * Information about a status ailment within Luca, including what's needed to
 * format it as text
 */
interface StatusAilmentDescription {
  verb: EnlirStatusVerb;

  duration?: number;

  description: string;
}

interface StatusAilmentBundleDescription {
  description: string;
  statusAilmentIds: number[];
}

/**
 * Per-action status ailment options as extracted from NamedArgs
 */
export interface StatusAilmentOptions {
  duration?: number;
}

interface StatusHandlerType {
  isMatch: (status: StatusAilment) => boolean;
  describe: (
    status: StatusAilment,
    args?: NamedArgs,
    options?: StatusAilmentOptions,
  ) => StatusAilmentDescription;
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
        verb: EnlirStatusVerb.NONE,
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

const handlers: { [hookName in keyof StatusAilment['funcMap']]: StatusAilmentHandler } = {
  entry: {
    entryChangeFlightDuration: (statusAilment: StatusAilment) => {
      if (statusAilment.flightDuration !== 10) {
        // Sanity check - a different flight duration might be, e.g., "Reduced
        // Air Time", if it were ever used???
        return null;
      }

      if (statusAilment.durationTurn) {
        return {
          verb: EnlirStatusVerb.GRANTS,
          description: `No Air Time ${statusAilment.durationTurn}`,
        };
      } else if (statusAilment.duration) {
        return {
          verb: EnlirStatusVerb.GRANTS,
          description: 'No Air Time',
        };
      } else {
        return null;
      }
    },
  },

  set: {
    setForIncreaseHeavyChargeLevel: (statusAilment: StatusAilment) => {
      if (!statusAilment.increaseLevel) {
        return null;
      }
      return {
        verb: statusAilment.increaseLevel > 0 ? EnlirStatusVerb.GRANTS : EnlirStatusVerb.CAUSES,
        description: `Heavy Charge ${withPlus(statusAilment.increaseLevel)}`,
      };
    },
    setForUnsetHeavyCharge: () => ({
      verb: EnlirStatusVerb.CAUSES,
      description: 'Heavy Charge =0',
    }),
  },
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

export function getStatusVerb({ verb }: StatusAilmentDescription) {
  return verb === EnlirStatusVerb.GRANTS
    ? 'grants '
    : verb === EnlirStatusVerb.CAUSES
    ? 'causes '
    : '';
}

function describeStatusAilmentImpl(
  battleData: BattleData,
  statusAilmentId: number,
  status: StatusAilment,
  args?: NamedArgs,
  options?: StatusAilmentOptions,
): StatusAilmentDescription | null {
  if (!status) {
    return null;
  }

  for (const { isMatch, describe } of _.values(statusHandlers)) {
    if (isMatch(status)) {
      return describe(status, args, options);
    }
  }

  const checkHooks: Array<keyof StatusAilment['funcMap']> = ['set', 'entry'];
  for (let hook of checkHooks) {
    const handler = handlers[hook];
    const funcNames = status.funcMap[hook];
    if (handler != null && funcNames != null) {
      for (let funcName of forceArray(funcNames)) {
        if (handler[funcName]) {
          return handler[funcName](status);
        }
      }
    }
  }

  // Fall back to default.
  return {
    verb: isCommonBuff(battleData, statusAilmentId)
      ? EnlirStatusVerb.GRANTS
      : EnlirStatusVerb.CAUSES,
    description: _.startCase(_.camelCase(status._name)),
  };
}

export function describeStatusAilment(
  battleData: BattleData,
  statusAilmentId: number,
  args?: NamedArgs,
  options?: StatusAilmentOptions,
): StatusAilmentDescription | null {
  const status = battleData.extra.statusAilments[statusAilmentId];
  const result = describeStatusAilmentImpl(battleData, statusAilmentId, status, args, options);
  if (result && options && options.duration) {
    result.duration = options.duration;
  }
  return result;
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
