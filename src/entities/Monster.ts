/**
 * Monster Entities and AI Behaviors.
 */

import { Entity } from './Entity.js';
import { Player } from './Player.js';
import { findPath } from '../world/Pathfinding.js';
import { gridDistance } from '../renderer/Isometric.js';

export type MonsterType = 'skeleton' | 'zombie';

export class Monster extends Entity {
  public monsterType: MonsterType;
  public minDmg: number;
  public maxDmg: number;
  public ac: number;
  public xpReward: number;
  public aggroRadius: number;
  public isAggroed: boolean = false;
  private pathRepathTimer: number = 0;

  constructor(id: string, type: MonsterType, gx: number, gy: number) {
    if (type === 'skeleton') {
      super(id, 'Skeleton', gx, gy, 28);
      this.speed = 3.0;
      this.minDmg = 3;
      this.maxDmg = 7;
      this.ac = 6;
      this.xpReward = 35;
      this.aggroRadius = 7.0;
    } else {
      // Zombie
      super(id, 'Zombie', gx, gy, 55);
      this.speed = 1.8;
      this.minDmg = 5;
      this.maxDmg = 11;
      this.ac = 2;
      this.xpReward = 45;
      this.aggroRadius = 6.0;
    }
    this.monsterType = type;
  }

  public updateAI(
    dt: number,
    player: Player,
    isWalkable: (x: number, y: number) => boolean,
    hasLineOfSight: (x1: number, y1: number, x2: number, y2: number) => boolean
  ): boolean {
    if (this.isDead || player.isDead) return false;

    const dist = gridDistance(this.gx, this.gy, player.gx, player.gy);

    // Check aggro trigger
    if (!this.isAggroed) {
      if (dist <= this.aggroRadius && hasLineOfSight(this.gx, this.gy, player.gx, player.gy)) {
        this.isAggroed = true;
      }
    }

    if (!this.isAggroed) return false;

    // Melee attack range check
    if (dist <= 1.45) {
      this.path = [];
      this.targetTile = null;

      if (this.attackCooldown <= 0) {
        this.state = 'attack';
        this.frame = 0;
        this.attackCooldown = this.monsterType === 'skeleton' ? 1.0 : 1.6;
        return true; // Performed attack
      }
      return false;
    }

    // Path to player
    this.pathRepathTimer -= dt;
    if (this.pathRepathTimer <= 0) {
      this.pathRepathTimer = 0.5; // Repath every 0.5s
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
