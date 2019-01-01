import { battleData } from '../battleData';

describe('battleData', () => {
  it('describes cure spells that can target enemies', () => {
    // Sample values take from Ultra Cure, GL,
    // 2018-09-10-07-45-10-891_dff_event_suppress_2231_single_get_battle_init_data.json
    expect(battleData.gl.describeTarget('1', '2', '4')).toEqual('Single');

    // Sample values taken from Mysidia's Light, JP, DecilAA_PoromU2.json
    expect(battleData.jp.describeTargetMethod(1, 2, 2, 12)).toEqual(
      'Ally with KO or lowest HP% ally',
    );
  });
});
