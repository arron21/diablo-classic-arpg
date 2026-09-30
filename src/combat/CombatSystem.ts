/**
 * Combat System: Hit Calculation, Armor Mitigation, Block Chances,
 * Floating Damage Numbers, and Blood Decals.
 */

import { Player } from '../entities/Player.js';
import { Monster } from '../entities/Monster.js';
import { Butcher } from '../entities/Butcher.js';
import { Item } from '../items/Item.js';
import { generateLootItem, } from '../items/AffixGenerator.js';
import { createButchersCleaver, createGoldPile, createPotion } from '../items/Item.js';

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  lifetime: number;
  maxLifetime: number;
}

export interface BloodDecal {
  x: number;
  y: number;
  size: number;
  color: string;
}

export interface GroundItem {
  item: Item;
  x: number;
  y: number;
}

export class CombatSystem {
  public floatingTexts: FloatingText[] = [];
  public bloodDecals: BloodDecal[] = [];
  public groundItems: GroundItem[] = [];

  public update(dt: number) {
    // Update floating combat texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.lifetime -= dt;
      ft.y -= 0.8 * dt; // Float upward
      if (ft.lifetime <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  /**
   * Resolves player attack against a monster or boss.
   */
  public playerAttackMonster(
    player: Player,
    target: Monster | Butcher,
    dungeonFloor: number,
    onHitSound: (type: 'hit' | 'kill', monsterType: 'skeleton' | 'zombie' | 'butcher') => void
  ): boolean {
    const stats = player.getEffectiveStats();

    // Hit chance: 50% base + Dex/2 + bonusToHit - target AC
    const hitChance = Math.min(95, Math.max(5, stats.toHit - target.ac));
    const roll = Math.random() * 100;

    if (roll > hitChance) {
      // Miss
      this.addFloatingText(target.gx, target.gy, 'MISS', '#9aa0a6');
      return false;
    }

    // Hit success: calculate damage
    const damage = Math.floor(Math.random() * (stats.maxDmg - stats.minDmg + 1)) + stats.minDmg;
    const fatal = target.takeDamage(damage);

    this.addFloatingText(target.gx, target.gy, `-${damage}`, '#e53935');
    this.addBloodDecal(target.gx, target.gy);

    const mType: 'skeleton' | 'zombie' | 'butcher' = target instanceof Butcher ? 'butcher' : (target as Monster).monsterType;

    if (fatal) {
      onHitSound('kill', mType);
      player.addExperience(target instanceof Butcher ? target.xpReward : (target as Monster).xpReward);

      // Spawn loot drops
      this.spawnMonsterLoot(target, dungeonFloor);
    } else {
      onHitSound('hit', mType);
    }

    return true;
  }

  /**
   * Resolves monster attack against the player.
   */
  public monsterAttackPlayer(
    attacker: Monster | Butcher,
    player: Player,
    onPlayerHit: (type: 'flesh' | 'block') => void
  ): boolean {
    const stats = player.getEffectiveStats();

    // Shield block check
    if (stats.blockChance > 0) {
      const blockRoll = Math.random() * 100;
      if (blockRoll < stats.blockChance) {
        this.addFloatingText(player.gx, player.gy, 'BLOCKED', '#42a5f5');
        onPlayerHit('block');
        return false;
      }
    }

    // Hit calculation
    const hitChance = Math.min(95, Math.max(10, 60 - stats.ac));
    const roll = Math.random() * 100;

    if (roll > hitChance) {
      this.addFloatingText(player.gx, player.gy, 'MISS', '#9aa0a6');
      return false;
    }

    // Damage roll
    const damage = Math.floor(Math.random() * (attacker.maxDmg - attacker.minDmg + 1)) + attacker.minDmg;
    player.takeDamage(damage);

    this.addFloatingText(player.gx, player.gy, `-${damage}`, '#ff1744');
    this.addBloodDecal(player.gx, player.gy);
    onPlayerHit('flesh');

    return true;
  }

  private spawnMonsterLoot(target: Monster | Butcher, floorLevel: number) {
    if (target instanceof Butcher) {
      // The Butcher guarantees dropping the iconic Cleaver + large gold pile + health potion!
      this.groundItems.push({
        item: createButchersCleaver(),
        x: target.gx,
        y: target.gy
      });
      this.groundItems.push({
        item: createGoldPile(150 + Math.floor(Math.random() * 150)),
        x: target.gx + 0.5,
        y: target.gy - 0.3
      });
      this.groundItems.push({
        item: createPotion('health'),
        x: target.gx - 0.4,
        y: target.gy + 0.4
      });
      return;
    }

    // Standard monster loot drop rates
    const roll = Math.random();
    if (roll < 0.35) {
      // Drops gold
      const goldAmt = Math.floor(Math.random() * 25) + 10;
      this.groundItems.push({
        item: createGoldPile(goldAmt),
        x: target.gx,
        y: target.gy
      });
    } else if (roll < 0.6) {
      // Drops health/mana potion
      const potType = Math.random() > 0.4 ? 'health' : 'mana';
      this.groundItems.push({
        item: createPotion(potType),
        x: target.gx,
        y: target.gy
      });
    } else if (roll < 0.85) {
      // Drops equipment
      const item = generateLootItem(floorLevel);
      this.groundItems.push({
        item,
        x: target.gx,
        y: target.gy
      });
    }
  }

  public addFloatingText(x: number, y: number, text: string, color: string) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      lifetime: 1.0,
      maxLifetime: 1.0
    });
  }

  public addBloodDecal(x: number, y: number) {
    this.bloodDecals.push({
      x: x + (Math.random() - 0.5) * 0.4,
      y: y + (Math.random() - 0.5) * 0.4,
      size: 6 + Math.random() * 8,
      color: Math.random() > 0.5 ? '#7a0a14' : '#52060d'
    });

    // Limit maximum ground blood splatters to keep rendering lightweight
    if (this.bloodDecals.length > 80) {
      this.bloodDecals.shift();
    }
  }
}
