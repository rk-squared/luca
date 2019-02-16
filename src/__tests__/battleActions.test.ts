import { convertAbility } from '../battleActions';

import { battleData } from '../gameData/battleData';
import { LangType } from '../util';

describe('battleActions', () => {
  describe('convertAbility', () => {
    it('converts simple character abilities', () => {
      const dreadWeaponAbilityData = {
        category_id: '17',
        options: {
          ability_animation_id: '10267',
          active_target_method: '3',
          alias_name: '',
          arg1: '75',
          arg10: '0',
          arg11: '0',
          arg12: '0',
          arg13: '0',
          arg14: '0',
          arg15: '0',
          arg16: '0',
          arg17: '0',
          arg18: '0',
          arg19: '0',
          arg2: '4',
          arg20: '0',
          arg21: '0',
          arg22: '0',
          arg23: '0',
          arg24: '0',
          arg25: '0',
          arg26: '0',
          arg27: '0',
          arg28: '0',
          arg29: '0',
          arg3: '1',
          arg30: '0',
          arg4: '0',
          arg5: '107',
          arg6: '1',
          arg7: '20',
          arg8: '0',
          arg9: '0',
          cast_time: '1650',
          counter_enable: '1',
          max_damage_threshold_type: '0',
          min_damage_threshold_type: '0',
          name: 'Dread Weapon',
          panel_name: 'Dread{n}Weapon',
          ss_point: '75',
          status_ailments_factor: '0',
          status_ailments_id: '0',
          target_death: '1',
          target_method: '2',
          target_range: '1',
          target_segment: '1',
        },
        exercise_type: '1',
        action_id: '126',
        ability_id: '30271101',
      };
      const ability = convertAbility(battleData[LangType.Gl], dreadWeaponAbilityData);
      expect(ability).toMatchSnapshot();
    });

    it('converts PhysicalAttackMultiAndSelfSaAction abilities', () => {
      const cycloneBoltAbilityData = {
        category_id: '8',
        options: {
          arg4: '0',
          min_damage_threshold_type: '0',
          arg7: '257',
          arg20: '0',
          status_ailments_id: '0',
          arg18: '0',
          ss_point: '75',
          arg28: '0',
          arg12: '0',
          arg22: '0',
          arg17: '0',
          arg15: '0',
          arg1: '70',
          arg10: '1',
          arg21: '0',
          arg11: '104',
          name: 'Cyclone Bolt',
          arg24: '0',
          arg2: '3',
          arg5: '102',
          alias_name: '',
          panel_name: 'Cyclone{n}Bolt',
          arg14: '0',
          target_segment: '1',
          arg25: '0',
          arg30: '0',
          arg9: '0',
          arg13: '0',
          arg19: '0',
          arg27: '0',
          counter_enable: '1',
          arg23: '0',
          arg29: '0',
          target_range: '1',
          arg26: '0',
          target_death: '1',
          arg3: '2',
          cast_time: '1500',
          arg8: '1',
          max_damage_threshold_type: '0',
          arg6: '1',
          target_method: '2',
          active_target_method: '3',
          status_ailments_factor: '0',
          arg16: '0',
          ability_animation_id: '10296',
        },
        exercise_type: '1',
        action_id: '103',
        ability_id: '30181131',
      };

      const ability = convertAbility(battleData[LangType.Gl], cycloneBoltAbilityData);

      expect(ability.effects).toEqual(
        'Three single ranged attacks (0,70 each), grants No Air Time 2 to the user',
      );

      expect(ability).toMatchSnapshot();
    });

    it('converts abilities that remove status ailments', () => {
      const ultraCureAbilityData = {
        category_id: '2',
        options: {
          arg4: '0',
          min_damage_threshold_type: '0',
          arg7: '0',
          arg20: '0',
          status_ailments_id: '0',
          arg18: '0',
          ss_point: '85',
          arg28: '0',
          arg12: '0',
          arg22: '0',
          arg17: '0',
          arg15: '0',
          arg1: '105',
          arg10: '0',
          arg21: '0',
          arg11: '0',
          name: 'Ultra Cure',
          arg24: '0',
          arg2: '106',
          arg5: '2',
          alias_name: '',
          panel_name: 'Ultra{n}Cure',
          arg14: '0',
          target_segment: '2',
          arg25: '0',
          arg30: '0',
          arg9: '0',
          arg13: '0',
          arg19: '0',
          arg27: '0',
          counter_enable: '1',
          arg23: '0',
          arg29: '0',
          target_range: '1',
          arg26: '0',
          target_death: '3',
          arg3: '400',
          cast_time: '1500',
          arg8: '0',
          max_damage_threshold_type: '0',
          arg6: '0',
          target_method: '2',
          active_target_method: '4',
          status_ailments_factor: '0',
          arg16: '0',
          ability_animation_id: '40314',
        },
        exercise_type: '3',
        action_id: '90',
        ability_id: '30121291',
      };

      const ability = convertAbility(battleData[LangType.Gl], ultraCureAbilityData);

      expect(ability.effects).toEqual(
        'Restores HP (105), damages undeads, removes negative effects',
      );

      expect(ability).toMatchSnapshot();
    });

    it('converts soul break abilities with stat buffs', () => {
      const poromBsbEffectAbilityData = {
        category_id: '2',
        options: {
          arg4: '30',
          min_damage_threshold_type: '0',
          arg7: '0',
          arg20: '0',
          status_ailments_id: '623',
          arg18: '0',
          ss_point: '0',
          arg28: '0',
          arg12: '0',
          arg22: '0',
          arg17: '0',
          arg15: '0',
          arg1: '55',
          arg10: '0',
          arg21: '0',
          arg11: '0',
          name: '癒しの風【IV】',
          arg24: '0',
          arg2: '0',
          arg5: '25000',
          alias_name: '癒しの風【IV】',
          panel_name: '癒しの風{n}【IV】',
          arg14: '0',
          target_segment: '2',
          arg25: '0',
          arg30: '0',
          arg9: '0',
          arg13: '0',
          arg19: '0',
          arg27: '0',
          counter_enable: '0',
          arg23: '0',
          arg29: '0',
          target_range: '2',
          arg26: '0',
          target_death: '1',
          arg3: '0',
          cast_time: '2500',
          arg8: '0',
          max_damage_threshold_type: '0',
          arg6: '0',
          target_method: '6',
          active_target_method: '1',
          status_ailments_factor: '100',
          arg16: '0',
          ability_animation_id: '71376',
        },
        exercise_type: '3',
        action_id: '54',
        ability_id: '30511390',
      };

      const ability = convertAbility(battleData[LangType.Jp], poromBsbEffectAbilityData);

      expect(ability.effects).toEqual('Restores HP (55), MAG and MND 30% for 25 seconds');

      expect(ability).toMatchSnapshot();
    });

    it('converts soul break jump attacks', () => {
      const kainCsbEffectAbilityData = {
        category_id: '5',
        options: {
          arg4: '1',
          min_damage_threshold_type: '0',
          arg7: '0',
          arg20: '0',
          status_ailments_id: '0',
          arg18: '0',
          ss_point: '0',
          arg28: '0',
          arg12: '0',
          arg22: '0',
          arg17: '0',
          arg15: '0',
          arg1: '36',
          arg10: '0',
          arg21: '0',
          arg11: '0',
          name: 'Impulse Drive',
          arg24: '0',
          arg2: '22',
          arg5: '102',
          alias_name: 'Impulse Drive',
          panel_name: 'Impulse Drive',
          arg14: '0',
          target_segment: '1',
          arg25: '0',
          arg30: '0',
          arg9: '0',
          arg13: '0',
          arg19: '0',
          arg27: '0',
          counter_enable: '0',
          arg23: '0',
          arg29: '0',
          target_range: '1',
          arg26: '0',
          target_death: '1',
          arg3: '2',
          cast_time: '2500',
          arg8: '0',
          max_damage_threshold_type: '0',
          arg6: '1',
          target_method: '2',
          active_target_method: '3',
          status_ailments_factor: '100',
          arg16: '0',
          ability_animation_id: '71736',
        },
        exercise_type: '1',
        action_id: '7',
        ability_id: '30544011',
      };

      const ability = convertAbility(battleData[LangType.Jp], kainCsbEffectAbilityData);

      expect(ability.effects).toEqual('Twenty-two single ranged jump attacks (0,36 each)');

      expect(ability).toMatchSnapshot();
    });
  });
});
