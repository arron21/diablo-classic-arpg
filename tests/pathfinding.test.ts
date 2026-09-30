import { describe, it, expect } from 'vitest';
import { findPath } from '../src/world/Pathfinding.js';

describe('A* Pathfinding System', () => {
  it('should find direct straight line path on empty grid', () => {
    const isWalkable = () => true;
    const path = findPath(0, 0, 3, 0, isWalkable);

    expect(path.length).toBe(3);
    expect(path[0]).toEqual({ x: 1, y: 0 });
    expect(path[1]).toEqual({ x: 2, y: 0 });
    expect(path[2]).toEqual({ x: 3, y: 0 });
  });

  it('should path around an obstacle wall', () => {
    // Wall at (1, 0)
    const isWalkable = (x: number, y: number) => !(x === 1 && y === 0);
    const path = findPath(0, 0, 2, 0, isWalkable);

    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ x: 2, y: 0 });
    // Path should avoid (1, 0)
    for (const step of path) {
      expect(step).not.toEqual({ x: 1, y: 0 });
    }
  });

  it('should prevent diagonal corner cutting across solid walls', () => {
    // Wall at (1, 0) and (0, 1) forming a diagonal pinch
    const isWalkable = (x: number, y: number) => !(x === 1 && y === 0) && !(x === 0 && y === 1);
    const path = findPath(0, 0, 1, 1, isWalkable);

    // Cannot cut directly between (1,0) and (0,1)
    if (path.length > 0) {
      expect(path[0]).not.toEqual({ x: 1, y: 1 });
    }
  });

  it('should handle completely enclosed unreachable targets gracefully', () => {
    // Completely enclosed target (5, 5) surrounded by walls
    const isWalkable = (x: number, y: number) => {
      if (Math.abs(x - 5) <= 1 && Math.abs(y - 5) <= 1) return false;
      return true;
    };

    const path = findPath(0, 0, 5, 5, isWalkable);
    // Nearest neighbor fallback or empty path
    if (path.length > 0) {
      const last = path[path.length - 1];
      expect(isWalkable(last.x, last.y)).toBe(true);
    }
  });
});
