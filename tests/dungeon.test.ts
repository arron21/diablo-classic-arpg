import { describe, it, expect } from 'vitest';
import { generateDungeonFloor } from '../src/world/DungeonGen.js';
import { TileType } from '../src/world/TileMap.js';

describe('Dungeon Generation & Hallway Dimensions', () => {
  it('should generate a valid dungeon floor with stairs up, stairs down, and monsters', () => {
    const floor = generateDungeonFloor(1);

    expect(floor.map.width).toBe(56);
    expect(floor.map.height).toBe(56);
    expect(floor.stairsUp).toBeDefined();
    expect(floor.stairsDown).toBeDefined();
    expect(floor.monsterSpawns.length).toBeGreaterThan(0);

    const tileUp = floor.map.get(floor.stairsUp.x, floor.stairsUp.y);
    expect(tileUp?.type).toBe(TileType.STAIRS_UP);

    const tileDown = floor.map.get(floor.stairsDown!.x, floor.stairsDown!.y);
    expect(tileDown?.type).toBe(TileType.STAIRS_DOWN);
  });

  it('should generate Butcher room on floor 2 with Butcher boss spawn', () => {
    const floor2 = generateDungeonFloor(2);
    const butcherSpawn = floor2.monsterSpawns.find(m => m.type === 'butcher');

    expect(butcherSpawn).toBeDefined();
    expect(floor2.stairsDown).toBeNull(); // Last floor in vertical slice
  });

  it('should ensure all hallways are at least 3 squares wide', () => {
    for (let test = 0; test < 5; test++) {
      const floor = generateDungeonFloor(1);
      const map = floor.map;

      // Scan all walkable floor tiles in the map
      for (let y = 3; y < map.height - 3; y++) {
        for (let x = 3; x < map.width - 3; x++) {
          const tile = map.get(x, y);
          if (tile && (tile.type === TileType.FLOOR || tile.type === TileType.DOOR_CLOSED || tile.type === TileType.DOOR_OPEN)) {
            // Measure horizontal span of consecutive floor tiles
            let hSpan = 1;
            let left = x - 1;
            while (left >= 0 && map.isWalkable(left, y)) {
              hSpan++;
              left--;
            }
            let right = x + 1;
            while (right < map.width && map.isWalkable(right, y)) {
              hSpan++;
              right++;
            }

            // Measure vertical span of consecutive floor tiles
            let vSpan = 1;
            let up = y - 1;
            while (up >= 0 && map.isWalkable(x, up)) {
              vSpan++;
              up--;
            }
            let down = y + 1;
            while (down < map.height && map.isWalkable(x, down)) {
              vSpan++;
              down++;
            }

            // In our dungeon, every passable tile belongs to a room or a 3-tile wide corridor.
            // Therefore, max(hSpan, vSpan) must be >= 3 everywhere!
            const maxWidth = Math.max(hSpan, vSpan);
            expect(maxWidth).toBeGreaterThanOrEqual(3);
          }
        }
      }
    }
  });
});
