import { describe, it, expect, beforeEach } from 'vitest';
import { Inventory } from '../src/items/Inventory.js';
import { Item, createPotion, createButchersCleaver } from '../src/items/Item.js';

describe('Inventory & Equipment System', () => {
  let inventory: Inventory;

  beforeEach(() => {
    inventory = new Inventory();
  });

  it('should initialize with empty 10x4 grid and default gold', () => {
    expect(Inventory.COLS).toBe(10);
    expect(Inventory.ROWS).toBe(4);
    expect(inventory.grid.length).toBe(4);
    expect(inventory.grid[0].length).toBe(10);
    expect(inventory.gold).toBe(100);
  });

  it('should allow placing 1x1 items within bounds', () => {
    const potion = createPotion('health');
    const placed = inventory.placeItem(potion, 0, 0);

    expect(placed).toBe(true);
    expect(inventory.grid[0][0]).toBe(potion);
  });

  it('should prevent placing multi-tile items out of bounds', () => {
    const cleaver = createButchersCleaver(); // 2x3 size
    // Place at col 9 (width 2 means exceeds 10)
    const invalidPlaced = inventory.placeItem(cleaver, 9, 0);
    expect(invalidPlaced).toBe(false);

    // Place at row 3 (height 3 means exceeds 4)
    const invalidRow = inventory.placeItem(cleaver, 0, 2);
    expect(invalidRow).toBe(false);
  });

  it('should prevent overlapping items on the grid', () => {
    const cleaver = createButchersCleaver(); // 2x3 size
    const potion = createPotion('health'); // 1x1

    inventory.placeItem(cleaver, 0, 0);

    // Try placing potion at (1, 1), which is covered by the 2x3 cleaver
    const overlappingPlaced = inventory.placeItem(potion, 1, 1);
    expect(overlappingPlaced).toBe(false);
  });

  it('should remove items cleanly from the grid', () => {
    const cleaver = createButchersCleaver();
    inventory.placeItem(cleaver, 2, 0);

    expect(inventory.grid[0][2]).toBe(cleaver);
    expect(inventory.grid[2][3]).toBe(cleaver);

    const removed = inventory.removeItem(cleaver);
    expect(removed).toBe(true);
    expect(inventory.grid[0][2]).toBe(null);
    expect(inventory.grid[2][3]).toBe(null);
  });

  it('should correctly equip and calculate equipment bonuses', () => {
    const cleaver = createButchersCleaver(); // +10 Str, +20 Life, 12-24 dmg
    const { success } = inventory.equipItem(cleaver);

    expect(success).toBe(true);
    expect(inventory.equipment.mainHand).toBe(cleaver);

    const bonuses = inventory.getEquipmentBonuses();
    expect(bonuses.strBonus).toBe(10);
    expect(bonuses.lifeBonus).toBe(20);
    expect(bonuses.minDmgBonus).toBe(12);
    expect(bonuses.maxDmgBonus).toBe(24);
  });
});
