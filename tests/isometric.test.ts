import { describe, it, expect } from 'vitest';
import {
  gridToScreen,
  screenToGrid,
  screenToTile,
  getDirection,
  chebyshevDistance,
  gridDistance
} from '../src/renderer/Isometric.js';

describe('Isometric Coordinate Transformations', () => {
  it('should accurately roundtrip between grid and screen coordinates', () => {
    const testCases = [
      { gx: 0, gy: 0 },
      { gx: 5, gy: 5 },
      { gx: 12.5, gy: 8.5 },
      { gx: 24, gy: 14 }
    ];

    for (const { gx, gy } of testCases) {
      const screen = gridToScreen(gx, gy, 100, 200);
      const grid = screenToGrid(screen.sx, screen.sy, 100, 200);

      expect(grid.gx).toBeCloseTo(gx, 5);
      expect(grid.gy).toBeCloseTo(gy, 5);
    }
  });

  it('should resolve correct containing integer tile', () => {
    const screen = gridToScreen(7.2, 4.8, 0, 0);
    const tile = screenToTile(screen.sx, screen.sy, 0, 0);

    expect(tile.x).toBe(7);
    expect(tile.y).toBe(4);
  });

  it('should compute correct 8-directional heading', () => {
    // East (+x, -y) or SE (+x, 0)
    expect(getDirection(1, 0)).toBe('SE');
    expect(getDirection(0, 1)).toBe('SW');
    expect(getDirection(-1, 0)).toBe('NW');
    expect(getDirection(0, -1)).toBe('NE');
    expect(getDirection(1, 1)).toBe('S');
    expect(getDirection(-1, -1)).toBe('N');
  });

  it('should compute correct distances', () => {
    expect(chebyshevDistance(0, 0, 3, 5)).toBe(5);
    expect(gridDistance(0, 0, 3, 4)).toBe(5);
  });
});
