/**
 * Diablo 1 Item Affix Generator.
 * Rolls authentic Prefix and Suffix modifiers based on dungeon depth and rarity.
 */

import { Item, ItemRarity, ItemType } from './Item.js';

interface Affix {
  name: string;
  type: 'prefix' | 'suffix';
  appliesTo: ItemType[];
  apply: (item: Item) => void;
}

const PREFIXES: Affix[] = [
  // Armor prefixes
  {
    name: 'Sturdy',
    type: 'prefix',
    appliesTo: ['armor', 'shield', 'helm'],
    apply: (item) => {
      if (item.armorClass) item.armorClass = Math.round(item.armorClass * 1.3);
    }
  },
  {
    name: 'Strong',
    type: 'prefix',
    appliesTo: ['armor', 'shield', 'helm'],
    apply: (item) => {
      if (item.armorClass) item.armorClass = Math.round(item.armorClass * 1.5);
    }
  },
  {
    name: 'Glorious',
    type: 'prefix',
    appliesTo: ['armor', 'shield', 'helm'],
    apply: (item) => {
      if (item.armorClass) item.armorClass = Math.round(item.armorClass * 1.8);
    }
  },
  {
    name: 'Godly',
    type: 'prefix',
    appliesTo: ['armor', 'shield', 'helm'],
    apply: (item) => {
      if (item.armorClass) item.armorClass = Math.round(item.armorClass * 2.2);
      item.bonusLife = (item.bonusLife || 0) + 15;
    }
  },
  // Weapon damage prefixes
  {
    name: 'Jagged',
    type: 'prefix',
    appliesTo: ['weapon'],
    apply: (item) => {
      if (item.minDamage) item.minDamage += 2;
      if (item.maxDamage) item.maxDamage += 3;
    }
  },
  {
    name: 'Deadly',
    type: 'prefix',
    appliesTo: ['weapon'],
    apply: (item) => {
      if (item.minDamage) item.minDamage += 3;
      if (item.maxDamage) item.maxDamage += 6;
    }
  },
  {
    name: 'Heavy',
    type: 'prefix',
    appliesTo: ['weapon'],
    apply: (item) => {
      if (item.minDamage) item.minDamage += 4;
      if (item.maxDamage) item.maxDamage += 8;
    }
  },
  {
    name: 'Savage',
    type: 'prefix',
    appliesTo: ['weapon'],
    apply: (item) => {
      if (item.minDamage) item.minDamage += 6;
      if (item.maxDamage) item.maxDamage += 12;
    }
  },
  {
    name: "King's",
    type: 'prefix',
    appliesTo: ['weapon'],
    apply: (item) => {
      if (item.minDamage) item.minDamage += 8;
      if (item.maxDamage) item.maxDamage += 16;
      item.toHitBonus = (item.toHitBonus || 0) + 15;
    }
  },
  // To-Hit prefixes
  {
    name: 'Silver',
    type: 'prefix',
    appliesTo: ['weapon', 'ring'],
    apply: (item) => {
      item.toHitBonus = (item.toHitBonus || 0) + 10;
    }
  },
  {
    name: 'Platinum',
    type: 'prefix',
    appliesTo: ['weapon', 'ring'],
    apply: (item) => {
      item.toHitBonus = (item.toHitBonus || 0) + 20;
    }
  }
];

const SUFFIXES: Affix[] = [
  {
    name: 'of the Bear',
    type: 'suffix',
    appliesTo: ['weapon'],
    apply: (item) => {
      item.bonusStr = (item.bonusStr || 0) + 4;
      if (item.maxDamage) item.maxDamage += 3;
    }
  },
  {
    name: 'of the Fox',
    type: 'suffix',
    appliesTo: ['armor', 'shield', 'helm', 'ring'],
    apply: (item) => {
      item.bonusVit = (item.bonusVit || 0) + 5;
      item.bonusLife = (item.bonusLife || 0) + 10;
    }
  },
  {
    name: 'of the Whale',
    type: 'suffix',
    appliesTo: ['armor', 'shield', 'helm', 'ring'],
    apply: (item) => {
      item.bonusVit = (item.bonusVit || 0) + 12;
      item.bonusLife = (item.bonusLife || 0) + 35;
    }
  },
  {
    name: 'of Haste',
    type: 'suffix',
    appliesTo: ['weapon'],
    apply: (item) => {
      item.attackSpeedBonus = (item.attackSpeedBonus || 1.0) * 1.35;
    }
  },
  {
    name: 'of Precision',
    type: 'suffix',
    appliesTo: ['weapon', 'ring'],
    apply: (item) => {
      item.bonusDex = (item.bonusDex || 0) + 8;
      item.toHitBonus = (item.toHitBonus || 0) + 8;
    }
  },
  {
    name: 'of Might',
    type: 'suffix',
    appliesTo: ['weapon', 'armor', 'ring'],
    apply: (item) => {
      item.bonusStr = (item.bonusStr || 0) + 7;
    }
  },
  {
    name: 'of Wizardry',
    type: 'suffix',
    appliesTo: ['helm', 'ring'],
    apply: (item) => {
      item.bonusMag = (item.bonusMag || 0) + 10;
      item.bonusMana = (item.bonusMana || 0) + 25;
    }
  }
];

