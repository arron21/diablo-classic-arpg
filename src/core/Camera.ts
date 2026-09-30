/**
 * Isometric Camera Controller with smooth following and screen-shake effects.
 */

import { gridToScreen } from '../renderer/Isometric.js';

export class Camera {
  public x: number = 0;
  public y: number = 0;
  public targetX: number = 0;
  public targetY: number = 0;
  private shakeTimer: number = 0;
  private shakeMagnitude: number = 0;

  public update(dt: number, targetGx: number, targetGy: number, viewportWidth: number, viewportHeight: number) {
    // Determine screen position where player is centered
    // Screen center = viewportWidth / 2, viewportHeight / 2
    const targetScreen = gridToScreen(targetGx, targetGy, 0, 0);
    this.targetX = viewportWidth / 2 - targetScreen.sx;
    this.targetY = viewportHeight / 2 - targetScreen.sy;

    // Smooth lerp
    const lerpRate = 8.0 * dt;
    this.x += (this.targetX - this.x) * Math.min(1.0, lerpRate);
    this.y += (this.targetY - this.y) * Math.min(1.0, lerpRate);

    // Screen shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const ox = (Math.random() - 0.5) * this.shakeMagnitude * 2;
      const oy = (Math.random() - 0.5) * this.shakeMagnitude * 2;
      this.x += ox;
      this.y += oy;
    }
  }

  public triggerShake(duration: number = 0.4, magnitude: number = 6) {
    this.shakeTimer = duration;
    this.shakeMagnitude = magnitude;
  }
}
