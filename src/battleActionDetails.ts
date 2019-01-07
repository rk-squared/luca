import * as converter from 'number-to-words';

import { ActionLookup, ActionMapItem } from './gameData/actionMap';
import { BattleActionArgs, BattleData } from './gameData/battleData';
import { logger } from './logger';
import { NamedArgs } from './namedArgs';
import { Options } from './schemas/get_battle_init_data';
import {
  getStatusAilmentBundleDetails,
  getStatusAilmentDetails,
  getStatusVerb,
} from './statusAilments';
import { LangType, toEuroFixed } from './util';

import * as _ from 'lodash';

export interface BattleActionDetails extends BattleActionArgs {
  formula?: 'Physical' | 'Magical' | 'Hybrid';

  formatEnlir: (battleData: BattleData, options: Options, args: NamedArgs) => string;
}

/**
 * Checks whether the given ability is part of a soul break.  Enlir
 * omits certain details (like "damages undeads" or "100% hit rate") for
 * soul breaks.
 */
function isSoulBreak(options: Options, args: NamedArgs): boolean {
  // Hack: We don't have direct access to whether options plus args are an
  // ability or soul break, but checking whether it can be countered seems to
  // be a reliable indication.
  return !(options.counter_enable && +options.counter_enable);
}

function formatEnlirAttack(battleData: BattleData, options: Options, args: NamedArgs): string {
  const target = battleData.targetRangeLookup[options.target_range];
  const count = _.upperFirst(converter.toWords(args.barrageNum || 1));
  const who = target === 'SELF' || target === 'SINGLE' ? 'single' : 'group';
  const range = args.atkType === battleData.conf.ATK_TYPE.INDIRECT ? 'ranged ' : '';
  const jump = args.isFlightAttack ? 'jump ' : '';
  const multiplier = toEuroFixed((args.damageFactor || 0) / 100);

  let desc = `${count} ${who} ${range}${jump}`;
  if (!args.barrageNum || args.barrageNum === 1) {
    desc += `attack (${multiplier})`;
  } else {
    desc += `attacks (${multiplier} each)`;
  }

  if (options.max_damage_threshold_type && +options.max_damage_threshold_type) {
    desc += ' capped at 99999';
  }

  if (args.forceHit && !isSoulBreak(options, args)) {
    desc += ', 100% hit rate';
  }
  if (args.critical) {
    desc += `, ${args.critical}% additional critical chance`;
  }

  if (options.status_ailments_id && options.status_ailments_id !== '0') {
    const statusId = +options.status_ailments_id;
    const status = getStatusAilmentDetails(battleData, statusId, args);
    let statusName: string;
    if (!status) {
      logger.warn(`Unknown status ID ${statusId}`);
      statusName = `unknown status ${statusId}`;
    } else {
      statusName = status.description;
    }
    desc += `, causes ${statusName} (${options.status_ailments_factor}%)`;
  }

  return desc;
}

function formatEnlirHeal(battleData: BattleData, options: Options, args: NamedArgs): string {
  let result = 'Restores HP';

  if (args.factor) {
    result += ` (${args.factor})`;
  }

  // Enlir displays "damages undeads" for abilities and burst commands but not
  // soul breaks.
  if (!isSoulBreak(options, args)) {
    result += ', damages undeads';
  }

  return result;
}

function formatSelfStatus(battleData: BattleData, args: NamedArgs): string {
  const statusId = args.selfSaId as number;
  const status = getStatusAilmentDetails(battleData, statusId, args);
  if (!status) {
    logger.warn(`Unknown status ID ${statusId}`);
    return 'grants unknown status to the user';
  } else {
    return `${getStatusVerb(status)}${status.description} to the user`;
  }
}

function formatStatuses(
  battleData: BattleData,
  statusAilmentIds?: number[],
  bundleIds?: number[],
  args?: NamedArgs,
): string {
  return _.filter(
    _.flatten([
      (statusAilmentIds || []).map(i =>
        _.get(getStatusAilmentDetails(battleData, i, args), 'description'),
      ),
      (bundleIds || []).map(i =>
        _.get(getStatusAilmentBundleDetails(battleData, i), 'description'),
      ),
    ]),
  ).join(', ');
}

export const battleActionArgs: {
  [lang in LangType]: { [actionName: string]: BattleActionArgs }
} = {
  [LangType.Gl]: require('./gl/battleArgs.json'),
  [LangType.Jp]: require('./jp/battleArgs.json'),
};

