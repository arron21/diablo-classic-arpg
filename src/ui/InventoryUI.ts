/**
 * Diablo Tetris-style Inventory UI with Paperdoll Equipment and Item Tooltips.
 */

import { Player } from '../entities/Player.js';
import { Item, ItemRarity } from '../items/Item.js';
import { Inventory, EquipmentSlot } from '../items/Inventory.js';
import { SpriteAtlas, getSpriteAtlas } from '../renderer/PixelArt.js';

export class InventoryUI {
  public visible: boolean = false;
  private atlas: SpriteAtlas;
  private hoveredItem: Item | null = null;
  private tooltipPos: { x: number; y: number } = { x: 0, y: 0 };

  constructor() {
    this.atlas = getSpriteAtlas();
  }

  public toggle() {
    this.visible = !this.visible;
  }

  public handleClick(mouseX: number, mouseY: number, panelX: number, panelY: number, player: Player): boolean {
    if (!this.visible) return false;

    // Check if clicked inside panel (width: 320, height: 420)
    if (mouseX < panelX || mouseX > panelX + 320 || mouseY < panelY || mouseY > panelY + 420) {
      return false;
    }

    // Close button
    if (mouseX >= panelX + 295 && mouseX <= panelX + 315 && mouseY >= panelY + 5 && mouseY <= panelY + 25) {
      this.visible = false;
      return true;
    }

    // Check Equipment slots click
    const equipSlots: { slot: EquipmentSlot; x: number; y: number; w: number; h: number }[] = [
      { slot: 'head', x: panelX + 136, y: panelY + 45, w: 48, h: 48 },
      { slot: 'body', x: panelX + 136, y: panelY + 105, w: 48, h: 72 },
      { slot: 'mainHand', x: panelX + 50, y: panelY + 80, w: 48, h: 72 },
      { slot: 'offHand', x: panelX + 222, y: panelY + 80, w: 48, h: 72 },
      { slot: 'leftRing', x: panelX + 90, y: panelY + 185, w: 32, h: 32 },
      { slot: 'rightRing', x: panelX + 198, y: panelY + 185, w: 32, h: 32 }
    ];

    for (const eq of equipSlots) {
      if (mouseX >= eq.x && mouseX <= eq.x + eq.w && mouseY >= eq.y && mouseY <= eq.y + eq.h) {
        const item = player.inventory.unequipItem(eq.slot);
        if (item) {
          player.inventory.addItemAuto(item);
          player.recalculateStats();
        }
        return true;
      }
    }

    // Check Grid items click (Grid starts at panelX + 16, panelY + 260)
    const gridX = panelX + 16;
    const gridY = panelY + 260;
    const cellSize = 28;

    if (mouseX >= gridX && mouseX < gridX + 10 * cellSize && mouseY >= gridY && mouseY < gridY + 4 * cellSize) {
      const col = Math.floor((mouseX - gridX) / cellSize);
      const row = Math.floor((mouseY - gridY) / cellSize);
      const item = player.inventory.grid[row][col];

      if (item) {
        if (item.itemType === 'potion') {
          // Consume potion
          if (item.healAmount) player.heal(item.healAmount);
          if (item.manaAmount) player.mana = Math.min(player.maxMana, player.mana + item.manaAmount);
          player.inventory.removeItem(item);
        } else if (item.itemType === 'weapon' || item.itemType === 'shield' || item.itemType === 'armor' || item.itemType === 'helm' || item.itemType === 'ring') {
          // Equip item
          player.inventory.removeItem(item);
          const { success, oldItem } = player.inventory.equipItem(item);
          if (success && oldItem) {
            player.inventory.addItemAuto(oldItem);
          }
          player.recalculateStats();
        }
        return true;
      }
    }

    return true; // Click consumed by panel
  }

