/**
 * Procedural Cathedral & Catacombs Dungeon Generator.
 * Creates multi-room layouts, interactive doors, chests, barrels,
 * and the iconic Butcher's Lair on Level 2.
 */

import { TileMap, TileType, PropType } from './TileMap.js';

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  isButcherRoom?: boolean;
}

export interface MonsterSpawn {
  x: number;
  y: number;
  type: 'skeleton' | 'zombie' | 'butcher';
}

export interface DungeonFloor {
  floorLevel: number;
  map: TileMap;
  stairsUp: { x: number; y: number };
  stairsDown: { x: number; y: number } | null;
  monsterSpawns: MonsterSpawn[];
  torches: { x: number; y: number }[];
}

export function generateDungeonFloor(floorLevel: number): DungeonFloor {
  const width = 56;
  const height = 56;
  const map = new TileMap(width, height);

  // Initialize entire map as solid walls
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      map.setTile(x, y, TileType.WALL, floorLevel >= 2 ? 'blood' : 'cathedral');
    }
  }

  const rooms: Room[] = [];
  const maxRooms = 8;
  const minSize = 7;
  const maxSize = 11;

  for (let i = 0; i < 50 && rooms.length < maxRooms; i++) {
    const w = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
    const h = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
    const x = Math.floor(Math.random() * (width - w - 6)) + 3;
    const y = Math.floor(Math.random() * (height - h - 6)) + 3;

    // Ensure at least 4 tiles padding between rooms
    let overlap = false;
    for (const r of rooms) {
      if (x < r.x + r.w + 4 && x + w + 4 > r.x && y < r.y + r.h + 4 && y + h + 4 > r.y) {
        overlap = true;
        break;
      }
    }
    if (!overlap) {
      rooms.push({ x, y, w, h });
    }
  }

  // If on Level 2, mark the last room as The Butcher's Lair
  if (floorLevel >= 2 && rooms.length > 1) {
    rooms[rooms.length - 1].isButcherRoom = true;
  }

  // Carve rooms into map
  for (const r of rooms) {
    const isBlood = r.isButcherRoom || floorLevel >= 2;
    for (let ry = r.y; ry < r.y + r.h; ry++) {
      for (let rx = r.x; rx < r.x + r.w; rx++) {
        map.setTile(rx, ry, TileType.FLOOR, isBlood ? 'blood' : 'cathedral');
      }
    }

    // Add room props
    if (r.isButcherRoom) {
      // Gore and blood-soaked chamber
      map.setProp(r.x + 2, r.y + 2, PropType.TORCH);
      map.setProp(r.x + r.w - 3, r.y + 2, PropType.TORCH);
      map.setProp(r.x + 2, r.y + r.h - 3, PropType.BARREL);
    } else {
      // Normal cathedral props
      if (Math.random() > 0.4) {
        map.setProp(r.x + 2, r.y + 2, PropType.BARREL);
      }
      if (Math.random() > 0.6) {
        map.setProp(r.x + r.w - 2, r.y + 2, PropType.CHEST_CLOSED);
      }
    }
  }

  // Connect rooms with corridors that are ALWAYS AT LEAST 3 SQUARES WIDE
  for (let i = 0; i < rooms.length - 1; i++) {
    const r1 = rooms[i];
    const r2 = rooms[i + 1];

    const c1 = { x: Math.floor(r1.x + r1.w / 2), y: Math.floor(r1.y + r1.h / 2) };
    const c2 = { x: Math.floor(r2.x + r2.w / 2), y: Math.floor(r2.y + r2.h / 2) };

    // 1. Horizontal segment: 3 squares wide in Y direction (y-1, y, y+1)
    carveHorizontalHallway(map, c1.x, c2.x, c1.y, floorLevel);

    // 2. Vertical segment: 3 squares wide in X direction (x-1, x, x+1)
    carveVerticalHallway(map, c1.y, c2.y, c2.x, floorLevel);

    // 3. 3x3 elbow junction where horizontal meets vertical
    carveCornerJunction(map, c2.x, c1.y, floorLevel);
  }

  // Place doors at room thresholds
  for (const r of rooms) {
    placeDoorsForRoom(map, r);
  }

  // Place stairs
  const firstRoom = rooms[0];
  const lastRoom = rooms[rooms.length - 1];

  const stairsUp = {
    x: Math.floor(firstRoom.x + firstRoom.w / 2),
    y: Math.floor(firstRoom.y + firstRoom.h / 2)
  };
  map.setTile(stairsUp.x, stairsUp.y, TileType.STAIRS_UP, floorLevel >= 2 ? 'blood' : 'cathedral');

  let stairsDown: { x: number; y: number } | null = null;
  if (floorLevel < 2) {
    stairsDown = {
      x: Math.floor(lastRoom.x + lastRoom.w / 2),
      y: Math.floor(lastRoom.y + lastRoom.h / 2)
    };
    map.setTile(stairsDown.x, stairsDown.y, TileType.STAIRS_DOWN, 'cathedral');
  }

  // Monster Spawns
  const monsterSpawns: MonsterSpawn[] = [];
  const torches: { x: number; y: number }[] = [];

  for (let i = 0; i < rooms.length; i++) {
    const r = rooms[i];
    if (r.isButcherRoom) {
      // The Butcher spawns at the center of his lair!
      monsterSpawns.push({
        x: Math.floor(r.x + r.w / 2),
        y: Math.floor(r.y + r.h / 2),
        type: 'butcher'
      });
      torches.push({ x: r.x + 2, y: r.y + 2 });
      torches.push({ x: r.x + r.w - 3, y: r.y + 2 });
    } else if (i > 0) {
      // Spawn skeletons and zombies in other rooms
      const count = 2 + Math.floor(Math.random() * 3);
      for (let m = 0; m < count; m++) {
        const mx = r.x + 1 + Math.floor(Math.random() * (r.w - 2));
        const my = r.y + 1 + Math.floor(Math.random() * (r.h - 2));
        if (map.isWalkable(mx, my) && !(mx === stairsUp.x && my === stairsUp.y)) {
          const type = Math.random() > 0.5 ? 'skeleton' : 'zombie';
          monsterSpawns.push({ x: mx, y: my, type });
        }
      }
      if (Math.random() > 0.3) {
        torches.push({ x: r.x + 1, y: r.y + 1 });
      }
    }
  }

  return {
    floorLevel,
    map,
    stairsUp,
    stairsDown,
    monsterSpawns,
    torches
  };
}

