/** Placement snap helpers for drag / Tools. */

export const SNAP_GRID_WORLD = 0.25;
export const WALL_SNAP_DISTANCE = 0.55;

export function snapToGrid(
  value: number,
  grid: number = SNAP_GRID_WORLD,
): number {
  return Math.round(value / grid) * grid;
}

export type WallSegment = {
  x: number;
  z: number;
  length: number;
  rotationY: number;
};

/**
 * Snap a point onto the nearest wall axis if close enough.
 * Horizontal walls (rot ~0/180): lock Z. Vertical walls (rot ~90/270): lock X.
 */
export function snapToNearestWall(
  x: number,
  z: number,
  walls: WallSegment[],
  maxDist: number = WALL_SNAP_DISTANCE,
): { x: number; z: number; rotationY?: number } {
  let best = { x, z, dist: maxDist, rotationY: undefined as number | undefined };

  for (const wall of walls) {
    const rot = ((wall.rotationY % 360) + 360) % 360;
    const horizontal = rot < 45 || rot > 315 || (rot > 135 && rot < 225);
    if (horizontal) {
      const half = wall.length / 2;
      if (x < wall.x - half - 0.2 || x > wall.x + half + 0.2) continue;
      const dist = Math.abs(z - wall.z);
      if (dist < best.dist) {
        best = { x, z: wall.z, dist, rotationY: 0 };
      }
    } else {
      const half = wall.length / 2;
      if (z < wall.z - half - 0.2 || z > wall.z + half + 0.2) continue;
      const dist = Math.abs(x - wall.x);
      if (dist < best.dist) {
        best = { x: wall.x, z, dist, rotationY: 90 };
      }
    }
  }

  return { x: best.x, z: best.z, rotationY: best.rotationY };
}

export function applyPlacementSnap(
  x: number,
  z: number,
  options: {
    snapToGrid: boolean;
    snapToWall: boolean;
    walls: WallSegment[];
  },
): { x: number; z: number; rotationY?: number } {
  let nextX = x;
  let nextZ = z;
  let rotationY: number | undefined;

  if (options.snapToWall && options.walls.length > 0) {
    const wallSnap = snapToNearestWall(nextX, nextZ, options.walls);
    nextX = wallSnap.x;
    nextZ = wallSnap.z;
    rotationY = wallSnap.rotationY;
  }

  if (options.snapToGrid) {
    nextX = snapToGrid(nextX);
    nextZ = snapToGrid(nextZ);
  }

  return { x: nextX, z: nextZ, rotationY };
}
