import * as converter from 'number-to-words';

import { conf, targetRangeLookup } from './gameData';
import { Options } from './schemas/get_battle_init_data';
import { toEuroFixed } from './util';

import * as _ from 'lodash';
import { describeStatusAilment, describeStatusAilmentBundle } from './statusAilments';

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

interface BattleActionDetails {
  formula?: 'Physical' | 'Magical' | 'Hybrid';

  /**
   * Map from args1..args30 to named arguments.
   */
  args: { [key in keyof NamedArgs]: number };

  multiArgs?: { [key in keyof NamedArgs]: number[] };

  formatEnlir: (options: Options, args: NamedArgs) => string;
}

function formatEnlirAttack(options: Options, args: NamedArgs): string {
  const target = targetRangeLookup[options.target_range];
  const count = _.upperFirst(converter.toWords(args.barrageNum || 0));
  const who = target === 'SELF' || target === 'SINGLE' ? 'single' : 'group';
  const range = args.atkType === conf.ATK_TYPE.INDIRECT ? 'ranged ' : '';
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

  return desc;
}

function formatEnlirHeal(options: Options, args: NamedArgs): string {
  let result = 'Restores HP';
  if (args.factor) {
    result += ` (${args.factor})`;
  }
  result += ', damages undeads';
  return result;
}

function formatSelfStatus(args: NamedArgs): string {
  const status = describeStatusAilment(args.selfSaId as number);
  if (!status) {
    return 'grants unknown status to the user';
  } else {
    return (status.isBuff ? 'grants' : 'causes') + ` ${status.description} to the user`;
  }
}

function formatStatuses(statusAilmentIds?: number[], bundleIds?: number[]): string {
  return _.filter(
    _.flatten([
      (statusAilmentIds || []).map(i => _.get(describeStatusAilment(i), 'description')),
      (bundleIds || []).map(i => _.get(describeStatusAilmentBundle(i), 'description')),
    ]),
  ).join(', ');
}

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
    formatEnlir(options: Options, args: NamedArgs): string {
      return (
        formatEnlirHeal(options, args) +
        `, removes ${formatStatuses(args.unsetSaId, args.unsetSaBundle)}`
      );
    },
  },
  MagicAttackMultiAction: {
    formula: 'Magical',
    args: {
      // TODO: setDamageCalculateParamAdjustConf(8, [9, 10, 11, 12])
      damageFactor: 1,
      matkElement: 2,
      minDamageFactor: 3, // TODO: implement
      barrageNum: 4,
      isSameTarget: 5,
      situationalRecalculateDamageHookType: 7, // TODO: implement
      damageCalculateTypeByAbility: 13, // TODO: implement
      matkExponentialFactor: 14, // TODO: implement
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
    formatEnlir(options: Options, args: NamedArgs): string {
      return (
        formatEnlirAttack(options, args) +
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
    formatEnlir(options: Options, args: NamedArgs): string {
      let result = formatEnlirAttack(options, args);
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
    formatEnlir(options: Options, args: NamedArgs): string {
      let result = formatEnlirAttack(options, args);
      result += ', ' + formatSelfStatus(args);
      return result;
    },
  },
};
