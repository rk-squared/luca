import * as converter from 'number-to-words';

import { BattleActionArgs, BattleData } from './gameData';
import { logger } from './logger';
import { Options } from './schemas/get_battle_init_data';
import { describeStatusAilment, describeStatusAilmentBundle } from './statusAilments';
import { LangType, toEuroFixed } from './util';

import * as _ from 'lodash';

export interface NamedArgs {
  damageFactor?: number;
  barrageNum?: number;
  atkType?: number;
  forceHit?: number;
  healHpFactor?: number;
  barterRate?: number;
  selfSaOptionsDuration?: number;
  ignoresAttackHit?: number;
  elements?: number[];
  critical?: number;
  matkElement?: number;
  minDamageFactor?: number;
  situationalRecalculateDamageHookType?: number;
  damageCalculateTypeByAbility?: number;
  matkExponentialFactor?: number;
  ignoresReflection?: number;
  ignoresMirageAndMightyGuard?: number;
  ignoresStatusAilmentsBarrier?: number;
  burstAbility?: number[];

  /**
   * Healing factor.
   */
  factor?: number;

  /**
   * If true, then each hit is done against the same target.
   */
  isSameTarget?: number;

  /**
   * A status ailment ID or status ailment bundle ID (see
   * StatusAilmentsConfig.getBundle) for a status applied to self.
   */
  selfSaBundle?: number;

  /**
   * A single status ailment ID for a status applied to self.
   */
  selfSaId?: number;

  /**
   * Also called hasSelfSaAnimation.
   */
  selfSaAnimationFlag?: number;

  setSaId?: number[];
  setSaBundle?: number[];
  unsetSaId?: number[];
  unsetSaBundle?: number[];

  damageCalculateParamAdjust?: number;
  damageCalculateParamAdjustConf?: number[];
}

export interface BattleActionDetails extends BattleActionArgs {
  formula?: 'Physical' | 'Magical' | 'Hybrid';

  formatEnlir: (battleData: BattleData, options: Options, args: NamedArgs) => string;
}

function formatEnlirAttack(battleData: BattleData, options: Options, args: NamedArgs): string {
  const target = battleData.targetRangeLookup[options.target_range];
  const count = _.upperFirst(converter.toWords(args.barrageNum || 0));
  const who = target === 'SELF' || target === 'SINGLE' ? 'single' : 'group';
  const range = args.atkType === battleData.conf.ATK_TYPE.INDIRECT ? 'ranged ' : '';
  const multiplier = toEuroFixed((args.damageFactor || 0) / 100);

  let desc;
  if (!args.barrageNum || args.barrageNum === 1) {
    desc = `${count} ${who} ${range}attack (${multiplier})`;
  } else {
    desc = `${count} ${who} ${range}attacks (${multiplier} each)`;
  }

  if (args.forceHit) {
    desc += ', 100% hit rate';
  }
  if (args.critical) {
    desc += `, ${args.critical}% additional critical chance`;
  }

  if (options.status_ailments_id && options.status_ailments_id !== '0') {
    const statusId = +options.status_ailments_id;
    const status = describeStatusAilment(battleData, statusId);
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
  result += ', damages undeads';
  return result;
}

function formatSelfStatus(battleData: BattleData, args: NamedArgs): string {
  const statusId = args.selfSaId as number;
  const status = describeStatusAilment(battleData, statusId);
  if (!status) {
    logger.warn(`Unknown status ID ${statusId}`);
    return 'grants unknown status to the user';
  } else {
    return (status.isBuff ? 'grants' : 'causes') + ` ${status.description} to the user`;
  }
}

function formatStatuses(
  battleData: BattleData,
  statusAilmentIds?: number[],
  bundleIds?: number[],
): string {
  return _.filter(
    _.flatten([
      (statusAilmentIds || []).map(i => _.get(describeStatusAilment(battleData, i), 'description')),
      (bundleIds || []).map(i => _.get(describeStatusAilmentBundle(battleData, i), 'description')),
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
      selfSaBundle: 9,
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
      // TODO: setDamageCalculateParamAdjustConf(12, [13, 14])
      damageFactor: 1,
      barrageNum: 2,
      atkType: 3,
      forceHit: 4,
      isSameTarget: 6,
      selfSaId: 7,
      ignoresAttackHit: 8,
      selfSaOptionsDuration: 9,
      selfSaAnimationFlag: 10,
      critical: 17,
    },
    formatEnlir(battleData: BattleData, options: Options, args: NamedArgs): string {
      let result = formatEnlirAttack(battleData, options, args);
      result += ', ' + formatSelfStatus(battleData, args);
      return result;
    },
  },
};
