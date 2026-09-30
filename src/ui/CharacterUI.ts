/**
 * Diablo 1 Character Attributes Sheet.
 * Displays player stats, level, XP, and stat point allocation buttons.
 */

import { Player } from '../entities/Player.js';

export class CharacterUI {
  public visible: boolean = false;

  public toggle() {
    this.visible = !this.visible;
  }

  public handleClick(mouseX: number, mouseY: number, panelX: number, panelY: number, player: Player): boolean {
    if (!this.visible) return false;

    const panelW = 280;
    const panelH = 380;

    if (mouseX < panelX || mouseX > panelX + panelW || mouseY < panelY || mouseY > panelY + panelH) {
      return false;
    }

    // Close button
    if (mouseX >= panelX + panelW - 24 && mouseX <= panelX + panelW - 6 && mouseY >= panelY + 6 && mouseY <= panelY + 24) {
      this.visible = false;
      return true;
    }

    // If player has stat points, check '+' button clicks
    if (player.statPoints > 0) {
      const btnX = panelX + 220;
      const stats = ['str', 'mag', 'dex', 'vit'] as const;
      const startY = panelY + 120;

      for (let i = 0; i < 4; i++) {
        const btnY = startY + i * 28 - 12;
        if (mouseX >= btnX && mouseX <= btnX + 18 && mouseY >= btnY && mouseY <= btnY + 18) {
          player.allocateStat(stats[i]);
          return true;
        }
      }
    }

    return true; // Click consumed by panel
  }

  public render(ctx: CanvasRenderingContext2D, panelX: number, panelY: number, player: Player) {
    if (!this.visible) return;

    const panelW = 280;
    const panelH = 380;
    const effective = player.getEffectiveStats();

    // Background Panel
    ctx.fillStyle = '#101016';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#4a443a';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Title
    ctx.fillStyle = '#1a1822';
    ctx.fillRect(panelX, panelY, panelW, 28);
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 13px serif';
    ctx.textAlign = 'center';
    ctx.fillText('CHARACTER ATTRIBUTES', panelX + panelW / 2, panelY + 19);

    // Close button
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(panelX + panelW - 22, panelY + 5, 17, 17);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('X', panelX + panelW - 14, panelY + 17);

    ctx.textAlign = 'left';

    // Header info: Name, Class, Level
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Warrior (Level ${player.level})`, panelX + 20, panelY + 54);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#a0a0a0';
    ctx.fillText(`Experience: ${player.experience}`, panelX + 20, panelY + 74);
    ctx.fillText(`Next Level: ${player.nextLevelXp}`, panelX + 20, panelY + 92);

    // Divider
    ctx.strokeStyle = '#333340';
    ctx.beginPath();
    ctx.moveTo(panelX + 20, panelY + 104);
    ctx.lineTo(panelX + panelW - 20, panelY + 104);
    ctx.stroke();

    // Stat rows
    const startY = panelY + 128;
    const statRows = [
      { name: 'Strength', base: player.strength, total: effective.str, stat: 'str' },
      { name: 'Magic', base: player.magic, total: effective.mag, stat: 'mag' },
      { name: 'Dexterity', base: player.dexterity, total: effective.dex, stat: 'dex' },
      { name: 'Vitality', base: player.vitality, total: effective.vit, stat: 'vit' }
    ];

    statRows.forEach((s, idx) => {
      const y = startY + idx * 28;
      ctx.fillStyle = '#d8d8d8';
      ctx.fillText(s.name, panelX + 20, y);

      const bonus = s.total - s.base;
      const valText = bonus > 0 ? `${s.base} (+${bonus})` : `${s.base}`;
      ctx.fillStyle = bonus > 0 ? '#448aff' : '#ffffff';
      ctx.fillText(valText, panelX + 130, y);

      // Stat point allocation '+' button
      if (player.statPoints > 0) {
        ctx.fillStyle = '#c62828';
        ctx.fillRect(panelX + 220, y - 11, 16, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('+', panelX + 228, y + 2);
        ctx.textAlign = 'left';
        ctx.font = '11px sans-serif';
      }
    });

    if (player.statPoints > 0) {
      ctx.fillStyle = '#ff5252';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`Points to Allocate: ${player.statPoints}`, panelX + 20, startY + 116);
    }

    // Divider
    ctx.strokeStyle = '#333340';
    ctx.beginPath();
    ctx.moveTo(panelX + 20, panelY + 260);
    ctx.lineTo(panelX + panelW - 20, panelY + 260);
    ctx.stroke();

    // Combat Stats summary
    const combatY = panelY + 282;
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';

    ctx.fillText(`Life: ${player.hp} / ${player.maxHp}`, panelX + 20, combatY);
    ctx.fillText(`Mana: ${player.mana} / ${player.maxMana}`, panelX + 150, combatY);

    ctx.fillText(`Damage: ${effective.minDmg} - ${effective.maxDmg}`, panelX + 20, combatY + 22);
    ctx.fillText(`Armor Class: ${effective.ac}`, panelX + 150, combatY + 22);

    ctx.fillText(`To-Hit: ${effective.toHit}%`, panelX + 20, combatY + 44);
    ctx.fillText(`Block Chance: ${effective.blockChance}%`, panelX + 150, combatY + 44);
  }
}