  public handleMouseMove(mouseX: number, mouseY: number, panelX: number, panelY: number, player: Player) {
    if (!this.visible) {
      this.hoveredItem = null;
      return;
    }

    this.hoveredItem = null;
    const gridX = panelX + 16;
    const gridY = panelY + 260;
    const cellSize = 28;

    // Check grid hover
    if (mouseX >= gridX && mouseX < gridX + 10 * cellSize && mouseY >= gridY && mouseY < gridY + 4 * cellSize) {
      const col = Math.floor((mouseX - gridX) / cellSize);
      const row = Math.floor((mouseY - gridY) / cellSize);
      const item = player.inventory.grid[row][col];
      if (item) {
        this.hoveredItem = item;
        this.tooltipPos = { x: mouseX + 12, y: mouseY + 12 };
        return;
      }
    }

    // Check equip hover
    const equipSlots: { slot: EquipmentSlot; x: number; y: number; w: number; h: number }[] = [
      { slot: 'head', x: panelX + 136, y: panelY + 45, w: 48, h: 48 },
      { slot: 'body', x: panelX + 136, y: panelY + 105, w: 48, h: 72 },
      { slot: 'mainHand', x: panelX + 50, y: panelY + 80, w: 48, h: 72 },
      { slot: 'offHand', x: panelX + 222, y: panelY + 80, w: 48, h: 72 },
      { slot: 'leftRing', x: panelX + 90, y: panelY + 185, w: 32, h: 32 },
      { slot: 'rightRing', x: panelX + 198, y: panelY + 185, w: 32, h: 32 }
    ];

    for (const eq of equipSlots) {
      if (mouseX >= eq.x && mouseX <= eq.x + eq.w && mouseY >= eq.y && mouseY <= eq.y + eq.h) {
        const item = player.inventory.equipment[eq.slot];
        if (item) {
          this.hoveredItem = item;
          this.tooltipPos = { x: mouseX + 12, y: mouseY + 12 };
          return;
        }
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, panelX: number, panelY: number, player: Player) {
    if (!this.visible) return;

    const panelW = 320;
    const panelH = 400;

    // Panel Background
    ctx.fillStyle = '#101016';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#4a443a';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Title bar
    ctx.fillStyle = '#1a1822';
    ctx.fillRect(panelX, panelY, panelW, 28);
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 13px serif';
    ctx.textAlign = 'center';
    ctx.fillText('INVENTORY & EQUIPMENT', panelX + panelW / 2, panelY + 19);

    // Close button
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(panelX + panelW - 22, panelY + 5, 17, 17);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('X', panelX + panelW - 14, panelY + 17);

    // Render Paperdoll slots
    this.renderSlot(ctx, panelX + 136, panelY + 45, 48, 48, 'Head', player.inventory.equipment.head);
    this.renderSlot(ctx, panelX + 136, panelY + 105, 48, 72, 'Armor', player.inventory.equipment.body);
    this.renderSlot(ctx, panelX + 50, panelY + 80, 48, 72, 'Weapon', player.inventory.equipment.mainHand);
    this.renderSlot(ctx, panelX + 222, panelY + 80, 48, 72, 'Shield', player.inventory.equipment.offHand);
    this.renderSlot(ctx, panelX + 90, panelY + 185, 32, 32, 'Ring', player.inventory.equipment.leftRing);
    this.renderSlot(ctx, panelX + 198, panelY + 185, 32, 32, 'Ring', player.inventory.equipment.rightRing);

    // Render 10x4 Inventory Grid
    const gridX = panelX + 20;
    const gridY = panelY + 250;
    const cellSize = 28;

    for (let r = 0; r < Inventory.ROWS; r++) {
      for (let c = 0; c < Inventory.COLS; c++) {
        const cx = gridX + c * cellSize;
        const cy = gridY + r * cellSize;
        ctx.fillStyle = '#181820';
        ctx.fillRect(cx, cy, cellSize - 1, cellSize - 1);
        ctx.strokeStyle = '#2d2d38';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx, cy, cellSize - 1, cellSize - 1);
      }
    }

    // Render items placed in grid
    for (const p of player.inventory.placedItems) {
      const ix = gridX + p.x * cellSize;
      const iy = gridY + p.y * cellSize;
      const iw = p.item.gridW * cellSize - 1;
      const ih = p.item.gridH * cellSize - 1;

      // Item slot background colored by rarity
      ctx.fillStyle = p.item.rarity === 'unique' ? 'rgba(180, 140, 20, 0.25)' : p.item.rarity === 'rare' ? 'rgba(180, 180, 0, 0.2)' : p.item.rarity === 'magic' ? 'rgba(30, 80, 180, 0.25)' : 'rgba(40, 40, 50, 0.4)';
      ctx.fillRect(ix, iy, iw, ih);
      ctx.strokeStyle = this.getRarityColor(p.item.rarity);
      ctx.lineWidth = 1;
      ctx.strokeRect(ix, iy, iw, ih);

      // Icon centered
      const icon = this.atlas.items[p.item.baseType] || this.atlas.items.sword;
      ctx.drawImage(icon, ix + (iw - 32) / 2, iy + (ih - 32) / 2);
    }

    // Render Tooltip
    if (this.hoveredItem) {
      this.renderTooltip(ctx, this.tooltipPos.x, this.tooltipPos.y, this.hoveredItem);
    }
  }

  private renderSlot(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, item: Item | null) {
    ctx.fillStyle = '#16161f';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = item ? this.getRarityColor(item.rarity) : '#3a3a48';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);

    if (item) {
      const icon = this.atlas.items[item.baseType] || this.atlas.items.sword;
      ctx.drawImage(icon, x + (w - 32) / 2, y + (h - 32) / 2);
    } else {
      ctx.fillStyle = '#444455';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + w / 2, y + h / 2 + 3);
    }
  }

  private renderTooltip(ctx: CanvasRenderingContext2D, x: number, y: number, item: Item) {
    const lines: { text: string; color: string }[] = [];

    // Title
    lines.push({ text: item.name, color: this.getRarityColor(item.rarity) });

    if (item.minDamage !== undefined && item.maxDamage !== undefined) {
      lines.push({ text: `Damage: ${item.minDamage}-${item.maxDamage}`, color: '#ffffff' });
    }
    if (item.armorClass !== undefined) {
      lines.push({ text: `Armor: ${item.armorClass}`, color: '#ffffff' });
    }
    if (item.strReq) {
      lines.push({ text: `Required Strength: ${item.strReq}`, color: '#b0b0b0' });
    }
    if (item.bonusStr) lines.push({ text: `+${item.bonusStr} to Strength`, color: '#64b5f6' });
    if (item.bonusDex) lines.push({ text: `+${item.bonusDex} to Dexterity`, color: '#64b5f6' });
    if (item.bonusVit) lines.push({ text: `+${item.bonusVit} to Vitality`, color: '#64b5f6' });
    if (item.bonusLife) lines.push({ text: `+${item.bonusLife} to Life`, color: '#e57373' });
    if (item.bonusMana) lines.push({ text: `+${item.bonusMana} to Mana`, color: '#64b5f6' });
    if (item.toHitBonus) lines.push({ text: `+${item.toHitBonus}% to Hit`, color: '#81c784' });
    if (item.healAmount) lines.push({ text: `Restores ${item.healAmount} Life`, color: '#ff5252' });
    if (item.manaAmount) lines.push({ text: `Restores ${item.manaAmount} Mana`, color: '#448aff' });
    if (item.description) lines.push({ text: item.description, color: '#e0c068' });
    lines.push({ text: `Value: ${item.goldValue} Gold`, color: '#ffd700' });

    const boxW = 200;
    const boxH = lines.length * 16 + 14;

    ctx.fillStyle = '#08080c';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = '#5a5040';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.textAlign = 'left';
    ctx.font = '11px sans-serif';
    lines.forEach((l, idx) => {
      ctx.fillStyle = l.color;
      ctx.fillText(l.text, x + 8, y + 16 + idx * 16);
    });
  }

  private getRarityColor(rarity: ItemRarity): string {
    switch (rarity) {
      case 'magic': return '#448aff';
      case 'rare': return '#ffff00';
      case 'unique': return '#d4af37';
      default: return '#e0e0e0';
    }
  }
}
