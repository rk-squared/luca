import * as _ from 'lodash';
import { LangType } from './util';

/**
 * Limited definition of battle.json, which we process from battle.js then add
 * our own `extra` property.  It's involved enough that we don't want to
 * duplicate all of that in TypeScript right now.
 */
interface BattleDataType {
  ns: {
    battle: {
      util: any;
      Conf: any;
      AbilityFactory: any;
      Config: any;
      StatusAilmentConfig: any;
    };
  };
  env: {};
  extra: {
    statusAilments: any;
    statusAilmentBundles: any;
  };
}

const rawBattleData: { [lang in LangType]: BattleDataType } = {
  [LangType.Gl]: require('./gl/battle.json'),
  [LangType.Jp]: require('./jp/battle.json'),
};

function makeLookup<T extends string>(enumType: any) {
  const result: { [s: string]: T } = {};
  for (const i of Object.keys(enumType)) {
    result[enumType[i as any]] = i as T;
  }
  return result;
}

/**
 * Damage codes.  Aka "EXERCISE_TYPE."  These can be found in battle.js.
 */
export enum DamageType {
  // noinspection JSUnusedGlobalSymbols
  PHY = 1,
  WHT = 3,
  BLK = 4,
  BLU = 5,
  SUM = 6,
  NAT = 7, // aka "Inborn"
  NIN = 8,
  NONE = 9,
}

export enum ElementType {
  // noinspection JSUnusedGlobalSymbols
  Fire = 100,
  Ice = 101,
  Lightning = 102,
  Earth = 103,
  Wind = 104,
  Water = 105,
  Holy = 106,
  Dark = 107,
  Poison = 108,
  NE = 199,
}

const schoolAlias: { [key: string]: string } = {
  SHOOTER: 'Sharpshooter',
};

const targetLookup: { [range: string]: { [segment: string]: string } } = {
  SINGLE: {
    OPPONENT: 'Single enemy',
    COLLEAGUE: 'Single ally',
    BOTH: 'Single',
    BOTH_EXCEPT_MYSELF: 'Another',
    COLLEAGUE_EXCEPT_MYSELF: 'Another ally',
  },
  ALL: {
    OPPONENT: 'All enemies',
    COLLEAGUE: 'All allies',
    BOTH: 'All',
    BOTH_EXCEPT_MYSELF: 'All others',
    COLLEAGUE_EXCEPT_MYSELF: 'All other ally',
  },
};

function makeBattleDataHelpers(lang: LangType) {
  const data = rawBattleData[lang];
  const conf = data.ns.battle.Conf;

  const result = {
    conf,
    damageTypeLookup: makeLookup(DamageType),
    elementTypeLookup: makeLookup(ElementType),
    attackId: conf.ABILITY_ID_OF.ATTACK,
    isAprilFoolId: (id: number) => id === conf.ABILITY_ID_OF.SKETCH_FOR_APRIL_FOOL_2017,
    schoolTypeLookup: _.fromPairs(
      _.map(conf.ABILITY_CATEGORY_ID, (value, key) => [
        value,
        schoolAlias[key] || _.startCase(_.toLower(key)),
      ]),
    ),
    targetRangeLookup: _.invert(conf.TARGET_RANGE),
    targetSegmentLookup: _.invert(conf.TARGET_SEGMENT),
    activeTargetMethodLookup: _.invert(conf.ACTIVE_TARGET_METHOD),

    describeTarget(
      rangeValue: string | number,
      segmentValue: string | number,
      activeTargetMethodValue: string | number | undefined,
    ): string | null {
      const range = result.targetRangeLookup[rangeValue];
      const segment = result.targetSegmentLookup[segmentValue];
      if (range === 'SELF') {
        return 'Self';
      } else if (
        range === 'SINGLE' &&
        segment === 'OPPONENT' &&
        activeTargetMethodValue != null &&
        result.activeTargetMethodLookup[activeTargetMethodValue] === 'BOTH_DISABLE'
      ) {
        return 'Random enemies';
      } else if (targetLookup[range]) {
        return targetLookup[range][segment] || null;
      } else {
        return null;
      }
    },
  };

  return result;
}

type BattleDataHelpers = ReturnType<typeof makeBattleDataHelpers>;
export type BattleData = BattleDataType & BattleDataHelpers;

export const battleData: { [lang in LangType]: BattleData } = {
  [LangType.Gl]: { ...rawBattleData[LangType.Gl], ...makeBattleDataHelpers(LangType.Gl) },
  [LangType.Jp]: { ...rawBattleData[LangType.Jp], ...makeBattleDataHelpers(LangType.Jp) },
};
