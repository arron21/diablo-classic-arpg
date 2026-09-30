/**
 * Player Entity (The Warrior).
 * Faithful implementation of Diablo 1 Warrior attributes, leveling,
 * and melee weapon mechanics.
 */

import { Entity } from './Entity.js';
import { Inventory } from '../items/Inventory.js';
import { createPotion } from '../items/Item.js';

export class Player extends Entity {
  // Attributes
  public strength: number = 30;
  public dexterity: number = 20;
  public vitality: number = 25;
  public magic: number = 10;
  public statPoints: number = 0;

  // Level & XP
  public level: number = 1;
  public experience: number = 0;
  public nextLevelXp: number = 500;

  // Vitals
  public mana: number = 20;
  public maxMana: number = 20;

  // Equipment & Inventory
  public inventory: Inventory;

  // Light Radius (in tiles)
  public lightRadius: number = 8.5;

  constructor(gx: number, gy: number) {
    super('player_warrior', 'Warrior', gx, gy, 70);
    this.speed = 4.0;
    this.inventory = new Inventory();

    // Start with starting health potions
    this.inventory.addItemAuto(createPotion('health'));
    this.inventory.addItemAuto(createPotion('health'));
    this.inventory.addItemAuto(createPotion('mana'));

    this.recalculateStats();
    this.hp = this.maxHp;
    this.mana = this.maxMana;
  }

  public recalculateStats() {
    const bonuses = this.inventory.getEquipmentBonuses();

    const effectiveVit = this.vitality + bonuses.vitBonus;
    const effectiveMag = this.magic + bonuses.magBonus;

    this.maxHp = Math.round(effectiveVit * 2 + this.level * 4 + bonuses.lifeBonus);
    this.maxMana = Math.round(effectiveMag * 1.5 + this.level * 2 + bonuses.manaBonus);

    // Keep current values within bounds
    this.hp = Math.min(this.hp, this.maxHp);
    this.mana = Math.min(this.mana, this.maxMana);
  }

  public getEffectiveStats() {
    const b = this.inventory.getEquipmentBonuses();
    const str = this.strength + b.strBonus;
    const dex = this.dexterity + b.dexBonus;
    const vit = this.vitality + b.vitBonus;
    const mag = this.magic + b.magBonus;

    // Armor Class
    const ac = Math.floor(dex / 5) + b.totalAC;

    // Damage Range
    const baseMin = (b.minDmgBonus || 3);
    const baseMax = (b.maxDmgBonus || 8);
    const strMultiplier = 1 + str / 100;
    const minDmg = Math.max(1, Math.round(baseMin * strMultiplier));
    const maxDmg = Math.max(minDmg, Math.round(baseMax * strMultiplier));

    // To-Hit %
    const toHit = 50 + Math.floor(dex / 2) + b.toHitBonus;

    // Block Chance % (if shield equipped)
    const hasShield = this.inventory.equipment.offHand !== null;
    const blockChance = hasShield ? Math.min(75, Math.floor(dex / 2)) : 0;

    return {
      str,
      dex,
      vit,
      mag,
      ac,
      minDmg,
      maxDmg,
      toHit,
      blockChance,
      attackSpeedMultiplier: b.attackSpeedMultiplier
    };
  }

  public addExperience(amount: number): boolean {
    this.experience += amount;
    let leveledUp = false;

    while (this.experience >= this.nextLevelXp) {
      this.level++;
      this.statPoints += 5;
      this.nextLevelXp = Math.floor(this.nextLevelXp * 1.75);
      this.recalculateStats();
      this.hp = this.maxHp;
      this.mana = this.maxMana;
      leveledUp = true;
    }

    return leveledUp;
  }

  public allocateStat(stat: 'str' | 'dex' | 'vit' | 'mag'): boolean {
    if (this.statPoints <= 0) return false;

    if (stat === 'str') this.strength += 1;
    else if (stat === 'dex') this.dexterity += 1;
    else if (stat === 'vit') this.vitality += 1;
    else if (stat === 'mag') this.magic += 1;

    this.statPoints -= 1;
    this.recalculateStats();
    return true;
  }

  public useBeltPotion(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= 4) return false;
    const potion = this.inventory.belt[slotIndex];
    if (!potion) return false;

    if (potion.healAmount && this.hp < this.maxHp) {
      this.heal(potion.healAmount);
      this.inventory.belt[slotIndex] = null;
      return true;
    }
    if (potion.manaAmount && this.mana < this.maxMana) {
      this.mana = Math.min(this.maxMana, this.mana + potion.manaAmount);
      this.inventory.belt[slotIndex] = null;
      return true;
    }

    return false;
  }
}
