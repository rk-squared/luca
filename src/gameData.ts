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
  NAT = 7,  // aka "Inborn"
  NIN = 8,
  NONE = 9,
}

export const attackId = conf.ABILITY_ID_OF.ATTACK;
export const schoolTypeLookup = _.fromPairs(_.map(
  conf.ABILITY_CATEGORY_ID,
  (value, key) => [value, _.startCase(_.toLower(key))]
));
export const damageTypeLookup = makeLookup(DamageType);
