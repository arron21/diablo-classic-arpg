/**
 * TileMap representation for 2.5D Isometric World.
 */

export enum TileType {
  EMPTY = 0,
  FLOOR = 1,
  WALL = 2,
  DOOR_CLOSED = 3,
  DOOR_OPEN = 4,
  STAIRS_DOWN = 5,
  STAIRS_UP = 6
}

export enum PropType {
  NONE = 0,
  BARREL = 1,
  CHEST_CLOSED = 2,
  CHEST_OPEN = 3,
  TORCH = 4,
  PILLAR = 5
}

export interface MapTile {
  type: TileType;
  prop: PropType;
  floorVariant: 'town' | 'cathedral' | 'blood';
  wallVariant: 'cathedral' | 'blood';
  walkable: boolean;
  opaque: boolean;
}

export class TileMap {
  public width: number;
  public height: number;
  public tiles: MapTile[][];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.tiles = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ({
        type: TileType.EMPTY,
        prop: PropType.NONE,
        floorVariant: 'cathedral',
        wallVariant: 'cathedral',
        walkable: false,
        opaque: false
      }))
    );
  }

  public get(x: number, y: number): MapTile | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return this.tiles[y][x];
  }

  public setTile(x: number, y: number, type: TileType, floorVariant: 'town' | 'cathedral' | 'blood' = 'cathedral') {
    const tile = this.get(x, y);
    if (!tile) return;
    tile.type = type;
    tile.floorVariant = floorVariant;
    tile.walkable = type === TileType.FLOOR || type === TileType.DOOR_OPEN || type === TileType.STAIRS_DOWN || type === TileType.STAIRS_UP;
    tile.opaque = type === TileType.WALL || type === TileType.DOOR_CLOSED;
  }

  public setProp(x: number, y: number, prop: PropType) {
    const tile = this.get(x, y);
    if (!tile) return;
    tile.prop = prop;
    if (prop === PropType.BARREL || prop === PropType.PILLAR || prop === PropType.CHEST_CLOSED) {
      tile.walkable = false;
    }
  }

  public isWalkable(x: number, y: number): boolean {
    const tile = this.get(x, y);
    if (!tile) return false;
    return tile.walkable;
  }

  public isOpaque(x: number, y: number): boolean {
    const tile = this.get(x, y);
    if (!tile) return true;
    return tile.opaque;
  }

  public openDoor(x: number, y: number): boolean {
    const tile = this.get(x, y);
    if (tile && tile.type === TileType.DOOR_CLOSED) {
      tile.type = TileType.DOOR_OPEN;
      tile.walkable = true;
      tile.opaque = false;
      return true;
    }
    return false;
  }

  public openChest(x: number, y: number): boolean {
    const tile = this.get(x, y);
    if (tile && tile.prop === PropType.CHEST_CLOSED) {
      tile.prop = PropType.CHEST_OPEN;
      tile.walkable = true;
      return true;
    }
    return false;
  }

  public breakBarrel(x: number, y: number): boolean {
    const tile = this.get(x, y);
    if (tile && tile.prop === PropType.BARREL) {
      tile.prop = PropType.NONE;
      tile.walkable = true;
      return true;
    }
    return false;
  }
}
