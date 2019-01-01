import { getBattleActionDetails } from './battleActionDetails'; // FIXME: Circular import
import { ActionLookup, ActionMapItem } from './gameData/actionMap';
import { BattleData } from './gameData/battleData';
import { logger } from './logger';
import { Options } from './schemas/get_battle_init_data';

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
  criticalCoefficient?: number;
  minDamageFactor?: number;
  situationalRecalculateDamageHookType?: number;
  damageCalculateTypeByAbility?: number;
  ignoresReflection?: number;
  ignoresMirageAndMightyGuard?: number;
  ignoresStatusAilmentsBarrier?: number;
  burstAbility?: number[];

  atkExponentialFactor?: number;
  matkExponentialFactor?: number;

  /**
   * Single physical element.  The elements array is more flexible.
   */
  atkElement?: number;

  /**
   * Single magical element.  The elements array is more flexible.
   */
  matkElement?: number;

  /**
   * Healing factor.
   */
  factor?: number;

  /**
   * If true, then each hit is done against the same target.
   */
  isSameTarget?: number;

  /**
   * Is this a jump attack?  Unlike most named arguments, this is either copied
   * from an ActionMapItem's isFlightAttack property or special-cased using the
   * ExceptionalFlightAttackIds configuration setting.
   */
  isFlightAttack?: boolean;

  statusAilmentsId?: number;

  /**
   * The duration member of the options object for statusAilmentsId.
   */
  statusAilmentsOptionsDuration?: number;

  /**
   * The value parameter to helpers.makeBoostObject
   */
  statusAilmentsBoostValue?: number;

  /**
   * The isAbsolute parameter to helpers.makeBoostObject
   */
  statusAilmentsBoostIsAbsolute?: number;

  /**
   * A status ailment ID or status ailment bundle ID (see
   * StatusAilmentsConfig.getBundle) for a status applied to self.
   */
  selfSaBundleId?: number;

  /**
   * A single status ailment ID for a status applied to self.
   */
  selfSaId?: number;

  optionalSelfSaId?: number;

  /**
   * The duration member of the options object for self status ailments.
   */
  saSelfOptionsDuration?: number;

  /**
   * Also called hasSelfSaAnimation.
   */
  selfSaAnimationFlag?: number;

  setSaId?: number[];
  setSaBundle?: number[];
  unsetSaId?: number[];
  unsetSaBundle?: number[];

  /**
   * Percentage for stat boosts.  These are martialled by action class code in
   * battle.js and merged with the boosts array of the status ailment
   * definition, which provides additional details (such as *which* stats are
   * boosted).
   */
  boostsRate?: number[];

  damageCalculateParamAdjust?: number;
  damageCalculateParamAdjustConf?: number[];

  wrappedAbilityId?: number;

  /**
   * For trance actions (burst soul breaks) and brave soul breaks, these
   * specify which UI panels are swapped out (I think).
   */
  spareReceptorIds?: number[];

  /**
   * For diagnostic/debugging purposes, we support tracking unknown arguments.
   */
  unknown?: { [id: number]: number };
}

function logMissing(actionLookup: ActionLookup, actionId: number) {
  if (!actionLookup[actionId]) {
    logger.warn(`Unknown action ID ${actionId}`);
  } else {
    logger.warn(`Missing details for action ID ${actionId} (${actionLookup[actionId].className})`);
  }
}

function getArgs(options: Options): number[] {
  const result = [];
  for (let i = 1; i <= 30; i++) {
    const arg = `arg${i}`;
    if (options[arg] == null) {
      throw new Error(`Missing ${arg}`);
    }

    const value = options[arg];
    if (typeof value !== 'string' || isNaN(Number(value)) || !Number.isInteger(+value)) {
      throw new Error(`Bad ${arg} "${value}`);
    }

    result[i] = +value;
  }
  return result;
}

function deleteAll<T>(set: Set<T>, items: T[]) {
  items.forEach(i => set.delete(i));
}

