/**
 * Isometric Projection Mathematics and Coordinate Transforms for 2.5D Diamond Grid.
 * Based on classic Diablo 1 2:1 isometric ratio (64x32px per tile).
 */

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const HALF_WIDTH = TILE_WIDTH / 2;   // 32
export const HALF_HEIGHT = TILE_HEIGHT / 2; // 16

export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface Point {
  x: number;
  y: number;
}

export interface GridCoord {
  gx: number;
  gy: number;
}

export interface ScreenCoord {
  sx: number;
  sy: number;
}

/**
 * Converts world grid coordinates (continuous or integer) to screen coordinates.
 */
export function gridToScreen(gx: number, gy: number, cameraX: number = 0, cameraY: number = 0, elevation: number = 0): ScreenCoord {
  return {
    sx: (gx - gy) * HALF_WIDTH + cameraX,
    sy: (gx + gy) * HALF_HEIGHT - elevation + cameraY
  };
}

/**
 * Converts screen pixel coordinates to continuous world grid coordinates.
 */
export function screenToGrid(sx: number, sy: number, cameraX: number = 0, cameraY: number = 0): GridCoord {
  const relX = sx - cameraX;
  const relY = sy - cameraY;

  const gx = (relX / HALF_WIDTH + relY / HALF_HEIGHT) / 2;
  const gy = (relY / HALF_HEIGHT - relX / HALF_WIDTH) / 2;

  return { gx, gy };
}

/**
 * Converts screen pixel coordinates directly to the containing integer grid tile [x, y].
 */
export function screenToTile(sx: number, sy: number, cameraX: number = 0, cameraY: number = 0): { x: number; y: number } {
  const { gx, gy } = screenToGrid(sx, sy, cameraX, cameraY);
  return {
    x: Math.floor(gx),
    y: Math.floor(gy)
  };
}

/**
 * Calculates depth order value for sorting isometric objects and tiles.
 * Entities and tiles with higher depth are drawn in front.
 */
export function getIsometricDepth(gx: number, gy: number, zOffset: number = 0): number {
  return (gx + gy) * 1000 + zOffset;
}

/**
 * Calculates the 8-directional heading from delta (dx, dy) in grid coordinates.
 */
export function getDirection(dx: number, dy: number): Direction {
  if (dx === 0 && dy === 0) return 'S';
  const angle = Math.atan2(dy, dx); // radians from -PI to PI
  // Divide circle into 8 segments of 45 deg (PI/4)
  // Grid: dx > 0 is down-right in iso, dy > 0 is down-left in iso
  const octant = Math.round(8 * angle / (2 * Math.PI) + 8) % 8;
  // Map octants to 8 directions:
  // 0: +x (SE), 1: +x +y (S), 2: +y (SW), 3: -x +y (W), 4: -x (NW), 5: -x -y (N), 6: -y (NE), 7: +x -y (E)
  const directions: Direction[] = ['SE', 'S', 'SW', 'W', 'NW', 'N', 'NE', 'E'];
  return directions[octant];
}

/**
 * Euclidean distance between two grid points.
 */
export function gridDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Chebyshev distance (maximum coordinate difference, max steps in 8-direction grid).
 */
export function chebyshevDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
}
