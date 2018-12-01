import { AssetCollection, JsonString, SimpleAssets } from './types';

export interface GetBattleInitData {
  success: boolean;
  assets: AssetCollection;
  battle: Battle;
  SERVER_TIME: number;
}

export interface AbilityAnimationInfo {
  launch_back: string;
  return_type: string;
  launch_next_tag: string;
  shot_particle_json: JsonString;
  chara_out: string;
  damage_tag: string;
  hit_arg: string;
  land_sprite_num: string;
  id: string;
  other_in: string;
  shot_sprite_num: string;
  reverse_hit: string;
  shot: string;
  hit_sprite_num: string;
  launch_sprite_num: string;
  atk_motion: string;
  launch_particle_json: string;
  hit_next_tag: string;
  hit: string;
  launch_type: string;
  shot_next_tag: string;
  return_shot: string;
  has_hit_timing: string;
  other_out: string;
  shot_type: string;
  launch: string;
  hit_particle_json: JsonString;
  reverse_shot: string;
  return_hit: string;
  has_launch_end: string;
  land: string;
  recover_tag: string;
  land_particle_json: string;
  miss_hit: string;
  chara_in: string;
  hit_type: string;
  return_miss_hit: string;
}

export interface Attribute {
  attribute_id: string;
  factor: number | string;
}

export interface Background {
  assets: SimpleAssets;
  animationTime: number;
  animation_info: BackgroundAnimationInfo;
}

export interface BackgroundAnimationInfo {
  bgEffectIds: any[];
  id: string;
}

export interface Battle {
  main_beast: Beast[];
  win_bgm: string;
  is_inescapable: string;
  dungeon_prizes: DungeonPrize[];
  initial_atb_type: string;
  beast_total_params: { [key: string]: number };
  supporter: Supporter[];
  battle_id: string;
  res_server_snapshot: string;
  battle_gimmicks: any[];
  show_timer_type: string;
  sub_beast: Beast[];
  messages: any[];
  enemy_abilities: EnemyAbility[];
  version: number;
  dungeon: Dungeon;
  background: Background;
  score: Score;
  expired_at: number;
  event: Event;
  buddy_boost_map: BuddyBoostMap;
  assets: { [key: string]: string };
  buddy: Buddy[];
  continue_allowable_type: string;
  rounds: Round[];
  captures: Capture[];
}

export interface Beast {
  uid: number;
  passive_skills: Materia[];
  series_id: string;
  active_skills: BeastActiveSkill[];
  params: BeastParam[];
  max_hp: string;
  rarity: string;
  status_ailments: any[];
  init_hp: string;
  id: string;
  spare_panels: any[];
}

export interface BeastActiveSkill {
  icon?: Icon;
  options: Options;
  num?: number | string;
  max_num?: string;
  action_id: string;
  assets: SimpleAssets;
  exercise_type: string;
  animation_info: AbilityAnimationInfo;
  ability_id: string;
  category_id?: string;
}

export interface BeastParam {
  matk: number;
  atk: number;
  spd: number;
  mdef: number;
  acc: number;
  atk_type: number;
  synchronization_duration: string;
  critical: string;
  required_time_to_fill_synchronization_gauge: string;
  level: string;
  disp_name: string;
  mnd: number;
  def: number;
  eva: number;
  id: string;
}

export interface Buddy {
  ability_category_ids: string[];
  weapon_effect: BuddyWeaponEffect;
  sphere_skills: Materia[];
  no: string;
  pos_id: string;
  init_hp: number;
  row: string;
  id: string;
  series_id_map: BuddySeriesIdMap;
  materias: Materia[];
  uid: number;
  status_bonus_type_of: number;
  status_bonus_flg_of: StatusBonusFlgOf;
  armor: BuddyArmor;
  dress_record_id: number;
  sex: string;
  soul_strike_gauge: number | null; // null for supporter (Roaming Warrior)
  params: BuddyParam[];
  weapon: BuddyWeapon;
  max_hp: number;
  additional_animation_infos: any[];
  soul_strikes: BuddySoulStrike[];
  status_ailments: any[] | null; // null for supporter (Roaming Warrior)
  animation_info: BuddyAnimationInfo;
  ability_panels: BuddyAbilityPanel[];
  abilities: BuddyAbility[];
  spare_panels: SparePanel[];
}

export interface Supporter extends Buddy {
  category: number;
  tag: string;
  max_supporter_ss_gauge: number | string;
  supporter_ss_gauge: number | string;
}

export interface BuddyAbility {
  category_id: string;
  options: Options;
  exercise_type: string;
  action_id: string;
  ability_id: string;
  assets?: SimpleAssets;
  animation_info?: AbilityAnimationInfo;
}

export interface BuddyAbilityPanel {
  panel_no: number;
  num: number | string;
  uid: string;
  grade: number | string;
  max_num: string;
  name: string;
  assets: SimpleAssets;
  ability_ss_point: string;
  ability_id: string;
}

export interface BuddyAnimationInfo {
  left_2_offset_x: string;
  right_2_offset_y: string;
  right_1_offset_x: string;
  left_1_offset_y: string;
  right_1_offset_y: string;
  buddy_id: string;
  path: string;
  dress_record_id: string;
  right_2_offset_x: string;
  assets: SimpleAssets;
  left_1_offset_x: string;
  left_2_offset_y: string;
}

export interface BuddyArmor {
  category_id: number | string;
}

export interface BuddyBoostMap {
  exp: { [key: string]: number | string };
  gil: { [key: string]: number | string }; // unconfirmed
}

