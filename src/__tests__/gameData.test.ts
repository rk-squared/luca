import { battleData } from '../gameData';

describe('gameData', () => {
  describe('battleData', () => {
    it('describes cure spells that can target enemies', () => {
      // Sample values take from Ultra Cure, GL,
      // 2018-09-10-07-45-10-891_dff_event_suppress_2231_single_get_battle_init_data.json
      expect(battleData.gl.describeTarget('1', '2', '4')).toEqual('Single');
    });
  });
});