function isFlightAttack(battleData: BattleData, abilityId: number, action: ActionMapItem): boolean {
  return (
    action.isFlightAttack ||
    battleData.extra.battleConfig.ExceptionalFlightAttackIds.indexOf(abilityId) !== -1
  );
}

/**
 * Maps from an FFRK options object (with values like arg1, arg2...) to our
 * NamedArgs (which contains the same values, but with meaningful property
 * names, courtesy of battle.js actions).
 */
export function getNamedArgs(
  battleData: BattleData,
  actionLookup: ActionLookup,
  actionId: number,
  abilityId: number,
  options: Options,
): NamedArgs | null {
  const [action, actionArgs, details] = getBattleActionDetails(battleData, actionLookup, actionId);
  if (!action || !actionArgs || !details) {
    logMissing(actionLookup, actionId);
  }
  if (!action || !actionArgs) {
    return null;
  }
  const argSource = details || actionArgs;

  const args = getArgs(options);

  // For diagnostics and development, track the set of argument indexes that we
  // haven't used.
  const unhandledArgs = new Set<number>(_.filter(args.map((value, index) => (value ? index : 0))));

  // Map arguments that are specified in FFRK JS code and that we manually
  // define in our own TS code to match.
  // FIXME: This is ugly.  Refactor and unit test.
  const result: NamedArgs = {
    ..._.fromPairs(_.map(argSource.args, (value, key) => [key, args[value as number]])),
    ..._.fromPairs(
      _.map(argSource.multiArgs, (value, key) => [
        key,
        _.filter((value as number[]).map((i: number) => args[i])),
      ]),
    ),
  };
  deleteAll(unhandledArgs, _.values(argSource.args));
  if (argSource.multiArgs) {
    _.forEach(argSource.multiArgs, (i: number[]) => deleteAll(unhandledArgs, i));
  }

  // Map arguments that are specified in FFRK actionMap options.
  function tryArg(key: keyof NamedArgs, argNumber: number | undefined) {
    if (argNumber) {
      result[key] = args[argNumber];
      unhandledArgs.delete(argNumber);
    }
  }
  function tryArgList(key: keyof NamedArgs, argNumbers: Array<number | string> | undefined) {
    if (!argNumbers || !argNumbers.length) {
      return;
    }

    // Action maps typically express arguments as integers, but some (like
    // TranceAction) instead have parameters like `burstAbilityArgs: ["arg2", "arg4"]`.
    const cleanedArgNumbers = argNumbers.map((i: number | string) => {
      if (typeof i === 'number') {
        return i;
      } else {
        const match = i.match(/^arg(\d+)$/);
        return match ? +match[1] : 0;
      }
    });

    result[key] = _.filter(cleanedArgNumbers.map(i => args[i]));
    deleteAll(unhandledArgs, cleanedArgNumbers);
  }
  tryArgList('elements', action.elements && action.elements.args);
  tryArg('ignoresReflection', action.ignoresReflectionArg);
  tryArg('ignoresMirageAndMightyGuard', action.ignoresMirageAndMightyGuardArg);
  tryArg('ignoresStatusAilmentsBarrier', action.ignoresStatusAilmentsBarrierArg);
  tryArgList('burstAbility', action.burstAbilityArgs);
  tryArgList('setSaId', action.setSa && action.setSa.args);
  tryArgList('setSaBundle', action.setSa && action.setSa.bundleArgs);
  tryArgList('unsetSaId', action.unsetSa && action.unsetSa.args);
  tryArgList('unsetSaBundle', action.unsetSa && action.unsetSa.bundleArgs);

  // Map special cases.
  const isFlightAttackResult = isFlightAttack(battleData, abilityId, action);
  if (isFlightAttackResult) {
    result.isFlightAttack = isFlightAttackResult;
  }

  // Record unhandled arguments for diagnostic and development purposes.
  if (unhandledArgs.size) {
    const unknown: { [i: number]: number } = {};
    unhandledArgs.forEach(i => {
      unknown[i] = args[i];
    });
    result.unknown = unknown;
  }

  return result;
}
