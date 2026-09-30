import { describe, it, expect } from 'vitest';
import { generateLootItem } from '../src/items/AffixGenerator.js';
import { createButchersCleaver, createGoldPile, createPotion } from '../src/items/Item.js';

describe('Diablo Loot & Affix Generator', () => {
  it('should generate valid loot items with stats and non-empty names', () => {
    for (let i = 0; i < 20; i++) {
      const item = generateLootItem(1);

      expect(item.id).toBeDefined();
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.goldValue).toBeGreaterThan(0);
      expect(item.gridW).toBeGreaterThan(0);
      expect(item.gridH).toBeGreaterThan(0);

      if (item.rarity === 'magic' || item.rarity === 'rare') {
        expect(item.prefix || item.suffix).toBeDefined();
      }
    }
  });

  it('should generate unique item The Butchers Cleaver with signature stats', () => {
    const cleaver = createButchersCleaver();

    expect(cleaver.rarity).toBe('unique');
    expect(cleaver.name).toBe("The Butcher's Cleaver");
    expect(cleaver.minDamage).toBe(12);
    expect(cleaver.maxDamage).toBe(24);
    expect(cleaver.bonusStr).toBe(10);
    expect(cleaver.bonusLife).toBe(20);
    expect(cleaver.identified).toBe(true);
  });

  it('should create valid potion and gold items', () => {
    const pot = createPotion('health');
    expect(pot.itemType).toBe('potion');
    expect(pot.healAmount).toBe(50);

    const gold = createGoldPile(250);
    expect(gold.itemType).toBe('gold');
    expect(gold.goldValue).toBe(250);
  });
});