interface BaseTemplate {
  name: string;
  baseType: string;
  itemType: ItemType;
  gridW: number;
  gridH: number;
  minDamage?: number;
  maxDamage?: number;
  armorClass?: number;
  strReq?: number;
  dexReq?: number;
  goldValue: number;
}

const BASE_ITEMS: BaseTemplate[] = [
  // Weapons
  { name: 'Short Sword', baseType: 'sword', itemType: 'weapon', gridW: 1, gridH: 3, minDamage: 2, maxDamage: 6, strReq: 15, goldValue: 50 },
  { name: 'Broad Sword', baseType: 'sword', itemType: 'weapon', gridW: 2, gridH: 3, minDamage: 4, maxDamage: 12, strReq: 30, goldValue: 120 },
  { name: 'Battle Axe', baseType: 'axe', itemType: 'weapon', gridW: 2, gridH: 3, minDamage: 6, maxDamage: 16, strReq: 35, goldValue: 180 },
  // Shields
  { name: 'Buckler', baseType: 'shield', itemType: 'shield', gridW: 1, gridH: 2, armorClass: 5, strReq: 15, goldValue: 40 },
  { name: 'Kite Shield', baseType: 'shield', itemType: 'shield', gridW: 2, gridH: 3, armorClass: 12, strReq: 25, goldValue: 100 },
  // Armor
  { name: 'Leather Armor', baseType: 'armor', itemType: 'armor', gridW: 2, gridH: 3, armorClass: 8, strReq: 15, goldValue: 70 },
  { name: 'Ring Mail', baseType: 'armor', itemType: 'armor', gridW: 2, gridH: 3, armorClass: 15, strReq: 25, goldValue: 150 },
  { name: 'Plate Mail', baseType: 'armor', itemType: 'armor', gridW: 2, gridH: 3, armorClass: 25, strReq: 40, goldValue: 320 },
  // Helm
  { name: 'Cap', baseType: 'helm', itemType: 'helm', gridW: 2, gridH: 2, armorClass: 2, goldValue: 30 },
  { name: 'Great Helm', baseType: 'helm', itemType: 'helm', gridW: 2, gridH: 2, armorClass: 8, strReq: 25, goldValue: 120 }
];

export function generateLootItem(dungeonFloor: number): Item {
  // Determine rarity:
  // 60% normal, 30% magic, 10% rare
  const roll = Math.random();
  let rarity: ItemRarity = 'normal';
  if (roll > 0.88) {
    rarity = 'rare';
  } else if (roll > 0.55) {
    rarity = 'magic';
  }

  // Pick random base template
  const template = BASE_ITEMS[Math.floor(Math.random() * BASE_ITEMS.length)];

  const item: Item = {
    id: `item_${Date.now()}_${Math.random()}`,
    name: template.name,
    baseType: template.baseType,
    itemType: template.itemType,
    rarity,
    gridW: template.gridW,
    gridH: template.gridH,
    minDamage: template.minDamage,
    maxDamage: template.maxDamage,
    armorClass: template.armorClass,
    strReq: template.strReq,
    dexReq: template.dexReq,
    identified: rarity === 'normal', // magic/rare start unidentified
    goldValue: template.goldValue
  };

  if (rarity === 'normal') {
    return item;
  }

  // Filter matching affixes
  const matchingPrefixes = PREFIXES.filter(p => p.appliesTo.includes(item.itemType));
  const matchingSuffixes = SUFFIXES.filter(s => s.appliesTo.includes(item.itemType));

  let chosenPrefix: Affix | null = null;
  let chosenSuffix: Affix | null = null;

  if (rarity === 'magic') {
    // 50% prefix, 50% suffix, or both
    const r = Math.random();
    if (r < 0.45 && matchingPrefixes.length > 0) {
      chosenPrefix = matchingPrefixes[Math.floor(Math.random() * matchingPrefixes.length)];
    } else if (r < 0.9 && matchingSuffixes.length > 0) {
      chosenSuffix = matchingSuffixes[Math.floor(Math.random() * matchingSuffixes.length)];
    } else if (matchingPrefixes.length > 0 && matchingSuffixes.length > 0) {
      chosenPrefix = matchingPrefixes[Math.floor(Math.random() * matchingPrefixes.length)];
      chosenSuffix = matchingSuffixes[Math.floor(Math.random() * matchingSuffixes.length)];
    }
  } else if (rarity === 'rare') {
    // Rare gets both prefix and suffix plus enhanced stats
    if (matchingPrefixes.length > 0) {
      chosenPrefix = matchingPrefixes[Math.floor(Math.random() * matchingPrefixes.length)];
    }
    if (matchingSuffixes.length > 0) {
      chosenSuffix = matchingSuffixes[Math.floor(Math.random() * matchingSuffixes.length)];
    }
  }

  // Apply affix stats and construct name
  let generatedName = template.name;
  if (chosenPrefix) {
    chosenPrefix.apply(item);
    item.prefix = chosenPrefix.name;
    generatedName = `${chosenPrefix.name} ${generatedName}`;
    item.goldValue = Math.round(item.goldValue * 2.2);
  }
  if (chosenSuffix) {
    chosenSuffix.apply(item);
    item.suffix = chosenSuffix.name;
    generatedName = `${generatedName} ${chosenSuffix.name}`;
    item.goldValue = Math.round(item.goldValue * 2.2);
  }

  item.name = generatedName;

  return item;
}
