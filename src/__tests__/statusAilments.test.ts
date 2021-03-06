import { describeStatusAilment, statusHandlers, EnlirStatusVerb } from '../statusAilments';

import { battleData } from '../gameData/battleData';
import { LangType } from '../util';

describe('statusAilments', () => {
  it('handles stat buffs and debuffs', () => {
    const status = {
      _name: 'CUSTOM_ATK_DEF_MDEF',
      isCustomParam: true,
      isPrimitiveParamBoost: true,
      exclusive: {
        types: [],
      },
      duration: {
        a: 0,
        b: 0,
        c: 0,
      },
      boosts: [
        {
          paramName: 'atk',
          rate: 0,
        },
        {
          paramName: 'def',
          rate: 0,
        },
        {
          paramName: 'mdef',
          rate: 0,
        },
      ],
      funcMap: {
        entry: 'entryParamBooster',
        update: 'updateTimerParamBooster',
        exit: 'exitParamBooster',
      },
    };
    expect(statusHandlers.genericStatBuff.isMatch(status)).toStrictEqual(true);
  });

  it('handles Heavy Charge', () => {
    expect(describeStatusAilment(battleData[LangType.Gl], 50110)).toEqual({
      verb: EnlirStatusVerb.GRANTS,
      description: 'Heavy Charge +1',
    });
    expect(describeStatusAilment(battleData[LangType.Gl], 50112)).toEqual({
      verb: EnlirStatusVerb.CAUSES,
      description: 'Heavy Charge =0',
    });
  });
});
