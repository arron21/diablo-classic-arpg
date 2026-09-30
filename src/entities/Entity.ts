/**
 * Base Entity class for isometric grid-aligned actors.
 */

import { Direction, getDirection } from '../renderer/Isometric.js';

export type EntityState = 'idle' | 'walk' | 'attack' | 'hit' | 'dead';

export abstract class Entity {
  public id: string;
  public name: string;
  // World grid coordinates (continuous)
  public gx: number;
  public gy: number;
  // Heading & animation
  public direction: Direction = 'S';
  public state: EntityState = 'idle';
  public frame: number = 0;
  protected animTimer: number = 0;
  public frameRate: number = 8; // frames per second

  // Movement
  public speed: number = 3.5; // tiles per second
  public path: { x: number; y: number }[] = [];
  public targetTile: { x: number; y: number } | null = null;

  // Combat stats
  public hp: number = 100;
  public maxHp: number = 100;
  public attackCooldown: number = 0;
  public hitRecoveryTimer: number = 0;
  public isDead: boolean = false;

  constructor(id: string, name: string, gx: number, gy: number, hp: number) {
    this.id = id;
    this.name = name;
    this.gx = gx;
    this.gy = gy;
    this.hp = hp;
    this.maxHp = hp;
  }

  public update(dt: number) {
    // Hit recovery pause
    if (this.hitRecoveryTimer > 0) {
      this.hitRecoveryTimer -= dt;
      if (this.hitRecoveryTimer <= 0 && !this.isDead) {
        this.state = 'idle';
      }
      return;
    }

    if (this.isDead) {
      this.state = 'dead';
      return;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    // Advance animation
    this.animTimer += dt;
    if (this.animTimer >= 1 / this.frameRate) {
      this.animTimer = 0;
      this.frame = (this.frame + 1) % 4;

      if (this.state === 'attack' && this.frame === 0) {
        // Attack animation cycle finished
        this.state = 'idle';
      }
    }

    // Path movement
    if (this.state !== 'attack') {
      this.processMovement(dt);
    }
  }

  protected processMovement(dt: number) {
    if (this.path.length === 0 && !this.targetTile) {
      if (this.state === 'walk') {
        this.state = 'idle';
      }
      return;
    }

    if (!this.targetTile && this.path.length > 0) {
      this.targetTile = this.path.shift()!;
    }

    if (this.targetTile) {
      const dx = this.targetTile.x - this.gx;
      const dy = this.targetTile.y - this.gy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.01) {
        this.direction = getDirection(dx, dy);
        this.state = 'walk';
      }

      const moveStep = this.speed * dt;
      if (dist <= moveStep) {
        this.gx = this.targetTile.x;
        this.gy = this.targetTile.y;
        this.targetTile = null;
      } else {
        this.gx += (dx / dist) * moveStep;
        this.gy += (dy / dist) * moveStep;
      }
    }
  }

  public takeDamage(amount: number): boolean {
    if (this.isDead) return false;

    this.hp = Math.max(0, this.hp - amount);
    if (this.hp === 0) {
      this.isDead = true;
      this.state = 'dead';
      this.path = [];
      this.targetTile = null;
      return true; // Fatal blow
    } else {
      // Trigger Hit Recovery Stun
      this.state = 'hit';
      this.hitRecoveryTimer = 0.25; // 250ms hit recovery
      this.frame = 0;
      return false;
    }
  }

  public heal(amount: number) {
    if (this.isDead) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }
}
