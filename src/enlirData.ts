import * as fs from 'fs-extra';
import * as path from 'path';

import * as _ from 'lodash';

import { logger } from './logger';

const enlirPath = path.join(__dirname, 'enlir');

export interface EnlirCharacter {
  realm: string;
  name: string;
  introducingEventLv50: string;
  lv50: CharacterStatBlock;
  introducingEventLv65: string;
  lv65: CharacterStatBlock;
  introducingEventLv80: string;
  lv80: CharacterStatBlock;
  introducingEventLv99: string;
  lv99: CharacterStatBlock;
  introducingEventRecordSpheres: null | string;
  recordSpheres?: RecordSphereStatBlock;
  introducingEventLegendSpheres: null | string;
  legendSpheres?: LegendSphereStatBlock;

  equipment: {
    dagger: boolean;
    sword: boolean;
    katana: boolean;
    axe: boolean;
    hammer: boolean;
    spear: boolean;
    fist: boolean;
    rod: boolean;
    staff: boolean;
    bow: boolean;
    instrument: boolean;
    whip: boolean;
    thrown: boolean;
    gun: boolean;
    book: boolean;
    blitzball: boolean;
    hairpin: boolean;
    gunArm: boolean;
    gamblingGear: boolean;
    doll: boolean;
    keyblade: boolean;
    shield: boolean;
    hat: boolean;
    helm: boolean;
    lightArmor: boolean;
    heavyArmor: boolean;
    robe: boolean;
    bracer: boolean;
    accessory: boolean;

    [key: string]: boolean;
  };

  skills: {
    whiteMagic: number | null;
    blackMagic: number | null;
    combat: number | null;
    support: number | null;
    celerity: number | null;
    summoning: number | null;
    spellblade: number | null;
    dragoon: number | null;
    monk: number | null;
    thief: number | null;
    knight: number | null;
    samurai: number | null;
    ninja: number | null;
    bard: number | null;
    dancer: number | null;
    machinist: number | null;
    darkness: number | null;
    sharpshooter: number | null;
    witch: number | null;
    heavy: number | null;

    [key: string]: number | null;
  };

  id: number;
}

interface CharacterStatBlock {
  hp: number;
  atk: number;
  def: number;
  mag: number;
  res: number;
  mnd: number;
  acc: number;
  eva: number;
  spd: number;
}

interface RecordSphereStatBlock {
  hp: number;
  atk: number;
  def: number;
  mag: number;
  res: number;
  mnd: number;
  acc: number;
  eva: number;
  spd: number;
}

interface LegendSphereStatBlock {
  hp: number;
  atk: number;
  def: number;
  mag: number;
  res: number;
  mnd: number;
  acc: number;
  eva: number;
  spd: number;
}

export interface EnlirAbility {
  school: string;
  name: string;
  rarity: number;
  type: string;
  target: string;
  formula: string;
  multiplier: number;
  element: string;
  time: number;
  effects: string;
  counter: boolean;
  autoTarget: string;
  sb: number;
  uses: number;
  max: number;
  orbs: { [orbName: string]: number[] };
  introducingEvent: string;
  nameJp: string;
  id: number;
  gl: boolean;
}

export interface EnlirAll {
  abilities: { [id: number]: EnlirAbility } | null;
  characters: { [id: number]: EnlirCharacter } | null;
}

export function tryLoad<T>(load: () => { [id: number]: T }): { [id: number]: T } | null {
  try {
    return load();
  } catch (e) {
    logger.warn(`Failed to load Enlir data: ${e}. Some features will be unavailable.`);
    return null;
  }
}

export function loadAbilities(): { [id: number]: EnlirAbility } {
  const data = fs.readJSONSync(path.join(enlirPath, 'abilities.json'));
  return _.keyBy(data, 'id');
}

export function loadCharacters(): { [id: number]: EnlirCharacter } {
  const data = fs.readJSONSync(path.join(enlirPath, 'characters.json'));
  return _.keyBy(data, 'id');
}

export function tryLoadAll(): EnlirAll {
  return {
    abilities: tryLoad(loadAbilities),
    characters: tryLoad(loadCharacters),
  };
}
