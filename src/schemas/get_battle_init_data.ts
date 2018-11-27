export interface BuddyAbility {
  category_id: string;
  options: Options;
  exercise_type: string;
  action_id: string;
  ability_id: string;
  assets?: { [key: string]: string };
  // Omit animation_info; we don't care about that right now.
  // animation_info?: AbilityAnimationInfo;
}

export interface Options {
  ability_animation_id: string;
  active_target_method?: string;
  alias_name?: string;

  arg1: string;
  arg2: string;
  arg3: string;
  arg4: string;
  arg5: string;
  arg6: string;
  arg7: string;
  arg8: string;
  arg9: string;
  arg10: string;
  arg11: string;
  arg12: string;
  arg13: string;
  arg14: string;
  arg15: string;
  arg16: string;
  arg17: string;
  arg18: string;
  arg19: string;
  arg20: string;
  arg21: string;
  arg22: string;
  arg23: string;
  arg24: string;
  arg25: string;
  arg26: string;
  arg27: string;
  arg28: string;
  arg29: string;
  arg30: string;

  // Allow access to arg1 through arg30 without errors.
  [arg: string]: string | undefined | number;

  cast_time: string;
  consume_soul_strike_point?: string;
  counter_enable?: string;
  disp_name?: string;
  has_param_booster?: number;
  max_damage_threshold_type: string;
  min_damage_threshold_type: string;
  name: string;
  panel_name?: string;
  should_skip_supporter_effect?: string;
  soul_strike_category_id?: string;
  ss_point?: string;
  status_ailments_factor: string;
  status_ailments_id: string;
  target_death: string;
  target_method: string;
  target_range: string;
  target_segment: string;
  usable_num?: string;
}
