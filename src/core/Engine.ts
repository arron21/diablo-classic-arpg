/**
 * Main Game Engine Loop and Scene Manager for Diablo Classic ARPG.
 */

import { Camera } from './Camera.js';
import { InputManager } from './Input.js';
import { SpriteRenderer } from '../renderer/SpriteRenderer.js';
import { LightingSystem, LightSource } from '../renderer/Lighting.js';
import { screenToTile, screenToGrid, gridToScreen, gridDistance, getDirection } from '../renderer/Isometric.js';
import { TileMap, TileType, PropType } from '../world/TileMap.js';
import { generateTown, TownData } from '../world/TownGen.js';
import { generateDungeonFloor, DungeonFloor } from '../world/DungeonGen.js';
import { Player } from '../entities/Player.js';
import { Monster } from '../entities/Monster.js';
import { Butcher } from '../entities/Butcher.js';
import { CombatSystem } from '../combat/CombatSystem.js';
import { SoundSynth } from '../audio/SoundSynth.js';
import { HUD } from '../ui/HUD.js';
import { InventoryUI } from '../ui/InventoryUI.js';
import { CharacterUI } from '../ui/CharacterUI.js';
import { findPath } from '../world/Pathfinding.js';
import { createGoldPile, createPotion } from '../items/Item.js';
import { generateLootItem } from '../items/AffixGenerator.js';
import { CursorManager } from '../renderer/Cursor.js';

interface PendingInteraction {
  type: 'barrel' | 'chest' | 'door' | 'item' | 'stairs_down' | 'stairs_up';
  x: number;
  y: number;
  itemRef?: any;
}

