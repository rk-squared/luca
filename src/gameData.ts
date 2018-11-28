import * as _ from 'lodash';

export const battleData = require('./battle.json');

export const conf = battleData.ns.battle.Conf;

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
export const damageTypeLookup = makeLookup(DamageType);

export enum ElementType {
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
export const elementTypeLookup = makeLookup(ElementType);

export const attackId = conf.ABILITY_ID_OF.ATTACK;
export const isAprilFoolId = (id: number) => id === conf.ABILITY_ID_OF.SKETCH_FOR_APRIL_FOOL_2017;

const schoolAlias: { [key: string]: string } = {
  SHOOTER: 'Sharpshooter',
};
export const schoolTypeLookup = _.fromPairs(
  _.map(conf.ABILITY_CATEGORY_ID, (value, key) => [
    value,
    schoolAlias[key] || _.startCase(_.toLower(key)),
  ]),
);

export const targetRangeLookup = _.invert(conf.TARGET_RANGE);
export const targetSegmentLookup = _.invert(conf.TARGET_SEGMENT);
export const activeTargetMethodLookup = _.invert(conf.ACTIVE_TARGET_METHOD);
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
export function describeTarget(
  rangeValue: string | number,
  segmentValue: string | number,
  activeTargetMethodValue: string | number | undefined,
): string | null {
  const range = targetRangeLookup[rangeValue];
  const segment = targetSegmentLookup[segmentValue];
  if (range === 'SELF') {
    return 'Self';
  } else if (
    range === 'SINGLE' &&
    segment === 'OPPONENT' &&
    activeTargetMethodValue != null &&
    activeTargetMethodLookup[activeTargetMethodValue] === 'BOTH_DISABLE'
  ) {
    return 'Random enemies';
  } else if (targetLookup[range]) {
    return targetLookup[range][segment] || null;
  } else {
    return null;
  }
}
