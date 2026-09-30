/**
 * Dynamic Raycast Lighting & Fog of War System.
 * Faithfully reproduces Diablo 1's oppressive gothic darkness, torchlight flicker,
 * and line-of-sight shadowing.
 */

export interface LightSource {
  x: number;
  y: number;
  radius: number;
  intensity: number;
  color: string; // e.g. '#ffa040'
}

export class LightingSystem {
  private width: number;
  private height: number;
  // Explored grid: true if tile was ever illuminated
  public explored: boolean[][];
  // Current active light intensity [0.0 - 1.0] for visible tiles
  public lightMap: number[][];
  private flickerOffset: number = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.explored = Array.from({ length: height }, () => Array(width).fill(false));
    this.lightMap = Array.from({ length: height }, () => Array(width).fill(0));
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.explored = Array.from({ length: height }, () => Array(width).fill(false));
    this.lightMap = Array.from({ length: height }, () => Array(width).fill(0));
  }

  public update(
    sources: LightSource[],
    isOpaque: (x: number, y: number) => boolean,
    isTown: boolean = false
  ) {
    this.flickerOffset += 0.08;

    // Reset light map
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.lightMap[y][x] = isTown ? 0.9 : 0;
        if (isTown) this.explored[y][x] = true;
      }
    }

    if (isTown) return;

    for (const source of sources) {
      // Natural torch flicker
      const flicker = 0.9 + 0.1 * Math.sin(this.flickerOffset * 2.5 + source.x) * Math.cos(this.flickerOffset * 1.8 + source.y);
      const effectiveRadius = source.radius * flicker;
      const startX = Math.floor(source.x);
      const startY = Math.floor(source.y);

      // Raycast in 360-degree perimeter
      const stepCount = Math.floor(effectiveRadius * 8);
      for (let i = 0; i < stepCount; i++) {
        const angle = (i / stepCount) * Math.PI * 2;
        const targetX = startX + Math.cos(angle) * effectiveRadius;
        const targetY = startY + Math.sin(angle) * effectiveRadius;

        this.castRay(startX, startY, targetX, targetY, effectiveRadius, isOpaque);
      }
    }
  }

  private castRay(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    maxRadius: number,
    isOpaque: (x: number, y: number) => boolean
  ) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    let x = Math.floor(x0);
    let y = Math.floor(y0);
    let n = 1 + Math.floor(dx + dy);
    const xInc = x1 > x0 ? 1 : -1;
    const yInc = y1 > y0 ? 1 : -1;
    let error = dx - dy;

    for (; n > 0; n--) {
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        const dist = Math.sqrt((x - x0) * (x - x0) + (y - y0) * (y - y0));
        if (dist <= maxRadius) {
          // Falloff curve: quadratic decay for gothic darkness feeling
          const normDist = dist / maxRadius;
          const brightness = Math.max(0, 1 - normDist * normDist);

          if (brightness > this.lightMap[y][x]) {
            this.lightMap[y][x] = brightness;
          }
          this.explored[y][x] = true;
        }

        // Wall blocks further ray transmission
        if (isOpaque(x, y) && (x !== Math.floor(x0) || y !== Math.floor(y0))) {
          break;
        }
      }

      if (error > 0) {
        x += xInc;
        error -= dy;
      } else {
        y += yInc;
        error += dx;
      }
    }
  }

  /**
   * Applies darkness and fog of war directly onto the isometric rendered canvas.
   */
  public getTileVisibility(x: number, y: number): { isVisible: boolean; isExplored: boolean; intensity: number } {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return { isVisible: false, isExplored: false, intensity: 0 };
    }
    const intensity = this.lightMap[y][x];
    const isVisible = intensity > 0.05;
    const isExplored = this.explored[y][x];
    return { isVisible, isExplored, intensity };
  }
}
