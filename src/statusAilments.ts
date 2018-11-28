import { withPlus } from './util';
import { battleData } from './gameData';

interface StatusAilment {
  _name: string;
  canNotSetToEnemy: boolean;
  exclusive: {
    types: number[];
  };
  duration?: {
    a: number;
    b: number;
    c: number;
  };
  funcMap: {
    update?: string;
    abilityDoneHook?: string;
    set?: string;
  };

  // One-off parameters for individual handler functions.
  increaseLevel?: number;
}

interface StatusAilmentDescription {
  isBuff: boolean;
  description: string;
}

interface StatusAilmentHandler {
  [functionName: string]: (status: StatusAilment) => StatusAilmentDescription | null;
}

const setterHandlers: StatusAilmentHandler = {
  setForIncreaseHeavyChargeLevel: (statusAilment: StatusAilment) => {
    if (!statusAilment.increaseLevel) {
      return null;
    }
    return {
      isBuff: statusAilment.increaseLevel > 0,
      description: `Heavy Charge ${withPlus(statusAilment.increaseLevel)}`,
    };
  },
  setForUnsetHeavyCharge: () => ({
    isBuff: false,
    description: 'Heavy Charge =0',
  }),
};

export function describeStatusAilment(statusAilmentId: number): StatusAilmentDescription | null {
  const status = battleData.extra.statusAilments[statusAilmentId];
  if (!status) {
    return null;
  }
  if (status.funcMap.set && setterHandlers[status.funcMap.set]) {
    return setterHandlers[status.funcMap.set](status);
  }
  return null;
}