function carveHorizontalHallway(map: TileMap, x1: number, x2: number, y: number, floorLevel: number) {
  const startX = Math.min(x1, x2);
  const endX = Math.max(x1, x2);
  for (let x = startX; x <= endX; x++) {
    for (let dy = -1; dy <= 1; dy++) {
      const cy = y + dy;
      if (x >= 2 && x < map.width - 2 && cy >= 2 && cy < map.height - 2) {
        const current = map.get(x, cy);
        if (current && current.type === TileType.WALL) {
          map.setTile(x, cy, TileType.FLOOR, floorLevel >= 2 ? 'blood' : 'cathedral');
        }
      }
    }
  }
}

function carveVerticalHallway(map: TileMap, y1: number, y2: number, x: number, floorLevel: number) {
  const startY = Math.min(y1, y2);
  const endY = Math.max(y1, y2);
  for (let y = startY; y <= endY; y++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = x + dx;
      if (cx >= 2 && cx < map.width - 2 && y >= 2 && y < map.height - 2) {
        const current = map.get(cx, y);
        if (current && current.type === TileType.WALL) {
          map.setTile(cx, y, TileType.FLOOR, floorLevel >= 2 ? 'blood' : 'cathedral');
        }
      }
    }
  }
}

function carveCornerJunction(map: TileMap, cx: number, cy: number, floorLevel: number) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      if (x >= 2 && x < map.width - 2 && y >= 2 && y < map.height - 2) {
        const current = map.get(x, y);
        if (current && current.type === TileType.WALL) {
          map.setTile(x, y, TileType.FLOOR, floorLevel >= 2 ? 'blood' : 'cathedral');
        }
      }
    }
  }
}

function placeDoorsForRoom(map: TileMap, r: Room) {
  const borders = [
    // North border
    ...Array.from({ length: r.w }, (_, i) => ({ x: r.x + i, y: r.y - 1 })),
    // South border
    ...Array.from({ length: r.w }, (_, i) => ({ x: r.x + i, y: r.y + r.h })),
    // West border
    ...Array.from({ length: r.h }, (_, i) => ({ x: r.x - 1, y: r.y + i })),
    // East border
    ...Array.from({ length: r.h }, (_, i) => ({ x: r.x + r.w, y: r.y + i }))
  ];

  const openings = borders.filter(b => {
    const t = map.get(b.x, b.y);
    return t && t.type === TileType.FLOOR;
  });

  if (r.isButcherRoom) {
    // Seal the Butcher's chamber entrance with closed reinforced doors!
    for (const b of openings) {
      map.setTile(b.x, b.y, TileType.DOOR_CLOSED, 'blood');
    }
  } else if (openings.length > 0 && Math.random() > 0.4) {
    // For normal rooms, place door at the center of the threshold
    const mid = openings[Math.floor(openings.length / 2)];
    map.setTile(mid.x, mid.y, TileType.DOOR_CLOSED, 'cathedral');
  }
}
