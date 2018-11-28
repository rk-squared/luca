import * as converter from 'number-to-words';

import { conf, targetRangeLookup } from './gameData';
import { Options } from './schemas/get_battle_init_data';

import * as _ from 'lodash';

export interface NamedArgs {
  damageFactor?: number;
  barrageNum?: number;
  atkType?: number;
  forceHit?: number;
  isSameTarget?: number;
  healHpFactor?: number;
  barterRate?: number;
  selfStatusAilments?: number;
  selfSaOptionsDuration?: number;
  ignoresAttackHit?: number;
  selfSaAnimationFlag?: number;
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
  if (!args.barrageNum || args.barrageNum === 1) {
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
  PhysicalAttackMultiAndHpBarterAndSelfSaAction: {
    formula: 'Physical',
    args: {
      damageFactor: 1,
      barterRate: 2,
      atkType: 4,
      forceHit: 5,
      barrageNum: 6,
      isSameTarget: 7,
      selfStatusAilments: 9,
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
};
