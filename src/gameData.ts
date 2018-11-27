import * as _ from 'lodash';

export const battleData = require('./battle.json');

const conf = battleData.ns.battle.Conf;

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

export const attackId = conf.ABILITY_ID_OF.ATTACK;

const schoolAlias: { [key: string]: string } = {
  SHOOTER: 'Sharpshooter',
};
export const schoolTypeLookup = _.fromPairs(
  _.map(conf.ABILITY_CATEGORY_ID, (value, key) => [
    value,
    schoolAlias[key] || _.startCase(_.toLower(key)),
  ]),
);

export const damageTypeLookup = makeLookup(DamageType);

const targetRangeLookup = _.invert(conf.TARGET_RANGE);
const targetSegmentLookup = _.invert(conf.TARGET_SEGMENT);
const activeTargetMethodLookup = _.invert(conf.ACTIVE_TARGET_METHOD);
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
  activeTargetMethodValue: string | number,
): string | null {
  const range = targetRangeLookup[rangeValue];
  const segment = targetSegmentLookup[segmentValue];
  if (range === 'SELF') {
    return 'Self';
  } else if (
    range === 'SINGLE' &&
    segment === 'OPPONENT' &&
    activeTargetMethodLookup[activeTargetMethodValue] === 'BOTH_DISABLE'
  ) {
    return 'Random enemies';
  } else if (targetLookup[range]) {
    return targetLookup[range][segment] || null;
  } else {
    return null;
  }
}
