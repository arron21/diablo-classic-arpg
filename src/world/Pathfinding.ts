/**
 * 8-Directional A* Pathfinding with Corner-Cutting Prevention.
 */

export interface PathNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

export function findPath(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  isWalkable: (x: number, y: number) => boolean,
  maxIterations: number = 1000
): { x: number; y: number }[] {
  // If target is same as start
  if (startX === targetX && startY === targetY) {
    return [];
  }

  // If target tile is unwalkable, try finding nearest adjacent walkable tile
  if (!isWalkable(targetX, targetY)) {
    const adjacent = [
      { x: targetX + 1, y: targetY },
      { x: targetX - 1, y: targetY },
      { x: targetX, y: targetY + 1 },
      { x: targetX, y: targetY - 1 },
      { x: targetX + 1, y: targetY + 1 },
      { x: targetX - 1, y: targetY + 1 },
      { x: targetX + 1, y: targetY - 1 },
      { x: targetX - 1, y: targetY - 1 }
    ];
    let bestDist = Infinity;
    let newTarget: { x: number; y: number } | null = null;
    for (const p of adjacent) {
      if (isWalkable(p.x, p.y)) {
        const d = Math.abs(p.x - startX) + Math.abs(p.y - startY);
        if (d < bestDist) {
          bestDist = d;
          newTarget = p;
        }
      }
    }
    if (newTarget) {
      targetX = newTarget.x;
      targetY = newTarget.y;
    } else {
      return [];
    }
  }

  const openList: PathNode[] = [];
  const closedSet = new Set<string>();

  const startNode: PathNode = {
    x: startX,
    y: startY,
    g: 0,
    h: heuristic(startX, startY, targetX, targetY),
    f: 0,
    parent: null
  };
  startNode.f = startNode.g + startNode.h;
  openList.push(startNode);

  let iterations = 0;

  while (openList.length > 0 && iterations++ < maxIterations) {
    // Sort open list by f score
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift()!;

    if (current.x === targetX && current.y === targetY) {
      // Reconstruct path
      const path: { x: number; y: number }[] = [];
      let curr: PathNode | null = current;
      while (curr && (curr.x !== startX || curr.y !== startY)) {
        path.unshift({ x: curr.x, y: curr.y });
        curr = curr.parent;
      }
      return path;
    }

    const currentKey = `${current.x},${current.y}`;
    closedSet.add(currentKey);

    // 8-directional neighbors
    const neighbors = [
      { dx: 1, dy: 0, cost: 1.0 },
      { dx: -1, dy: 0, cost: 1.0 },
      { dx: 0, dy: 1, cost: 1.0 },
      { dx: 0, dy: -1, cost: 1.0 },
      { dx: 1, dy: 1, cost: 1.414 },
      { dx: -1, dy: 1, cost: 1.414 },
      { dx: 1, dy: -1, cost: 1.414 },
      { dx: -1, dy: -1, cost: 1.414 }
    ];

    for (const n of neighbors) {
      const nx = current.x + n.dx;
      const ny = current.y + n.dy;
      const key = `${nx},${ny}`;

      if (closedSet.has(key)) continue;
      if (!isWalkable(nx, ny)) continue;

      // Prevent corner cutting across diagonal walls
      if (n.dx !== 0 && n.dy !== 0) {
        if (!isWalkable(current.x + n.dx, current.y) || !isWalkable(current.x, current.y + n.dy)) {
          continue; // Cannot squeeze diagonally between blocked tiles
        }
      }

      const gScore = current.g + n.cost;
      const existing = openList.find(node => node.x === nx && node.y === ny);

      if (!existing) {
        const neighborNode: PathNode = {
          x: nx,
          y: ny,
          g: gScore,
          h: heuristic(nx, ny, targetX, targetY),
          f: 0,
          parent: current
        };
        neighborNode.f = neighborNode.g + neighborNode.h;
        openList.push(neighborNode);
      } else if (gScore < existing.g) {
        existing.g = gScore;
        existing.f = existing.g + existing.h;
        existing.parent = current;
      }
    }
  }

  return [];
}

function heuristic(x1: number, y1: number, x2: number, y2: number): number {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  // Diagonal distance (octile heuristic)
  return 1.0 * (dx + dy) + (1.414 - 2 * 1.0) * Math.min(dx, dy);
}
