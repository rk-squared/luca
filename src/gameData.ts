import * as _ from 'lodash';
import { vsprintf } from 'sprintf-js';

import { NamedArgs } from './battleActionDetails';
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

/**
 * Maps target_range + target_segment values to [full description, noun]
 * tuples.
 */
const targetLookup: { [range: string]: { [segment: string]: [string, string] } } = {
  SINGLE: {
    OPPONENT: ['Single enemy', 'enemy'],
    COLLEAGUE: ['Single ally', 'ally'],
    BOTH: ['Single', ''],
    BOTH_EXCEPT_MYSELF: ['Another', 'other'],
    COLLEAGUE_EXCEPT_MYSELF: ['Another ally', 'other ally'],
  },
  ALL: {
    OPPONENT: ['All enemies', 'enemies'],
    COLLEAGUE: ['All allies', 'allies'],
    BOTH: ['All', ''],
    BOTH_EXCEPT_MYSELF: ['All others', 'others'],
    COLLEAGUE_EXCEPT_MYSELF: ['All other allies', 'other allies'],
  },
};

// noinspection SpellCheckingInspection
const targetMethodDescription: { [targetMethod: string]: string | null } = {
  HP_RATIO_DESC: 'Highest HP%% %s',
  HP_RATIO_ASC: 'Lowest HP%% %s',
  SA_RANDOM: 'Random %s without status',
  DIS_SA_RANDOM: 'Random %s without status',
  RANDOM: 'Random %s',
  NOTHING: null,
  HP_DESC: 'Lowest HP %s',
  HP_ASC: 'Highest HP %s',
  ESNA: 'Random %s with status',
  DISPEL: 'Random %s with status',

  // Unconfirmed
  MP_RANDOM: '%s',

  // Used by, e.g., Porom's Curaise BSB CMD1
  MARAISE: '%1$s with KO or lowest HP%% %1$s',

  // Unconfirmed
  LOT_BY_HP_RATE: 'Highest HP%% %s',

  // Used by, e.g., Death.  It perhaps means "vulnerable enemy"?
  SA_DEF_ATTRIBUTE_COUNT_AND_HAS_SA_BUNDLE_COUNT_SUM_ASC: 'Random %s',

  // Unconfirmed - treating as above for now
  SA_PARALYSIS_AND_SILENCE_DEF_ATTRIBUTE_COUNT_AND_HAS_SA_BUNDLE_COUNT_SUM_ASC: 'Random %s',

  // These are all unconfirmed.
  BUDDY_SMART: 'Smart %s',
  AI_SMART: 'Smart %s',
  AI_SMART_IGNORE_REFRECTION: 'Smart %s',
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
    targetMethodLookup: _.invert(conf.TARGET_METHOD),

    describeTarget(
      rangeValue: string | number,
      segmentValue: string | number,
      activeTargetMethodValue: string | number | undefined,
    ): string | null {
      const range = result.targetRangeLookup[rangeValue];
      const segment = result.targetSegmentLookup[segmentValue];
      const activeMethod = activeTargetMethodValue
        ? result.activeTargetMethodLookup[activeTargetMethodValue]
        : null;
      // This function is ugly - I'm still unclear on the relationship between
      // target segment and active target method.  For example, Ultra Cure gives
      // a segment of colleague, but its active target method allows it to
      // target enemies.
      if (range === 'SELF') {
        return 'Self';
      } else if (range === 'SINGLE' && activeMethod && activeMethod !== 'BOTH_DISABLE') {
        return activeMethod === 'BOTH_ENABLE'
          ? 'Single'
          : activeMethod === 'OPPONENT_DISABLE'
          ? 'Single ally'
          : 'Single enemy';
      } else if (range === 'SINGLE' && segment === 'OPPONENT' && activeMethod === 'BOTH_DISABLE') {
        return 'Random enemies';
      } else if (targetLookup[range]) {
        const lookupResult = targetLookup[range][segment];
        return lookupResult ? lookupResult[0] : null;
      } else {
        return null;
      }
    },

    describeTargetMethod(
      rangeValue: string | number,
      segmentValue: string | number,
      activeTargetMethodValue: string | number | undefined,
      targetMethodValue: string | number,
    ): string | null {
      const range = result.targetRangeLookup[rangeValue];
      const segment = result.targetSegmentLookup[segmentValue];
      const method = result.targetMethodLookup[targetMethodValue];
      const methodDescription = targetMethodDescription[method];
      if (range === 'SELF' || !methodDescription) {
        return result.describeTarget(rangeValue, segmentValue, activeTargetMethodValue);
      } else {
        const lookupResult = targetLookup[range][segment];
        return lookupResult
          ? _.upperFirst(vsprintf(methodDescription, [lookupResult[1]])).trim()
          : null;
      }
    },
  };

  return result;
}

/**
 * Battle action details as automatically processed from battle.js by
 * get-battle-args.js.  Properly belongs in battleActionDetails.js, but putting
 * it here lets us keep all of our JSON data grouped together.
 */
export interface BattleActionArgs {
  /**
   * Map from args1..args30 to named arguments.
   */
  args: { [key in keyof NamedArgs]: number };

  multiArgs?: { [key in keyof NamedArgs]: number[] };
}

// FIXME: This isn't type-checked properly - TypeScript lets me pass a BattleData in place of an ActionMap
type BattleDataHelpers = ReturnType<typeof makeBattleDataHelpers>;
export type BattleData = BattleDataType &
  BattleDataHelpers & {
    battleActionArgs: { [actionName: string]: BattleActionArgs };
  };

export const battleData: { [lang in LangType]: BattleData } = {
  [LangType.Gl]: {
    ...rawBattleData[LangType.Gl],
    ...makeBattleDataHelpers(LangType.Gl),
    battleActionArgs: require('./gl/battleArgs.json'),
  },
  [LangType.Jp]: {
    ...rawBattleData[LangType.Jp],
    ...makeBattleDataHelpers(LangType.Jp),
    battleActionArgs: require('./jp/battleArgs.json'),
  },
};