export const battleActionDetails: { [actionName: string]: BattleActionDetails } = {
  HealHpAction: {
    formula: 'Magical',
    args: {
      factor: 1,
      matkElement: 2,
      damageFactor: 3,
    },
    formatEnlir: formatEnlirHeal,
  },

  HealHpAndCustomParamAction: {
    args: {
      factor: 1,
      matkElement: 2,
      damageFactor: 3,
      statusAilmentsBoostIsAbsolute: 6,
      statusAilmentsOptionsDuration: 5,
      statusAilmentsBoostValue: 4,
    },
    multiArgs: {},
    formatEnlir(battleData: BattleData, options: Options, args: NamedArgs): string {
      return (
        formatEnlirHeal(battleData, options, args) +
        ', ' +
        formatStatuses(battleData, [+options.status_ailments_id], [], args)
      );
    },
  },

  HealHpAndHealSaAction: {
    formula: 'Magical',
    args: {
      factor: 1,
      matkElement: 2,
      damageFactor: 3,
    },
    formatEnlir(battleData: BattleData, options: Options, args: NamedArgs): string {
      return (
        formatEnlirHeal(battleData, options, args) +
        `, removes ${formatStatuses(battleData, args.unsetSaId, args.unsetSaBundle)}`
      );
    },
  },

  // This is used for simple single-hit magic attacks, like a magicite's auto-attack.
  MagicAttackAction: {
    args: {
      damageFactor: 1,
      matkElement: 2,
      minDamageFactor: 3,
    },
    multiArgs: {},
    formatEnlir: formatEnlirAttack,
  },

  MagicAttackMultiAction: {
    formula: 'Magical',
    args: {
      damageFactor: 1,
      matkElement: 2,
      minDamageFactor: 3, // TODO: implement
      barrageNum: 4,
      isSameTarget: 5,
      situationalRecalculateDamageHookType: 7, // TODO: implement
      damageCalculateParamAdjust: 8, // TODO: implement
      damageCalculateTypeByAbility: 13, // TODO: implement
      matkExponentialFactor: 14, // TODO: implement
    },
    multiArgs: {
      damageCalculateParamAdjustConf: [9, 10, 11, 12],
    },
    formatEnlir: formatEnlirAttack,
  },

  MagicAttackMultiWithMultiElementAction: {
    formula: 'Magical',
    args: {
      damageFactor: 1,
      minDamageFactor: 2,
      barrageNum: 3,
      isSameTarget: 4,
      matkExponentialFactor: 11,
      damageCalculateTypeByAbility: 10,
      damageCalculateParamAdjust: 12,
    },
    multiArgs: {
      damageCalculateParamAdjustConf: [13, 14, 15, 16, 17, 18],
    },
    formatEnlir: formatEnlirAttack,
  },

  // This is used for simple single-hit physical attacks, like an en-element status's
  // Attack replacement.
  PhysicalAttackElementAction: {
    args: {
      damageFactor: 1,
      atkElement: 2,
      atkType: 3,
      forceHit: 4,
    },
    multiArgs: {},
    formatEnlir: formatEnlirAttack,
  },

  PhysicalAttackMultiAction: {
    args: {
      damageFactor: 1,
      barrageNum: 2,
      atkType: 3,
      forceHit: 4,
      atkElement: 5,
      isSameTarget: 6,
      situationalRecalculateDamageHookType: 9,
      atkExponentialFactor: 16, // TODO: Implement
      critical: 7,
      damageCalculateParamAdjust: 8,
      damageCalculateTypeByAbility: 14,
    },
    multiArgs: {
      damageCalculateParamAdjustConf: [10, 11, 12, 13, 15],
    },
    formatEnlir: formatEnlirAttack,
  },

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
    formatEnlir(battleData: BattleData, options: Options, args: NamedArgs): string {
      return (
        formatEnlirAttack(battleData, options, args) +
        `, heals the user for ${args.healHpFactor}% of the damage dealt`
      );
    },
  },

  PhysicalAttackMultiAndHpBarterAndSelfSaAction: {
    formula: 'Physical',
    args: {
      damageFactor: 1,
      barterRate: 2,
      atkType: 4,
      forceHit: 5,
      barrageNum: 6,
      isSameTarget: 7,
      selfSaBundleId: 9,
      selfSaOptionsDuration: 10,
      ignoresAttackHit: 11,
      selfSaAnimationFlag: 12,
    },
    formatEnlir(battleData: BattleData, options: Options, args: NamedArgs): string {
      let result = formatEnlirAttack(battleData, options, args);
      if (args.barterRate) {
        result += `, damages the user for ${args.barterRate / 10}% max HP`;
      }
      // TODO: Implement status ailments
      return result;
    },
  },

  PhysicalAttackMultiAndSelfSaAction: {
    formula: 'Physical',
    args: {
      damageFactor: 1,
      barrageNum: 2,
      atkType: 3,
      forceHit: 4,
      isSameTarget: 6,
      selfSaId: 7,
      ignoresAttackHit: 8,
      selfSaOptionsDuration: 9,
      selfSaAnimationFlag: 10,
      damageCalculateParamAdjust: 12,
      critical: 17,
    },
    multiArgs: {
      damageCalculateParamAdjustConf: [13, 14],
    },
    formatEnlir(battleData: BattleData, options: Options, args: NamedArgs): string {
      let result = formatEnlirAttack(battleData, options, args);
      result += ', ' + formatSelfStatus(battleData, args);
      return result;
    },
  },

  PhysicalAttackMultiWithMultiElementAction: {
    args: {
      damageFactor: 1,
      barrageNum: 2,
      atkType: 3,
      forceHit: 4,
      isSameTarget: 5,
      criticalCoefficient: 10,
      critical: 19,
      damageCalculateParamAdjust: 11,
    },
    multiArgs: {
      damageCalculateParamAdjustConf: [12, 13, 14, 15, 16, 17, 18],
    },
    formatEnlir: formatEnlirAttack,
  },

  // TranceAction: {
  //   args: {
  //     wrappedAbilityId: 1,
  //     optionalSelfSaId: 9,
  //     saSelfOptionsDuration: 6,
  //   },
  //   multiArgs: {
  //     spareReceptorIds: [3, 5],
  //     boostsRate: [7, 7, 7, 7, 7, 7, 7, 8],
  //   },
  // },
};

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
