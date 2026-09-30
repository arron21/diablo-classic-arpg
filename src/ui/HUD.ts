/**
 * Diablo 1 Iconic Bottom Interface & HUD.
 * Renders the Red Health Globe, Blue Mana Globe, Potion Belt, XP bar,
 * and interactive buttons without text collisions.
 */

import { Player } from '../entities/Player.js';
import { SpriteAtlas, getSpriteAtlas } from '../renderer/PixelArt.js';

export type HUDAction =
  | { action: 'char' }
  | { action: 'inv' }
  | { action: 'audio' }
  | { action: 'belt'; slot: number }
  | { action: 'hud' }
  | null;

export class HUD {
  private atlas: SpriteAtlas;

  constructor() {
    this.atlas = getSpriteAtlas();
  }

  public handleClick(mouseX: number, mouseY: number, width: number, height: number): HUDAction {
    const hudHeight = 90;
    const hudY = height - hudHeight;

    if (mouseY < hudY) return null;

    const beltW = 160;
    const beltX = Math.floor((width - beltW) / 2);
    const beltY = hudY + 28;

    // Check Belt slot clicks
    for (let i = 0; i < 4; i++) {
      const slotX = beltX + i * 40;
      if (mouseX >= slotX && mouseX <= slotX + 34 && mouseY >= beltY && mouseY <= beltY + 34) {
        return { action: 'belt', slot: i };
      }
    }

    // Check Char (C) button
    const charBtnX = beltX - 70;
    const btnY = hudY + 32;
    if (mouseX >= charBtnX && mouseX <= charBtnX + 60 && mouseY >= btnY && mouseY <= btnY + 26) {
      return { action: 'char' };
    }

    // Check Inv (I) button
    const invBtnX = beltX + beltW + 10;
    if (mouseX >= invBtnX && mouseX <= invBtnX + 60 && mouseY >= btnY && mouseY <= btnY + 26) {
      return { action: 'inv' };
    }

    // Check Audio (M) button
    const audioBtnX = beltX + beltW + 78;
    if (mouseX >= audioBtnX && mouseX <= audioBtnX + 68 && mouseY >= btnY && mouseY <= btnY + 26) {
      return { action: 'audio' };
    }

    // Click anywhere else on HUD bar
    return { action: 'hud' };
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    player: Player,
    locationName: string,
    audioEnabled: boolean
  ) {
    const hudHeight = 90;
    const hudY = height - hudHeight;

    // HUD Stone Panel Background across full screen width
    ctx.fillStyle = '#121217';
    ctx.fillRect(0, hudY, width, hudHeight);

    // Stone border highlight line
    ctx.fillStyle = '#3a3a46';
    ctx.fillRect(0, hudY, width, 2);
    ctx.fillStyle = '#22222a';
    ctx.fillRect(0, hudY + 2, width, 3);

    // 1. Health Globe (Red) on bottom-left
    this.renderGlobe(ctx, 48, hudY + 45, 36, player.hp, player.maxHp, '#c41424', '#ff4d5a', 'Life');

    // Gold display beside Health globe (no collision!)
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Gold: ${player.inventory.gold}`, 96, hudY + 48);

    // 2. Mana Globe (Blue) on bottom-right
    this.renderGlobe(ctx, width - 48, hudY + 45, 36, player.mana, player.maxMana, '#1852c7', '#4d88ff', 'Mana');

    // Stat Points available notification beside Mana globe
    if (player.statPoints > 0) {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`+${player.statPoints} Stat Points! (C)`, width - 96, hudY + 48);
    }

    // 3. Center Area: Belt & Hotkeys
    const beltW = 160;
    const beltX = Math.floor((width - beltW) / 2);
    const beltY = hudY + 28;

    // Belt slot frames (1-4)
    for (let i = 0; i < 4; i++) {
      const slotX = beltX + i * 40;
      ctx.fillStyle = '#1c1c24';
      ctx.fillRect(slotX, beltY, 34, 34);
      ctx.strokeStyle = '#444455';
      ctx.lineWidth = 1;
      ctx.strokeRect(slotX, beltY, 34, 34);

      // Belt slot number label
      ctx.fillStyle = '#8e8e9f';
      ctx.font = '10px monospace';
      ctx.fillText(`${i + 1}`, slotX + 4, beltY + 11);

      // Potion inside belt
      const potion = player.inventory.belt[i];
      if (potion) {
        const icon = this.atlas.items[potion.baseType];
        if (icon) {
          ctx.drawImage(icon, slotX + 1, beltY + 1);
        }
      }
    }

    // 4. Interface Buttons: Char (C), Inv (I), Audio (M)
    const btnY = hudY + 32;
    const btnH = 26;

    this.renderButton(ctx, beltX - 70, btnY, 60, btnH, 'Char (C)');
    this.renderButton(ctx, beltX + beltW + 10, btnY, 60, btnH, 'Inv (I)');
    this.renderButton(ctx, beltX + beltW + 78, btnY, 68, btnH, audioEnabled ? 'Audio [ON]' : 'Audio [OFF]');

    // 5. XP Progress Bar
    const xpBarW = beltW + 140;
    const xpBarX = Math.floor((width - xpBarW) / 2);
    const xpBarY = hudY + 70;
    const xpRatio = Math.min(1.0, player.experience / player.nextLevelXp);

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(xpBarX, xpBarY, xpBarW, 8);
    ctx.fillStyle = '#b8860b';
    ctx.fillRect(xpBarX, xpBarY, xpBarW * xpRatio, 8);
    ctx.strokeStyle = '#554422';
    ctx.strokeRect(xpBarX, xpBarY, xpBarW, 8);

    // XP Text
    ctx.fillStyle = '#d4af37';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Level ${player.level} (${Math.round(xpRatio * 100)}% XP)`, width / 2, xpBarY + 16);

    // Location / Status Banner in center top
    ctx.font = 'bold 13px serif';
    ctx.fillStyle = '#e0d8c8';
    ctx.textAlign = 'center';
    ctx.fillText(locationName, width / 2, hudY + 18);
  }

  private renderGlobe(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    current: number,
    max: number,
    fillColor: string,
    highColor: string,
    label: string
  ) {
    ctx.save();

    // Dark globe container
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#050508';
    ctx.fill();
    ctx.clip();

    // Liquid fill level
    const ratio = Math.max(0, Math.min(1, current / max));
    const liquidTop = cy + radius - (radius * 2 * ratio);

    ctx.fillStyle = fillColor;
    ctx.fillRect(cx - radius, liquidTop, radius * 2, radius * 2);

    // Liquid surface highlight
    ctx.fillStyle = highColor;
    ctx.fillRect(cx - radius, liquidTop, radius * 2, 3);

    // Glass specular reflection arc
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 4, -Math.PI / 1.5, -Math.PI / 3);
    ctx.stroke();

    ctx.restore();

    // Metallic globe rim
    ctx.strokeStyle = '#5a554a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
    ctx.stroke();

    // Text label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${label}: ${current}/${max}`, cx, cy + 4);
  }

  private renderButton(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, text: string) {
    ctx.fillStyle = '#22222c';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#555566';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#d8d8d8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w / 2, y + h / 2 + 4);
  }
}
