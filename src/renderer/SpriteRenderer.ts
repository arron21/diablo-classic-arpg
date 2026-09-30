/**
 * Depth-Sorted 2.5D Isometric Sprite & Tile Renderer.
 * Sorts all world elements by (gx + gy) to guarantee authentic Diablo isometric occlusion.
 */

import { gridToScreen, TILE_WIDTH, TILE_HEIGHT } from './Isometric.js';
import { SpriteAtlas, getSpriteAtlas } from './PixelArt.js';
import { TileMap, TileType, PropType } from '../world/TileMap.js';
import { LightingSystem } from './Lighting.js';
import { Player } from '../entities/Player.js';
import { Monster } from '../entities/Monster.js';
import { Butcher } from '../entities/Butcher.js';
import { CombatSystem } from '../combat/CombatSystem.js';

interface RenderItem {
  depth: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

export class SpriteRenderer {
  private atlas: SpriteAtlas;

  constructor() {
    this.atlas = getSpriteAtlas();
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cameraX: number,
    cameraY: number,
    tileMap: TileMap,
    lighting: LightingSystem,
    player: Player,
    monsters: (Monster | Butcher)[],
    combat: CombatSystem,
    isTown: boolean = false
  ) {
    // Fill pitch-black canvas background
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, width, height);

    const renderQueue: RenderItem[] = [];

