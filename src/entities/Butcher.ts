/**
 * The Butcher Boss Entity.
 * Iconic Diablo 1 boss with relentless chase AI, massive cleave damage,
 * and guaranteed unique item drop.
 */

import { Entity } from './Entity.js';
import { Player } from './Player.js';
import { findPath } from '../world/Pathfinding.js';
import { gridDistance } from '../renderer/Isometric.js';

export class Butcher extends Entity {
  public minDmg: number = 10;
  public maxDmg: number = 22;
  public ac: number = 12;
  public xpReward: number = 300;
  public aggroRadius: number = 10.0;
  public hasRoared: boolean = false;
  private pathRepathTimer: number = 0;

  constructor(gx: number, gy: number) {
    super('boss_butcher', 'The Butcher', gx, gy, 240);
    this.speed = 3.6; // High speed pursuit
  }

  public updateAI(
    dt: number,
    player: Player,
    isWalkable: (x: number, y: number) => boolean,
    hasLineOfSight: (x1: number, y1: number, x2: number, y2: number) => boolean,
    onRoar: () => void
  ): boolean {
    if (this.isDead || player.isDead) return false;

    const dist = gridDistance(this.gx, this.gy, player.gx, player.gy);

    // Aggro check
    if (!this.hasRoared) {
      if (dist <= this.aggroRadius && hasLineOfSight(this.gx, this.gy, player.gx, player.gy)) {
        this.hasRoared = true;
        onRoar(); // Trigger "Ah, Fresh Meat!"
      }
    }

    if (!this.hasRoared) return false;

    // Melee attack range check
    if (dist <= 1.45) {
      this.path = [];
      this.targetTile = null;

      if (this.attackCooldown <= 0) {
        this.state = 'attack';
        this.frame = 0;
        this.attackCooldown = 0.9; // Fast heavy swings
        return true; // Performed attack
      }
      return false;
    }

    // Relentless pursuit
    this.pathRepathTimer -= dt;
    if (this.pathRepathTimer <= 0) {
      this.pathRepathTimer = 0.35; // Fast repathing
      const path = findPath(
        Math.round(this.gx),
        Math.round(this.gy),
        Math.round(player.gx),
        Math.round(player.gy),
        isWalkable
      );
      if (path.length > 0) {
        this.path = path;
      }
    }

    return false;
  }
}
