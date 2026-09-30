/**
 * Town Generator (Tristram Hub).
 * Safe zone with town square, NPC merchants, and cathedral descent.
 */

import { TileMap, TileType, PropType } from './TileMap.js';

export interface TownData {
  map: TileMap;
  playerSpawn: { x: number; y: number };
  cathedralEntrance: { x: number; y: number };
  npcs: { name: string; role: string; x: number; y: number }[];
}

export function generateTown(): TownData {
  const width = 36;
  const height = 36;
  const map = new TileMap(width, height);

  // Fill outer boundary with walls/nature
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        map.setTile(x, y, TileType.WALL, 'town');
      } else {
        map.setTile(x, y, TileType.FLOOR, 'town');
      }
    }
  }

  // Cathedral building at North-East (x: 18..30, y: 4..14)
  for (let y = 4; y <= 14; y++) {
    for (let x = 18; x <= 30; x++) {
      if (y === 4 || y === 14 || x === 18 || x === 30) {
        map.setTile(x, y, TileType.WALL, 'cathedral');
      } else {
        map.setTile(x, y, TileType.FLOOR, 'cathedral');
      }
    }
  }

  // Cathedral archway entrance
  map.setTile(24, 14, TileType.DOOR_OPEN, 'cathedral');
  // Stairs down inside cathedral
  map.setTile(24, 8, TileType.STAIRS_DOWN, 'cathedral');

  // Cathedral decorative pillars & torches
  map.setProp(20, 7, PropType.PILLAR);
  map.setProp(28, 7, PropType.PILLAR);
  map.setProp(20, 11, PropType.PILLAR);
  map.setProp(28, 11, PropType.PILLAR);
  map.setProp(22, 14, PropType.TORCH);
  map.setProp(26, 14, PropType.TORCH);

  // Town Square (Center around x: 14, y: 20)
  // Bonfire / Fountain at center
  map.setProp(14, 20, PropType.TORCH);
  map.setProp(12, 18, PropType.BARREL);
  map.setProp(16, 18, PropType.BARREL);

  // Griswold's Smithy at South-West (x: 5..12, y: 24..30)
  for (let y = 24; y <= 30; y++) {
    for (let x = 5; x <= 12; x++) {
      if (y === 24 || y === 30 || x === 5 || x === 12) {
        if (!(x === 10 && y === 24)) { // doorway
          map.setTile(x, y, TileType.WALL, 'town');
        } else {
          map.setTile(x, y, TileType.FLOOR, 'town');
        }
      }
    }
  }
  map.setProp(7, 26, PropType.BARREL);
  map.setProp(10, 27, PropType.CHEST_CLOSED);

  // Pepin the Healer's Hut at North-West (x: 5..12, y: 5..11)
  for (let y = 5; y <= 11; y++) {
    for (let x = 5; x <= 12; x++) {
      if (y === 5 || y === 11 || x === 5 || x === 12) {
        if (!(x === 12 && y === 8)) { // doorway
          map.setTile(x, y, TileType.WALL, 'town');
        } else {
          map.setTile(x, y, TileType.FLOOR, 'town');
        }
      }
    }
  }

  const npcs = [
    { name: 'Griswold the Blacksmith', role: 'blacksmith', x: 8, y: 26 },
    { name: 'Pepin the Healer', role: 'healer', x: 8, y: 8 },
    { name: 'Deckard Cain the Elder', role: 'elder', x: 15, y: 19 }
  ];

  return {
    map,
    playerSpawn: { x: 14, y: 22 },
    cathedralEntrance: { x: 24, y: 8 },
    npcs
  };
}