    // Visible tile bounds in screen space
    // Render floor tiles first
    for (let gy = 0; gy < tileMap.height; gy++) {
      for (let gx = 0; gx < tileMap.width; gx++) {
        const tile = tileMap.get(gx, gy);
        if (!tile || tile.type === TileType.EMPTY) continue;

        const vis = lighting.getTileVisibility(gx, gy);
        if (!vis.isExplored && !isTown) continue;

        const { sx, sy } = gridToScreen(gx, gy, cameraX, cameraY);
        // Frustum cull tiles outside screen
        if (sx < -TILE_WIDTH || sx > width + TILE_WIDTH || sy < -TILE_HEIGHT || sy > height + TILE_HEIGHT) {
          continue;
        }

        // Determine floor sprite
        let floorImg = this.atlas.floors[tile.floorVariant] || this.atlas.floors.cathedral;
        if (tile.type === TileType.STAIRS_DOWN) floorImg = this.atlas.floors.stairs_down;
        if (tile.type === TileType.STAIRS_UP) floorImg = this.atlas.floors.stairs_up;

        // Draw floor tile
        ctx.save();
        if (!isTown && !vis.isVisible) {
          ctx.filter = 'brightness(30%)';
        } else if (!isTown) {
          const b = Math.min(1.0, Math.max(0.3, vis.intensity));
          ctx.filter = `brightness(${Math.round(b * 100)}%)`;
        }
        ctx.drawImage(floorImg, sx - 32, sy);
        ctx.restore();

        // Blood decals on this tile
        for (const decal of combat.bloodDecals) {
          if (Math.floor(decal.x) === gx && Math.floor(decal.y) === gy) {
            const decalScreen = gridToScreen(decal.x, decal.y, cameraX, cameraY);
            ctx.fillStyle = decal.color;
            ctx.beginPath();
            ctx.ellipse(decalScreen.sx, decalScreen.sy + 12, decal.size, decal.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Walls and Doors into depth queue
        if (tile.type === TileType.WALL || tile.type === TileType.DOOR_CLOSED || tile.type === TileType.DOOR_OPEN) {
          let wallImg = this.atlas.walls[tile.wallVariant] || this.atlas.walls.cathedral;
          if (tile.type === TileType.DOOR_CLOSED) wallImg = this.atlas.walls.door_closed;
          if (tile.type === TileType.DOOR_OPEN) wallImg = this.atlas.walls.door_open;

          renderQueue.push({
            depth: (gx + gy) * 1000 + 400,
            draw: (c) => {
              c.save();
              if (!isTown && !vis.isVisible) {
                c.filter = 'brightness(25%)';
              } else if (!isTown) {
                const b = Math.min(1.0, Math.max(0.3, vis.intensity));
                c.filter = `brightness(${Math.round(b * 100)}%)`;
              }
              // Wall base sits at tile center; wall height is 80px
              c.drawImage(wallImg, sx - 32, sy - 48);
              c.restore();
            }
          });
        }

        // Props into depth queue
        if (tile.prop !== PropType.NONE) {
          let propImg: HTMLCanvasElement | null = null;
          if (tile.prop === PropType.BARREL) propImg = this.atlas.props.barrel;
          else if (tile.prop === PropType.CHEST_CLOSED) propImg = this.atlas.props.chest_closed;
          else if (tile.prop === PropType.CHEST_OPEN) propImg = this.atlas.props.chest_open;
          else if (tile.prop === PropType.TORCH) propImg = this.atlas.props.torch;
          else if (tile.prop === PropType.PILLAR) propImg = this.atlas.props.pillar;

          if (propImg) {
            const pImg = propImg;
            renderQueue.push({
              depth: (gx + gy) * 1000 + 500,
              draw: (c) => {
                c.save();
                if (!isTown && !vis.isVisible) {
                  c.filter = 'brightness(30%)';
                }
                c.drawImage(pImg, sx - 24, sy - 24);
                c.restore();
              }
            });
          }
        }
      }
    }

    // Ground Items into depth queue
    for (const gi of combat.groundItems) {
      const vis = lighting.getTileVisibility(Math.floor(gi.x), Math.floor(gi.y));
      if (!vis.isVisible && !isTown) continue;

      const { sx, sy } = gridToScreen(gi.x, gi.y, cameraX, cameraY);
      const icon = this.atlas.items[gi.item.baseType] || this.atlas.items.sword;

      renderQueue.push({
        depth: (gi.x + gi.y) * 1000 + 200,
        draw: (c) => {
          // Floating item glow
          c.fillStyle = gi.item.rarity === 'unique' ? 'rgba(212, 175, 55, 0.4)' : gi.item.rarity === 'rare' ? 'rgba(255, 230, 0, 0.3)' : 'rgba(100, 180, 255, 0.3)';
          c.beginPath();
          c.ellipse(sx, sy + 10, 12, 6, 0, 0, Math.PI * 2);
          c.fill();
          // Item sprite
          c.drawImage(icon, sx - 16, sy - 14);
        }
      });
    }

    // Player into depth queue
    const pScreen = gridToScreen(player.gx, player.gy, cameraX, cameraY);
    renderQueue.push({
      depth: (player.gx + player.gy) * 1000 + 600,
      draw: (c) => {
        const frames = this.atlas.warrior[player.state] || this.atlas.warrior.idle;
        const frame = frames[player.frame % frames.length];
        c.drawImage(frame, pScreen.sx - 24, pScreen.sy - 38);
      }
    });

    // Monsters into depth queue
    for (const m of monsters) {
      const vis = lighting.getTileVisibility(Math.floor(m.gx), Math.floor(m.gy));
      if (!vis.isVisible && !isTown && !m.isDead) continue;

      const mScreen = gridToScreen(m.gx, m.gy, cameraX, cameraY);
      const isBoss = m instanceof Butcher;
      const typeKey = isBoss ? 'butcher' : (m as Monster).monsterType;
      const frames = this.atlas[typeKey][m.state] || this.atlas[typeKey].idle;
      const frame = frames[m.frame % frames.length];

      renderQueue.push({
        depth: (m.gx + m.gy) * 1000 + (m.isDead ? 100 : 550),
        draw: (c) => {
          c.save();
          if (!isTown && !vis.isVisible) {
            c.filter = 'brightness(30%)';
          }
          c.drawImage(frame, mScreen.sx - 24, mScreen.sy - (isBoss ? 46 : 38));

          // Boss health bar above head
          if (isBoss && !m.isDead && (m as Butcher).hasRoared) {
            const barW = 60;
            const barH = 5;
            const hpRatio = m.hp / m.maxHp;
            c.fillStyle = '#101014';
            c.fillRect(mScreen.sx - barW / 2, mScreen.sy - 58, barW, barH);
            c.fillStyle = '#d32f2f';
            c.fillRect(mScreen.sx - barW / 2, mScreen.sy - 58, barW * hpRatio, barH);
            c.strokeStyle = '#d4af37';
            c.lineWidth = 1;
            c.strokeRect(mScreen.sx - barW / 2, mScreen.sy - 58, barW, barH);
          }
          c.restore();
        }
      });
    }

    // Sort all isometric objects and draw them back-to-front
    renderQueue.sort((a, b) => a.depth - b.depth);
    for (const item of renderQueue) {
      item.draw(ctx);
    }

    // Render floating combat texts (always on top of entities)
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    for (const ft of combat.floatingTexts) {
      const pos = gridToScreen(ft.x, ft.y, cameraX, cameraY);
      const alpha = Math.max(0, ft.lifetime / ft.maxLifetime);
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
      ctx.fillText(ft.text, pos.sx + 1, pos.sy - 39);
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = alpha;
      ctx.fillText(ft.text, pos.sx, pos.sy - 40);
      ctx.globalAlpha = 1.0;
    }
  }
}
