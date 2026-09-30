/**
 * Item definitions and structures for classic Diablo-style ARPG.
 */

export type ItemType =
  | 'weapon'
  | 'shield'
  | 'armor'
  | 'helm'
  | 'ring'
  | 'potion'
  | 'scroll'
  | 'gold';

export type ItemRarity = 'normal' | 'magic' | 'rare' | 'unique';

export interface Item {
  id: string;
  name: string;
  baseType: string;
  itemType: ItemType;
  rarity: ItemRarity;
  gridW: number;
  gridH: number;
  // Combat stats
  minDamage?: number;
  maxDamage?: number;
  armorClass?: number;
  toHitBonus?: number;
  attackSpeedBonus?: number; // e.g. 1.2 for faster attack speed
  // Stat requirements
  strReq?: number;
  dexReq?: number;
  // Stat bonuses
  bonusStr?: number;
  bonusDex?: number;
  bonusVit?: number;
  bonusMag?: number;
  bonusLife?: number;
  bonusMana?: number;
  // Consumable effects
  healAmount?: number;
  manaAmount?: number;
  // Value & identification
  identified: boolean;
  goldValue: number;
  // Affix details
  prefix?: string;
  suffix?: string;
  description?: string;
}

export function createPotion(type: 'health' | 'mana'): Item {
  const isHealth = type === 'health';
  return {
    id: `potion_${Date.now()}_${Math.random()}`,
    name: isHealth ? 'Potion of Healing' : 'Potion of Mana',
    baseType: isHealth ? 'potion_health' : 'potion_mana',
    itemType: 'potion',
    rarity: 'normal',
    gridW: 1,
    gridH: 1,
    healAmount: isHealth ? 50 : 0,
    manaAmount: isHealth ? 0 : 50,
    identified: true,
    goldValue: 20
  };
}

export function createTownPortalScroll(): Item {
  return {
    id: `scroll_tp_${Date.now()}_${Math.random()}`,
    name: 'Scroll of Town Portal',
    baseType: 'scroll_portal',
    itemType: 'scroll',
    rarity: 'normal',
    gridW: 1,
    gridH: 1,
    identified: true,
    goldValue: 100
  };
}

export function createIdentifyScroll(): Item {
  return {
    id: `scroll_id_${Date.now()}_${Math.random()}`,
    name: 'Scroll of Identify',
    baseType: 'scroll_identify',
    itemType: 'scroll',
    rarity: 'normal',
    gridW: 1,
    gridH: 1,
    identified: true,
    goldValue: 50
  };
}

export function createGoldPile(amount: number): Item {
  return {
    id: `gold_${Date.now()}_${Math.random()}`,
    name: `${amount} Gold`,
    baseType: 'gold',
    itemType: 'gold',
    rarity: 'normal',
    gridW: 1,
    gridH: 1,
    identified: true,
    goldValue: amount
  };
}

export function createButchersCleaver(): Item {
  return {
    id: 'unique_butchers_cleaver',
    name: "The Butcher's Cleaver",
    baseType: 'cleaver',
    itemType: 'weapon',
    rarity: 'unique',
    gridW: 2,
    gridH: 3,
    minDamage: 12,
    maxDamage: 24,
    bonusStr: 10,
    bonusLife: 20,
    toHitBonus: 15,
    attackSpeedBonus: 1.25,
    strReq: 25,
    identified: true,
    goldValue: 2500,
    description: "Still dripping with the gore of its countless victims."
  };
}