export class Engine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private camera: Camera;
  private input: InputManager;
  private renderer: SpriteRenderer;
  private sound: SoundSynth;
  private combat: CombatSystem;
  private hud: HUD;
  private inventoryUI: InventoryUI;
  private characterUI: CharacterUI;
  private cursorManager: CursorManager;

  // World State
  private currentFloor: number = 0; // 0 = Town, 1 = Cathedral L1, 2 = Catacombs L2
  private tileMap!: TileMap;
  private lighting!: LightingSystem;
  private player!: Player;
  private monsters: (Monster | Butcher)[] = [];
  private floorTorches: { x: number; y: number }[] = [];
  private pendingInteraction: PendingInteraction | null = null;

  // Saved floors for seamless stair transitions
  private townData!: TownData;
  private floor1Data: DungeonFloor | null = null;
  private floor2Data: DungeonFloor | null = null;

  // Boss banner banner announcement
  public bossBanner: string | null = null;
  private bossBannerTimer: number = 0;

  // Performance timer
  private lastTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;

    this.camera = new Camera();
    this.input = new InputManager(canvas);
    this.renderer = new SpriteRenderer();
    this.sound = new SoundSynth();
    this.combat = new CombatSystem();
    this.hud = new HUD();
    this.inventoryUI = new InventoryUI();
    this.characterUI = new CharacterUI();
    this.cursorManager = new CursorManager();

    this.initGame();
  }

  private initGame() {
    // Generate Town
    this.townData = generateTown();
    this.tileMap = this.townData.map;
    this.lighting = new LightingSystem(this.tileMap.width, this.tileMap.height);

    // Create Warrior Player
    this.player = new Player(this.townData.playerSpawn.x, this.townData.playerSpawn.y);

    // Initial Camera
    this.camera.x = this.canvas.width / 2;
    this.camera.y = this.canvas.height / 2;

    this.currentFloor = 0;
  }

  public resize() {
    const isFull = !!document.fullscreenElement;
    const container = document.getElementById('game-container');
    if (isFull) {
      container?.classList.add('fullscreen');
    } else {
      container?.classList.remove('fullscreen');
    }

    const headerH = isFull ? 0 : 36;
    const w = window.innerWidth;
    const h = window.innerHeight - headerH;

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = Math.max(480, w);
      this.canvas.height = Math.max(360, h);
      this.ctx.imageSmoothingEnabled = false;
    }
  }

  public toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  public start() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('fullscreenchange', () => this.resize());

    // Wake up Web Audio on first user interaction
    const wakeAudio = () => {
      this.sound.playSwing();
      window.removeEventListener('pointerdown', wakeAudio);
    };
    window.addEventListener('pointerdown', wakeAudio);

    const fsBtn = document.getElementById('fullscreen-btn');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => this.toggleFullscreen());
    }

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private gameLoop(time: number) {
    const dt = Math.min(0.1, (time - this.lastTime) / 1000);
    this.lastTime = time;

    this.update(dt);
    this.render();

    this.input.endFrame();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private update(dt: number) {
    // Hotkey input
    if (this.input.isKeyJustPressed('i')) this.inventoryUI.toggle();
    if (this.input.isKeyJustPressed('c')) this.characterUI.toggle();
    if (this.input.isKeyJustPressed('m')) this.sound.enabled = !this.sound.enabled;
    if (this.input.isKeyJustPressed('f')) this.toggleFullscreen();
    if (this.input.isKeyJustPressed('1')) this.useBelt(0);
    if (this.input.isKeyJustPressed('2')) this.useBelt(1);
    if (this.input.isKeyJustPressed('3')) this.useBelt(2);
    if (this.input.isKeyJustPressed('4')) this.useBelt(3);
    if (this.input.isKeyJustPressed('escape')) {
      this.inventoryUI.visible = false;
      this.characterUI.visible = false;
    }

    // Handle UI mouse clicks
    const panelX = 40;
    const panelY = 40;
    const invX = this.canvas.width - 340;

    let clickHandled = false;
    if (this.input.mouse.leftClicked) {
      if (this.characterUI.visible && this.characterUI.handleClick(this.input.mouse.x, this.input.mouse.y, panelX, panelY, this.player)) {
        clickHandled = true;
      } else if (this.inventoryUI.visible && this.inventoryUI.handleClick(this.input.mouse.x, this.input.mouse.y, invX, panelY, this.player)) {
        clickHandled = true;
      } else {
        const hudAction = this.hud.handleClick(this.input.mouse.x, this.input.mouse.y, this.canvas.width, this.canvas.height);
        if (hudAction) {
          clickHandled = true;
          if (hudAction.action === 'char') {
            this.characterUI.toggle();
          } else if (hudAction.action === 'inv') {
            this.inventoryUI.toggle();
          } else if (hudAction.action === 'audio') {
            this.sound.enabled = !this.sound.enabled;
          } else if (hudAction.action === 'belt') {
            this.useBelt(hudAction.slot);
          }
        }
      }
    }

    this.inventoryUI.handleMouseMove(this.input.mouse.x, this.input.mouse.y, invX, panelY, this.player);

    // World interaction if not clicking UI panels or HUD
    if (!clickHandled && this.input.mouse.y < this.canvas.height - 90) {
      this.handleWorldInput();
    }

    this.updateCursor();

    // Update Entities
    this.player.update(dt);

    // Process pending interaction (navigating to barrel, chest, door, item, stairs)
    if (this.pendingInteraction) {
      const p = this.pendingInteraction;
      const dist = gridDistance(this.player.gx, this.player.gy, p.x, p.y);

      if (dist <= 1.55) {
        this.player.path = [];
        this.player.targetTile = null;

        if (p.type === 'barrel') {
          this.player.direction = getDirection(p.x - this.player.gx, p.y - this.player.gy);
          this.player.state = 'attack';
          this.player.frame = 0;
          this.sound.playSwing();
          this.breakBarrelWithLoot(p.x, p.y);
        } else if (p.type === 'chest') {
          this.player.direction = getDirection(p.x - this.player.gx, p.y - this.player.gy);
          this.openChestWithLoot(p.x, p.y);
        } else if (p.type === 'door') {
          if (this.tileMap.openDoor(p.x, p.y)) {
            this.sound.playBlock();
          }
        } else if (p.type === 'item') {
          const itemIdx = this.combat.groundItems.findIndex(gi => gi === p.itemRef || gridDistance(gi.x, gi.y, p.x, p.y) < 1.2);
          if (itemIdx !== -1) {
            const gi = this.combat.groundItems[itemIdx];
            if (gi.item.itemType === 'gold') this.sound.playGoldPickup();
            else this.sound.playPotionDrink();
            this.player.inventory.addItemAuto(gi.item);
            this.combat.groundItems.splice(itemIdx, 1);
          }
        } else if (p.type === 'stairs_down') {
          this.transitionToFloor(this.currentFloor + 1);
        } else if (p.type === 'stairs_up') {
          this.transitionToFloor(this.currentFloor - 1);
        }

        this.pendingInteraction = null;
      } else if (this.player.path.length === 0 && !this.player.targetTile) {
        // Player path completed or blocked without reaching target
        this.pendingInteraction = null;
      }
    }

    for (const monster of this.monsters) {
      monster.update(dt);

      // AI updates
      if (monster instanceof Butcher) {
        const attacked = monster.updateAI(
          dt,
          this.player,
          (x, y) => this.tileMap.isWalkable(x, y),
          (x1, y1, x2, y2) => this.hasLineOfSight(x1, y1, x2, y2),
          () => {
            // Boss Roar Trigger
            this.sound.playButcherRoar();
            this.camera.triggerShake(0.8, 8);
            this.bossBanner = 'THE BUTCHER: "Ah, Fresh Meat!"';
            this.bossBannerTimer = 4.0;
          }
        );
        if (attacked) {
          this.combat.monsterAttackPlayer(monster, this.player, (hitType) => {
            if (hitType === 'block') this.sound.playBlock();
            else this.sound.playHitFlesh();
          });
        }
      } else {
        const attacked = (monster as Monster).updateAI(
          dt,
          this.player,
          (x, y) => this.tileMap.isWalkable(x, y),
          (x1, y1, x2, y2) => this.hasLineOfSight(x1, y1, x2, y2)
        );
        if (attacked) {
          this.combat.monsterAttackPlayer(monster, this.player, (hitType) => {
            if (hitType === 'block') this.sound.playBlock();
            else this.sound.playHitFlesh();
          });
        }
      }
    }

    // Clean up dead monsters after fade
    this.combat.update(dt);

    // Update Camera
    this.camera.update(dt, this.player.gx, this.player.gy, this.canvas.width, this.canvas.height);

    // Update Lighting
    const lightSources: LightSource[] = [];
    if (this.currentFloor > 0) {
      lightSources.push({
        x: this.player.gx,
        y: this.player.gy,
        radius: this.player.lightRadius,
        intensity: 1.0,
        color: '#ffa040'
      });
      for (const t of this.floorTorches) {
        lightSources.push({
          x: t.x,
          y: t.y,
          radius: 5.5,
          intensity: 0.8,
          color: '#ff8020'
        });
      }
    }
    this.lighting.update(lightSources, (x, y) => this.tileMap.isOpaque(x, y), this.currentFloor === 0);

    // Boss banner timer
    if (this.bossBannerTimer > 0) {
      this.bossBannerTimer -= dt;
      if (this.bossBannerTimer <= 0) {
        this.bossBanner = null;
      }
    }

    // Player Death respawn check
    if (this.player.isDead && this.player.hitRecoveryTimer <= 0) {
      this.player.hp = this.player.maxHp;
      this.player.isDead = false;
      this.player.state = 'idle';
      this.transitionToFloor(0); // Return to Tristram
    }
  }

  private handleWorldInput() {
    const tile = screenToTile(this.input.mouse.x, this.input.mouse.y, this.camera.x, this.camera.y);

    // Continuous Left-Down (Diablo continuous movement or attacking)
    if (this.input.mouse.isLeftDown) {
      // 1. Check if clicking on an alive monster
      const targetMonster = this.monsters.find(m => !m.isDead && gridDistance(m.gx, m.gy, tile.x, tile.y) < 1.0);

      if (targetMonster) {
        const dist = gridDistance(this.player.gx, this.player.gy, targetMonster.gx, targetMonster.gy);
        if (dist <= 1.45) {
          // In melee range: attack!
          this.player.path = [];
          this.player.targetTile = null;

          if (this.player.attackCooldown <= 0) {
            this.player.state = 'attack';
            this.player.frame = 0;
            this.sound.playSwing();
            this.player.attackCooldown = 0.5;

            this.combat.playerAttackMonster(this.player, targetMonster, this.currentFloor, (type, mType) => {
              if (type === 'kill') {
                this.sound.playMonsterDeath(mType);
                if (targetMonster instanceof Butcher) {
                  this.bossBanner = 'VICTORY: The Butcher has been slain!';
                  this.bossBannerTimer = 5.0;
                }
              } else {
                this.sound.playHitFlesh(mType);
              }
            });
          }
        } else {
          // Move toward monster
          const path = findPath(
            Math.round(this.player.gx),
            Math.round(this.player.gy),
            Math.round(targetMonster.gx),
            Math.round(targetMonster.gy),
            (x, y) => this.tileMap.isWalkable(x, y)
          );
          if (path.length > 0) this.player.path = path;
        }
        return;
      }

      // 2. Interactive Objects clicked
      if (this.input.mouse.leftClicked) {
        // Ground Item
        const itemIdx = this.combat.groundItems.findIndex(gi => gridDistance(gi.x, gi.y, tile.x, tile.y) < 1.2);
        if (itemIdx !== -1) {
          const gi = this.combat.groundItems[itemIdx];
          const dist = gridDistance(this.player.gx, this.player.gy, gi.x, gi.y);
          if (dist <= 1.55) {
            if (gi.item.itemType === 'gold') this.sound.playGoldPickup();
            else this.sound.playPotionDrink();
            this.player.inventory.addItemAuto(gi.item);
            this.combat.groundItems.splice(itemIdx, 1);
            this.pendingInteraction = null;
          } else {
            this.pendingInteraction = { type: 'item', x: gi.x, y: gi.y, itemRef: gi };
            const path = findPath(
              Math.round(this.player.gx),
              Math.round(this.player.gy),
              Math.round(gi.x),
              Math.round(gi.y),
              (x, y) => this.tileMap.isWalkable(x, y)
            );
            if (path.length > 0) this.player.path = path;
          }
          return;
        }

        const currentTile = this.tileMap.get(tile.x, tile.y);

        // Barrel
        if (currentTile && currentTile.prop === PropType.BARREL) {
          const dist = gridDistance(this.player.gx, this.player.gy, tile.x, tile.y);
          if (dist <= 1.55) {
            this.player.path = [];
            this.player.targetTile = null;
            this.player.direction = getDirection(tile.x - this.player.gx, tile.y - this.player.gy);
            this.player.state = 'attack';
            this.player.frame = 0;
            this.sound.playSwing();
            this.breakBarrelWithLoot(tile.x, tile.y);
            this.pendingInteraction = null;
          } else {
            this.pendingInteraction = { type: 'barrel', x: tile.x, y: tile.y };
            const path = findPath(
              Math.round(this.player.gx),
              Math.round(this.player.gy),
              tile.x,
              tile.y,
              (x, y) => this.tileMap.isWalkable(x, y)
            );
            if (path.length > 0) this.player.path = path;
          }
          return;
        }

        // Closed Chest
        if (currentTile && currentTile.prop === PropType.CHEST_CLOSED) {
          const dist = gridDistance(this.player.gx, this.player.gy, tile.x, tile.y);
          if (dist <= 1.55) {
            this.player.path = [];
            this.player.targetTile = null;
            this.player.direction = getDirection(tile.x - this.player.gx, tile.y - this.player.gy);
            this.openChestWithLoot(tile.x, tile.y);
            this.pendingInteraction = null;
          } else {
            this.pendingInteraction = { type: 'chest', x: tile.x, y: tile.y };
            const path = findPath(
              Math.round(this.player.gx),
              Math.round(this.player.gy),
              tile.x,
              tile.y,
              (x, y) => this.tileMap.isWalkable(x, y)
            );
            if (path.length > 0) this.player.path = path;
          }
          return;
        }

        // Closed Door
        if (currentTile && currentTile.type === TileType.DOOR_CLOSED) {
          const dist = gridDistance(this.player.gx, this.player.gy, tile.x, tile.y);
          if (dist <= 1.55) {
            if (this.tileMap.openDoor(tile.x, tile.y)) {
              this.sound.playBlock();
            }
            this.pendingInteraction = null;
          } else {
            this.pendingInteraction = { type: 'door', x: tile.x, y: tile.y };
            const path = findPath(
              Math.round(this.player.gx),
              Math.round(this.player.gy),
              tile.x,
              tile.y,
              (x, y) => this.tileMap.isWalkable(x, y)
            );
            if (path.length > 0) this.player.path = path;
          }
          return;
        }

        // Stairs Down / Up
        if (currentTile && (currentTile.type === TileType.STAIRS_DOWN || currentTile.type === TileType.STAIRS_UP)) {
          const dist = gridDistance(this.player.gx, this.player.gy, tile.x, tile.y);
          const isDown = currentTile.type === TileType.STAIRS_DOWN;
          if (dist <= 1.55) {
            this.transitionToFloor(isDown ? this.currentFloor + 1 : this.currentFloor - 1);
            this.pendingInteraction = null;
          } else {
            this.pendingInteraction = { type: isDown ? 'stairs_down' : 'stairs_up', x: tile.x, y: tile.y };
            const path = findPath(
              Math.round(this.player.gx),
              Math.round(this.player.gy),
              tile.x,
              tile.y,
              (x, y) => this.tileMap.isWalkable(x, y)
            );
            if (path.length > 0) this.player.path = path;
          }
          return;
        }

        // Clicked ordinary walkable ground -> cancel pending interaction
        this.pendingInteraction = null;
      }

      // 3. Move along path (continuous hold or click)
      if (!this.pendingInteraction && this.tileMap.isWalkable(tile.x, tile.y)) {
        const path = findPath(
          Math.round(this.player.gx),
          Math.round(this.player.gy),
          tile.x,
          tile.y,
          (x, y) => this.tileMap.isWalkable(x, y)
        );
        if (path.length > 0) {
          this.player.path = path;
        }
      }
    }
  }

  private breakBarrelWithLoot(x: number, y: number) {
    if (this.tileMap.breakBarrel(x, y)) {
      this.sound.playHitFlesh();
      // 50% chance of loot drop from barrel
      const roll = Math.random();
      if (roll < 0.3) {
        // Gold drop
        const goldAmt = Math.floor(Math.random() * 20) + 5;
        this.combat.groundItems.push({
          item: createGoldPile(goldAmt),
          x,
          y
        });
      } else if (roll < 0.5) {
        // Potion drop
        this.combat.groundItems.push({
          item: createPotion(Math.random() > 0.4 ? 'health' : 'mana'),
          x,
          y
        });
      }
      return true;
    }
    return false;
  }

  private openChestWithLoot(x: number, y: number) {
    if (this.tileMap.openChest(x, y)) {
      this.sound.playGoldPickup();
      // Chest drops gold + item or potion
      const goldAmt = Math.floor(Math.random() * 50) + 20;
      this.combat.groundItems.push({
        item: createGoldPile(goldAmt),
        x: x + 0.2,
        y: y + 0.2
      });
      if (Math.random() > 0.4) {
        this.combat.groundItems.push({
          item: generateLootItem(this.currentFloor),
          x: x - 0.2,
          y: y - 0.2
        });
      } else {
        this.combat.groundItems.push({
          item: createPotion('health'),
          x: x - 0.2,
          y: y - 0.2
        });
      }
      return true;
    }
    return false;
  }

  private useBelt(slot: number) {
    if (this.player.useBeltPotion(slot)) {
      this.sound.playPotionDrink();
    }
  }

  private transitionToFloor(newFloor: number) {
    this.currentFloor = newFloor;
    this.combat.groundItems = []; // Clear ground items on floor change

    if (newFloor === 0) {
      // Tristram Town Hub
      this.tileMap = this.townData.map;
      this.lighting.resize(this.tileMap.width, this.tileMap.height);
      this.monsters = [];
      this.floorTorches = [{ x: 14, y: 20 }];
      this.player.gx = 24;
      this.player.gy = 10;
      this.player.path = [];
      this.player.targetTile = null;
      this.sound.stopAmbientDrone();
    } else if (newFloor === 1) {
      // Cathedral Upper Halls
      if (!this.floor1Data) {
        this.floor1Data = generateDungeonFloor(1);
      }
      this.tileMap = this.floor1Data.map;
      this.lighting.resize(this.tileMap.width, this.tileMap.height);
      this.floorTorches = this.floor1Data.torches;

      // Spawn monsters
      this.monsters = this.floor1Data.monsterSpawns.map((s, idx) => new Monster(`m_f1_${idx}`, s.type as any, s.x, s.y));

      this.player.gx = this.floor1Data.stairsUp.x;
      this.player.gy = this.floor1Data.stairsUp.y;
      this.player.path = [];
      this.player.targetTile = null;
      this.sound.startAmbientDrone();
    } else if (newFloor === 2) {
      // The Catacombs & Butcher's Lair
      if (!this.floor2Data) {
        this.floor2Data = generateDungeonFloor(2);
      }
      this.tileMap = this.floor2Data.map;
      this.lighting.resize(this.tileMap.width, this.tileMap.height);
      this.floorTorches = this.floor2Data.torches;

      // Spawn monsters & The Butcher
      this.monsters = this.floor2Data.monsterSpawns.map((s, idx) => {
        if (s.type === 'butcher') {
          return new Butcher(s.x, s.y);
        }
        return new Monster(`m_f2_${idx}`, s.type as any, s.x, s.y);
      });

      this.player.gx = this.floor2Data.stairsUp.x;
      this.player.gy = this.floor2Data.stairsUp.y;
      this.player.path = [];
      this.player.targetTile = null;
      this.sound.startAmbientDrone();
    }
  }

  private hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    let x = Math.floor(x1);
    let y = Math.floor(y1);
    let n = 1 + Math.floor(dx + dy);
    const xInc = x2 > x1 ? 1 : -1;
    const yInc = y2 > y1 ? 1 : -1;
    let error = dx - dy;

    for (; n > 0; n--) {
      if (this.tileMap.isOpaque(x, y) && (x !== Math.floor(x1) || y !== Math.floor(y1)) && (x !== Math.floor(x2) || y !== Math.floor(y2))) {
        return false;
      }
      if (error > 0) {
        x += xInc;
        error -= dy;
      } else {
        y += yInc;
        error += dx;
      }
    }
    return true;
  }

  private render() {
    const W = this.canvas.width;
    const H = this.canvas.height;

    // 1. Render Isometric Scene
    this.renderer.render(
      this.ctx,
      W,
      H,
      this.camera.x,
      this.camera.y,
      this.tileMap,
      this.lighting,
      this.player,
      this.monsters,
      this.combat,
      this.currentFloor === 0
    );

    // 2. Boss Banner Announcement
    if (this.bossBanner) {
      this.ctx.fillStyle = 'rgba(10, 0, 0, 0.75)';
      this.ctx.fillRect(0, 50, W, 40);
      this.ctx.strokeStyle = '#c62828';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(0, 50, W, 40);

      this.ctx.fillStyle = '#ff1744';
      this.ctx.font = 'bold 18px serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.bossBanner, W / 2, 76);
    }

    // 3. Render HUD
    const locationName =
      this.currentFloor === 0
        ? 'Tristram - The Town'
        : this.currentFloor === 1
        ? 'Cathedral - Level 1'
        : "Catacombs - Level 2 (The Butcher's Lair)";

    this.hud.render(
      this.ctx,
      W,
      H,
      this.player,
      locationName,
      this.sound.enabled
    );

    // 4. Render Panels
    const panelY = 40;
    this.characterUI.render(this.ctx, 40, panelY, this.player);
    this.inventoryUI.render(this.ctx, W - 340, panelY, this.player);
  }

  private updateCursor() {
    const panelY = 40;
    const invX = this.canvas.width - 340;

    // 1. Hovering Character panel
    if (this.characterUI.visible && this.input.mouse.x >= 40 && this.input.mouse.x <= 320 && this.input.mouse.y >= panelY && this.input.mouse.y <= panelY + 380) {
      this.cursorManager.setCursor(this.canvas, 'default');
      return;
    }

    // 2. Hovering Inventory panel
    if (this.inventoryUI.visible && this.input.mouse.x >= invX && this.input.mouse.x <= invX + 320 && this.input.mouse.y >= panelY && this.input.mouse.y <= panelY + 400) {
      this.cursorManager.setCursor(this.canvas, 'default');
      return;
    }

    // 3. Hovering bottom HUD
    if (this.input.mouse.y >= this.canvas.height - 90) {
      const hudAction = this.hud.handleClick(this.input.mouse.x, this.input.mouse.y, this.canvas.width, this.canvas.height);
      if (hudAction && hudAction.action !== 'hud') {
        this.cursorManager.setCursor(this.canvas, 'pointer');
      } else {
        this.cursorManager.setCursor(this.canvas, 'default');
      }
      return;
    }

    // 4. World hover
    const tile = screenToTile(this.input.mouse.x, this.input.mouse.y, this.camera.x, this.camera.y);

    // Over an alive enemy -> Sword cursor!
    const isOverMonster = this.monsters.some(m => {
      if (m.isDead) return false;
      const { sx, sy } = gridToScreen(m.gx, m.gy, this.camera.x, this.camera.y);
      const isBoss = m instanceof Butcher;
      const h = isBoss ? 56 : 48;
      const w = isBoss ? 36 : 28;
      const inScreenBox =
        this.input.mouse.x >= sx - w / 2 &&
        this.input.mouse.x <= sx + w / 2 &&
        this.input.mouse.y >= sy - h &&
        this.input.mouse.y <= sy + 8;

      const inTileDist = gridDistance(m.gx, m.gy, tile.x, tile.y) < 1.1;
      return inScreenBox || inTileDist;
    });

    if (isOverMonster) {
      this.cursorManager.setCursor(this.canvas, 'sword');
      return;
    }

    // Over a chest or barrel (or door, stairs, ground item) -> Hand cursor!
    const currentTile = this.tileMap.get(tile.x, tile.y);
    const isInteractableProp =
      currentTile &&
      (currentTile.prop === PropType.BARREL ||
       currentTile.prop === PropType.CHEST_CLOSED ||
       currentTile.prop === PropType.CHEST_OPEN);

    const isInteractableDoorOrStairs =
      currentTile &&
      (currentTile.type === TileType.DOOR_CLOSED ||
       currentTile.type === TileType.DOOR_OPEN ||
       currentTile.type === TileType.STAIRS_DOWN ||
       currentTile.type === TileType.STAIRS_UP);

    const isOverGroundItem = this.combat.groundItems.some(gi => {
      const { sx, sy } = gridToScreen(gi.x, gi.y, this.camera.x, this.camera.y);
      const inScreenBox =
        this.input.mouse.x >= sx - 16 &&
        this.input.mouse.x <= sx + 16 &&
        this.input.mouse.y >= sy - 16 &&
        this.input.mouse.y <= sy + 16;
      return inScreenBox || gridDistance(gi.x, gi.y, tile.x, tile.y) < 1.0;
    });

    if (isInteractableProp || isInteractableDoorOrStairs || isOverGroundItem) {
      this.cursorManager.setCursor(this.canvas, 'hand');
      return;
    }

    // Default world navigation -> Armored Gauntlet cursor!
    this.cursorManager.setCursor(this.canvas, 'default');
  }
}
