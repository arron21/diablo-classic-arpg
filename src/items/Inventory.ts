/**
 * Diablo Tetris-style Grid Inventory & Paperdoll Equipment Management.
 */

import { Item, ItemType } from './Item.js';

export interface GridItemPlacement {
  item: Item;
  x: number; // 0..9
  y: number; // 0..3
}

export type EquipmentSlot = 'head' | 'neck' | 'body' | 'mainHand' | 'offHand' | 'leftRing' | 'rightRing';

export class Inventory {
  public static readonly COLS = 10;
  public static readonly ROWS = 4;

  // Grid storing Item reference or null for each of 10x4 cells
  public grid: (Item | null)[][];
  public placedItems: GridItemPlacement[] = [];

  // Paperdoll equipment
  public equipment: Record<EquipmentSlot, Item | null> = {
    head: null,
    neck: null,
    body: null,
    mainHand: null,
    offHand: null,
    leftRing: null,
    rightRing: null
  };

  // Belt slots (1-4)
  public belt: (Item | null)[] = [null, null, null, null];

  // Gold coins
  public gold: number = 100;

  constructor() {
    this.grid = Array.from({ length: Inventory.ROWS }, () =>
      Array.from({ length: Inventory.COLS }, () => null)
    );
  }

  /**
   * Checks if an item of size (w, h) can fit at grid position (x, y),
   * optionally ignoring an item (e.g., when picking it up or moving it).
   */
  public canPlace(x: number, y: number, w: number, h: number, ignoreItem?: Item): boolean {
    if (x < 0 || y < 0 || x + w > Inventory.COLS || y + h > Inventory.ROWS) {
      return false;
    }

    for (let r = y; r < y + h; r++) {
      for (let c = x; c < x + w; c++) {
        const cell = this.grid[r][c];
        if (cell !== null && cell !== ignoreItem) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Places an item at (x, y). Assumes canPlace() has already checked or will fail.
   */
  public placeItem(item: Item, x: number, y: number): boolean {
    if (!this.canPlace(x, y, item.gridW, item.gridH)) {
      return false;
    }

    for (let r = y; r < y + item.gridH; r++) {
      for (let c = x; c < x + item.gridW; c++) {
        this.grid[r][c] = item;
      }
    }

    this.placedItems.push({ item, x, y });
    return true;
  }

  /**
   * Removes an item from the grid.
   */
  public removeItem(item: Item): boolean {
    const idx = this.placedItems.findIndex(p => p.item.id === item.id);
    if (idx === -1) return false;

    const placement = this.placedItems[idx];
    for (let r = placement.y; r < placement.y + item.gridH; r++) {
      for (let c = placement.x; c < placement.x + item.gridW; c++) {
        if (this.grid[r][c] === item) {
          this.grid[r][c] = null;
        }
      }
    }

    this.placedItems.splice(idx, 1);
    return true;
  }

  /**
   * Finds the first available space in the grid and places the item.
   */
  public addItemAuto(item: Item): boolean {
    // If it's gold, add to gold purse directly
    if (item.itemType === 'gold') {
      this.gold += item.goldValue;
      return true;
    }

    // Try placing into belt first if it's a potion and belt has empty slots
    if (item.itemType === 'potion') {
      for (let i = 0; i < 4; i++) {
        if (this.belt[i] === null) {
          this.belt[i] = item;
          return true;
        }
      }
    }

    // Scan grid top-to-bottom, left-to-right
    for (let r = 0; r <= Inventory.ROWS - item.gridH; r++) {
      for (let c = 0; c <= Inventory.COLS - item.gridW; c++) {
        if (this.canPlace(c, r, item.gridW, item.gridH)) {
          return this.placeItem(item, c, r);
        }
      }
    }

    return false; // Inventory full
  }

  /**
   * Equips an item into the appropriate equipment slot.
   */
  public equipItem(item: Item, slot?: EquipmentSlot): { success: boolean; oldItem: Item | null } {
    const targetSlot = slot || this.getDefaultSlotForItem(item.itemType);
    if (!targetSlot) return { success: false, oldItem: null };

    // Validate slot compatibility
    if (!this.isItemCompatibleWithSlot(item.itemType, targetSlot)) {
      return { success: false, oldItem: null };
    }

    const oldItem = this.equipment[targetSlot];
    this.equipment[targetSlot] = item;
    return { success: true, oldItem };
  }

  public unequipItem(slot: EquipmentSlot): Item | null {
    const item = this.equipment[slot];
    if (item) {
      this.equipment[slot] = null;
    }
    return item;
  }

  private getDefaultSlotForItem(type: ItemType): EquipmentSlot | null {
    switch (type) {
      case 'weapon': return 'mainHand';
      case 'shield': return 'offHand';
      case 'armor': return 'body';
      case 'helm': return 'head';
      case 'ring': return this.equipment.leftRing ? 'rightRing' : 'leftRing';
      default: return null;
    }
  }

  private isItemCompatibleWithSlot(type: ItemType, slot: EquipmentSlot): boolean {
    if (slot === 'head') return type === 'helm';
    if (slot === 'body') return type === 'armor';
    if (slot === 'mainHand') return type === 'weapon';
    if (slot === 'offHand') return type === 'shield' || type === 'weapon';
    if (slot === 'leftRing' || slot === 'rightRing') return type === 'ring';
    if (slot === 'neck') return false;
    return false;
  }

  /**
   * Calculates aggregated bonus stats from all equipped items.
   */
  public getEquipmentBonuses() {
    let totalAC = 0;
    let minDmgBonus = 0;
    let maxDmgBonus = 0;
    let strBonus = 0;
    let dexBonus = 0;
    let vitBonus = 0;
    let magBonus = 0;
    let lifeBonus = 0;
    let manaBonus = 0;
    let toHitBonus = 0;
    let attackSpeedMultiplier = 1.0;

    for (const item of Object.values(this.equipment)) {
      if (!item) continue;
      if (item.armorClass) totalAC += item.armorClass;
      if (item.bonusStr) strBonus += item.bonusStr;
      if (item.bonusDex) dexBonus += item.bonusDex;
      if (item.bonusVit) vitBonus += item.bonusVit;
      if (item.bonusMag) magBonus += item.bonusMag;
      if (item.bonusLife) lifeBonus += item.bonusLife;
      if (item.bonusMana) manaBonus += item.bonusMana;
      if (item.toHitBonus) toHitBonus += item.toHitBonus;
      if (item.attackSpeedBonus) attackSpeedMultiplier *= item.attackSpeedBonus;

      // Weapon damage
      if (item.itemType === 'weapon') {
        minDmgBonus += item.minDamage || 0;
        maxDmgBonus += item.maxDamage || 0;
      }
    }

    return {
      totalAC,
      minDmgBonus,
      maxDmgBonus,
      strBonus,
      dexBonus,
      vitBonus,
      magBonus,
      lifeBonus,
      manaBonus,
      toHitBonus,
      attackSpeedMultiplier
    };
  }
}