export interface BuddyParam {
  atk: number;
  mdef: number;
  acc: number;
  atk_type: number | string;
  atk_ss_point_factor: number;
  critical: number;
  def_ss_point_factor: number;
  def: number;
  id: string;
  eva: number;
  atk_attributes: Attribute[];
  matk_attributes: Attribute[];
  matk: number;
  spd: number;
  level: string;
  disp_name: string;
  def_attributes: Attribute[];
  mnd: number;
  handedness: Handedness;
}

export interface BuddySeriesIdMap {
  weapon: number | string;
  buddy: string;
  accessory: number | string;
  armor: number | string;
}

export interface BuddySoulStrike {
  icon: Icon;
  options: Options;
  num: number | string | null; // null for supporter (Roaming Warrior)
  max_num: string;
  action_id: string;
  assets: SimpleAssets;
  exercise_type: string;
  slot: number;
  ability_id: string;
  animation_info: AbilityAnimationInfo;

  // To make BuddySoulStrike more or less compatible with BuddyAbility:
  category_id: undefined;
}

export interface BuddyWeapon {
  assets: SimpleAssets;
  category_id: number | string;
  animation_info: WeaponAnimationInfo;
}

export interface BuddyWeaponEffect {
  assets: SimpleAssets;
  animation_info: AbilityAnimationInfo;
}

export interface Capture {
  enemy_id: string;
  image_path: string;
  tip_battle: TipBattle;
}

export interface Dungeon {
  dungeon_id: string;
  is_force: boolean;
  is_restricted: boolean;
  is_forbidden_to_add_ss_point: boolean;
  should_reset_ss_point_for_continue: boolean;
}

export interface DungeonPrize {
  grade_bonus_description: string;
  num: string;
  dungeon_id: string;
  type: string;
  item_id: string;
  grade_bonus_condition: string;
}

export interface EnemyAbility {
  assets: SimpleAssets;
  options: Options;
  exercise_type: string;
  action_id: string;
  animation_info: AbilityAnimationInfo;
  ability_id: string;
}

export enum Handedness {
  Left = 'left',
  Right = 'right',
}

export interface Icon {
  assets: SimpleAssets;
}

export interface Materia {
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
  effect_type: string;
  is_action_skill?: number;
  is_passive_skill?: number;
  effect_value?: string;
  slot?: number;
  weight?: string;
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

export interface Score {
  general: ScoreGeneral[];
  specific: ScoreSpecific[];
  various_info: ScoreVariousInfo;
}

export interface ScoreGeneral {
  no: number;
  type: string;
  title: string;
}

export interface ScoreSpecific {
  arg2: string;
  arg1: string;
  no: number;
  type: string;
  battle_specific_score_id: string;
  title: string;
}

export interface ScoreVariousInfo {
  equipment_ids: string[];
  ability_num_denominator: number;
}

export interface SparePanel {
  assets: SimpleAssets;
  receptor_id: string;
  name: string;
  max_num: number;
  ability_id: string;
  ability_ss_point: string;
}

export interface StatusBonusFlgOf {
  weapon: number;
  buddy: number;
  accessory: number;
  armor: number;
}

export interface TipBattle {
  html_content: string;
  title: string;
  message: string;
}

export interface WeaponAnimationInfo {
  can_move: string;
  attack_tag: string;
  equip_type: string;
  id: string;
  path: string;
}

/*----------------------------------------------------*/
// Beginning of rounds and enemies - more complicated, not yet integrated

export interface Round {
  enemy: Enemy[];
  round: number;
  has_next_battle: boolean;
  background_change_type: number | string;
  bgm: string;
  drop_item_list: RoundDropItemList[];
  drop_materias: any[];
  buddy_transit_type: string;
}

export interface RoundDropItemList {
  rarity: number;
  round: number;
  type: string;
}

export interface Enemy {
  deform_animation_info: DeformAnimationInfo[];
  is_sp_enemy: number | string;
  id: string;
  children: Child[];
  ai_arguments: AiArgument[];
  ai_id: number | string;
}

export interface DeformAnimationInfo {
  enemy_id: string;
  is_random: boolean;
  deform_tag: string;
  id: string;
  path: string;
  state: string[];
}

export interface AiArgument {
  arg_type: string;
  tag: string;
  arg_value: string;
}

export interface Child {
  uid: string;
  no: string;
  lv: string;
  drop_item_list: ChildDropItemList[];
  enemy_id: string;
  params: ChildParam[];
  max_hp: number | string;
  constraints: Constraint[];
  init_hp: number | string;
  child_pos_id: string;
  ai_id: string;
}

export interface Constraint {
  priority: string;
  enemy_status_id: string;
  ability_tag: string;
  constraint_value: string;
  options: string;
  constraint_type: string;
}

export interface ChildDropItemList {
  num?: string;
  uid: number;
  rarity: number | string;
  type: number;
  item_id?: string;
  amount?: number;
}

export interface ChildParam {
  cast_time_type: string;
  atk: number | string;
  no: string;
  mdef: number | string;
  lv: string;
  acc: string;
  size: string;
  critical: string;
  def: number | string;
  eva: string;
  id: string;
  breed_id: string;
  exp: number | string;
  matk_attributes: Attribute[];
  matk: number | string;
  looking: string;
  spd: string;
  counters: any[];
  max_hp: number | string;
  disp_name: string;
  def_attributes: Attribute[];
  mnd: number | string;
  animation_info: ChildParamAnimationInfo;
  abilities: ChildParamAbility[];
}

export interface ChildParamAbility {
  unlock_turn_num: string;
  weight: string;
  tag: string;
  ability_id: string;
}

export interface ChildParamAnimationInfo {
  enemy_status_id: string;
  uses_fix_pos: boolean;
  hp_gauge_size: string;
  offset_y: string;
  path: string;
  assets: SimpleAssets;
  scale: string;
  offset_x: string;
}
