/**
 * Grid A* pathfinding around walls and solid furniture.
 * Doors stay passable; paths that cross a door get a short straight centerline.
 */

import {
  getObjectWorldSize,
  isWallType,
  type PlacedObject,
} from "@/features/office/core/objects";
import { ITEM_METADATA } from "@/features/office/legacy/shim";

export type NavPoint = { x: number; z: number };

/** Optional AABB that agents must stay inside (e.g. a workspace unit). */
export type NavBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

const CELL = 0.4;
const FURNITURE_PAD = 0.16;
const WALL_PAD = 0.05;
/** Short straight segment through doorways (path only — not a runtime lock). */
export const DOOR_STRAIGHT_STEPS = 5;

function cellKey(ix: number, iz: number) {
  return `${ix},${iz}`;
}

function blocksNav(type: string): boolean {
  if (type === "door") return false;
  if (isWallType(type as PlacedObject["type"])) return true;
  return ITEM_METADATA[type]?.blocksNavigation ?? false;
}

function wallThickness(object: PlacedObject): number {
  return (
    Math.max(getObjectWorldSize(object.type, object.length).depth, 0.12) *
    object.scale
  );
}

function isVerticalRot(rotationY: number): boolean {
  const rot = ((rotationY % 360) + 360) % 360;
  return (rot > 45 && rot < 135) || (rot > 225 && rot < 315);
}

export function getDoorPassage(
  object: PlacedObject,
  clear = 0.7,
): { minX: number; maxX: number; minZ: number; maxZ: number } | null {
  if (object.type !== "door") return null;
  const length = object.length || getObjectWorldSize("door").width;
  const thick = wallThickness(object) + clear * 2;
  const open = Math.max(0.8, length);
  if (isVerticalRot(object.rotationY)) {
    return {
      minX: object.x - thick / 2,
      maxX: object.x + thick / 2,
      minZ: object.z - open / 2,
      maxZ: object.z + open / 2,
    };
  }
  return {
    minX: object.x - open / 2,
    maxX: object.x + open / 2,
    minZ: object.z - thick / 2,
    maxZ: object.z + thick / 2,
  };
}

function buildDoorStraightCorridor(
  door: PlacedObject,
  from: NavPoint,
  to: NavPoint,
  steps = DOOR_STRAIGHT_STEPS,
): NavPoint[] {
  if (door.type !== "door") return [];
  const vertical = isVerticalRot(door.rotationY);

  if (vertical) {
    const fromSide = Math.sign(from.x - door.x) || -1;
    const toSide = Math.sign(to.x - door.x) || -fromSide;
    const exitSign = toSide === 0 || toSide === fromSide ? -fromSide : toSide;
    const enterSign = -exitSign;
    const points: NavPoint[] = [];
    for (let i = steps; i >= 1; i -= 1) {
      points.push({ x: door.x + enterSign * i * CELL, z: door.z });
    }
    points.push({ x: door.x, z: door.z });
    for (let i = 1; i <= steps; i += 1) {
      points.push({ x: door.x + exitSign * i * CELL, z: door.z });
    }
    return points;
  }

  const fromSide = Math.sign(from.z - door.z) || -1;
  const toSide = Math.sign(to.z - door.z) || -fromSide;
  const exitSign = toSide === 0 || toSide === fromSide ? -fromSide : toSide;
  const enterSign = -exitSign;
  const points: NavPoint[] = [];
  for (let i = steps; i >= 1; i -= 1) {
    points.push({ x: door.x, z: door.z + enterSign * i * CELL });
  }
  points.push({ x: door.x, z: door.z });
  for (let i = 1; i <= steps; i += 1) {
    points.push({ x: door.x, z: door.z + exitSign * i * CELL });
  }
  return points;
}

function segmentCrossesDoor(
  a: NavPoint,
  b: NavPoint,
  door: PlacedObject,
): boolean {
  const half = (door.length || 2) / 2 + 0.25;
  if (isVerticalRot(door.rotationY)) {
    const crosses =
      (a.x - door.x) * (b.x - door.x) <= 0 &&
      Math.min(a.x, b.x) <= door.x + 0.01 &&
      Math.max(a.x, b.x) >= door.x - 0.01;
    const near =
      Math.abs(a.z - door.z) <= half && Math.abs(b.z - door.z) <= half + 1.2;
    return crosses && near;
  }
  const crosses =
    (a.z - door.z) * (b.z - door.z) <= 0 &&
    Math.min(a.z, b.z) <= door.z + 0.01 &&
    Math.max(a.z, b.z) >= door.z - 0.01;
  const near =
    Math.abs(a.x - door.x) <= half && Math.abs(b.x - door.x) <= half + 1.2;
  return crosses && near;
}

/** Only when a path segment actually crosses a door — insert a short straight lane. */
export function enforceDoorStraightCorridors(
  path: NavPoint[],
  objects: PlacedObject[],
  steps = DOOR_STRAIGHT_STEPS,
): NavPoint[] {
  const doors = objects.filter((object) => object.type === "door");
  if (doors.length === 0 || path.length < 2) return path;

  let result = path;
  for (const door of doors) {
    let crossIndex = -1;
    for (let i = 1; i < result.length; i += 1) {
      if (segmentCrossesDoor(result[i - 1]!, result[i]!, door)) {
        crossIndex = i;
        break;
      }
    }
    if (crossIndex < 0) continue;

    const corridorReach = steps * CELL + CELL;
    const nearDoor = (point: NavPoint) => {
      if (isVerticalRot(door.rotationY)) {
        return (
          Math.abs(point.x - door.x) <= corridorReach &&
          Math.abs(point.z - door.z) <= (door.length || 2) / 2 + 0.3
        );
      }
      return (
        Math.abs(point.z - door.z) <= corridorReach &&
        Math.abs(point.x - door.x) <= (door.length || 2) / 2 + 0.3
      );
    };

    const before = result.slice(0, crossIndex).filter((p) => !nearDoor(p));
    const after = result.slice(crossIndex).filter((p) => !nearDoor(p));
    const from = before[before.length - 1] ?? result[0]!;
    const to = after[0] ?? result[result.length - 1]!;
    const corridor = buildDoorStraightCorridor(door, from, to, steps);
    result = [...before, ...corridor, ...after];
  }

  const cleaned: NavPoint[] = [];
  for (const point of result) {
    const prev = cleaned[cleaned.length - 1];
    if (prev && Math.hypot(prev.x - point.x, prev.z - point.z) < CELL * 0.4) {
      continue;
    }
    cleaned.push(point);
  }
  return cleaned;
}

/**
 * Soft snap only when very close to the door plane (not a room-wide lock).
 */
export function snapToDoorCenterline(
  x: number,
  z: number,
  objects: PlacedObject[],
): NavPoint {
  const PLANE = 0.55;
  for (const object of objects) {
    if (object.type !== "door") continue;
    const halfOpen = Math.max(0.35, (object.length || 2) / 2 - 0.15);
    if (isVerticalRot(object.rotationY)) {
      if (Math.abs(x - object.x) <= PLANE && Math.abs(z - object.z) <= halfOpen) {
        return { x, z: object.z };
      }
    } else if (
      Math.abs(z - object.z) <= PLANE &&
      Math.abs(x - object.x) <= halfOpen
    ) {
      return { x: object.x, z };
    }
  }
  return { x, z };
}

export function pointInDoorPassage(
  x: number,
  z: number,
  objects: PlacedObject[],
): boolean {
  for (const object of objects) {
    const box = getDoorPassage(object);
    if (!box) continue;
    if (x >= box.minX && x <= box.maxX && z >= box.minZ && z <= box.maxZ) {
      return true;
    }
  }
  return false;
}

export function buildOccupancy(
  objects: PlacedObject[],
  halfW: number,
  halfD: number,
  agentRadius = FURNITURE_PAD,
): {
  blocked: Set<string>;
  toCell: (x: number, z: number) => { ix: number; iz: number };
  toWorld: (ix: number, iz: number) => NavPoint;
} {
  const blocked = new Set<string>();
  const toCell = (x: number, z: number) => ({
    ix: Math.round(x / CELL),
    iz: Math.round(z / CELL),
  });
  const toWorld = (ix: number, iz: number): NavPoint => ({
    x: ix * CELL,
    z: iz * CELL,
  });

  const markRect = (
    cx: number,
    cz: number,
    hw: number,
    hd: number,
    rotDeg: number,
    pad: number,
  ) => {
    const rad = (rotDeg * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const aabbW = hw * cos + hd * sin;
    const aabbD = hw * sin + hd * cos;
    const iMinX = Math.floor((cx - aabbW - pad) / CELL);
    const iMaxX = Math.ceil((cx + aabbW + pad) / CELL);
    const iMinZ = Math.floor((cz - aabbD - pad) / CELL);
    const iMaxZ = Math.ceil((cz + aabbD + pad) / CELL);
    for (let ix = iMinX; ix <= iMaxX; ix += 1) {
      for (let iz = iMinZ; iz <= iMaxZ; iz += 1) {
        blocked.add(cellKey(ix, iz));
      }
    }
  };

  for (const object of objects) {
    if (!blocksNav(object.type)) continue;
    const size = getObjectWorldSize(object.type, object.length);
    const isWall = isWallType(object.type) && object.type !== "door";
    const hw = isWall
      ? (object.length || size.width) / 2
      : (size.width * object.scale) / 2;
    const hd = isWall
      ? wallThickness(object) / 2
      : (size.depth * object.scale) / 2;
    const pad = isWall
      ? WALL_PAD
      : (ITEM_METADATA[object.type]?.navPadding ?? agentRadius);
    markRect(object.x, object.z, hw, hd, object.rotationY, pad);
  }

  // Carve full door openings (no narrow-lane re-block — that trapped agents).
  for (const object of objects) {
    const passage = getDoorPassage(object);
    if (!passage) continue;
    const iMinX = Math.floor(passage.minX / CELL);
    const iMaxX = Math.ceil(passage.maxX / CELL);
    const iMinZ = Math.floor(passage.minZ / CELL);
    const iMaxZ = Math.ceil(passage.maxZ / CELL);
    for (let ix = iMinX; ix <= iMaxX; ix += 1) {
      for (let iz = iMinZ; iz <= iMaxZ; iz += 1) {
        blocked.delete(cellKey(ix, iz));
      }
    }
  }

  void halfW;
  void halfD;
  return { blocked, toCell, toWorld };
}

function findNearestWalkable(
  ix: number,
  iz: number,
  walkable: (ix: number, iz: number) => boolean,
  maxRing = 12,
): { ix: number; iz: number } | null {
  if (walkable(ix, iz)) return { ix, iz };
  for (let ring = 1; ring <= maxRing; ring += 1) {
    for (let dx = -ring; dx <= ring; dx += 1) {
      for (let dz = -ring; dz <= ring; dz += 1) {
        if (Math.abs(dx) !== ring && Math.abs(dz) !== ring) continue;
        if (walkable(ix + dx, iz + dz)) return { ix: ix + dx, iz: iz + dz };
      }
    }
  }
  return null;
}

export function findNavPath(
  start: NavPoint,
  goal: NavPoint,
  objects: PlacedObject[],
  halfW: number,
  halfD: number,
  roamBounds?: NavBounds | null,
): NavPoint[] {
  const { blocked, toCell, toWorld } = buildOccupancy(objects, halfW, halfD);
  const startCell = toCell(start.x, start.z);
  const goalCell = toCell(goal.x, goal.z);

  const inBounds = (ix: number, iz: number) => {
    const p = toWorld(ix, iz);
    if (Math.abs(p.x) > halfW - 0.5 || Math.abs(p.z) > halfD - 0.5) {
      return false;
    }
    if (!roamBounds) return true;
    return (
      p.x >= roamBounds.minX &&
      p.x <= roamBounds.maxX &&
      p.z >= roamBounds.minZ &&
      p.z <= roamBounds.maxZ
    );
  };
  const walkable = (ix: number, iz: number) =>
    inBounds(ix, iz) && !blocked.has(cellKey(ix, iz));

  const startFree = findNearestWalkable(startCell.ix, startCell.iz, walkable);
  const goalFree = findNearestWalkable(goalCell.ix, goalCell.iz, walkable);
  if (!startFree || !goalFree) return [];
  if (startFree.ix === goalFree.ix && startFree.iz === goalFree.iz) {
    return [start, goal];
  }

  type Node = { ix: number; iz: number; g: number; f: number; parent?: Node };
  const open: Node[] = [];
  const closed = new Set<string>();
  const bestG = new Map<string, number>();
  const h = (ix: number, iz: number) =>
    Math.hypot(ix - goalFree.ix, iz - goalFree.iz);

  open.push({
    ix: startFree.ix,
    iz: startFree.iz,
    g: 0,
    f: h(startFree.ix, startFree.iz),
  });
  bestG.set(cellKey(startFree.ix, startFree.iz), 0);

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ] as const;

  let found: Node | null = null;
  let guard = 0;
  while (open.length > 0 && guard < 8000) {
    guard += 1;
    let bestIndex = 0;
    for (let i = 1; i < open.length; i += 1) {
      if (open[i]!.f < open[bestIndex]!.f) bestIndex = i;
    }
    const current = open.splice(bestIndex, 1)[0]!;
    const key = cellKey(current.ix, current.iz);
    if (closed.has(key)) continue;
    closed.add(key);
    if (current.ix === goalFree.ix && current.iz === goalFree.iz) {
      found = current;
      break;
    }
    for (const [dx, dz] of dirs) {
      const nix = current.ix + dx;
      const niz = current.iz + dz;
      const nkey = cellKey(nix, niz);
      if (closed.has(nkey) || !walkable(nix, niz)) continue;
      if (
        dx !== 0 &&
        dz !== 0 &&
        (!walkable(current.ix + dx, current.iz) ||
          !walkable(current.ix, current.iz + dz))
      ) {
        continue;
      }
      const step = dx !== 0 && dz !== 0 ? 1.414 : 1;
      const g = current.g + step;
      const prev = bestG.get(nkey);
      if (prev !== undefined && g >= prev) continue;
      bestG.set(nkey, g);
      open.push({
        ix: nix,
        iz: niz,
        g,
        f: g + h(nix, niz),
        parent: current,
      });
    }
  }

  if (!found) return [];

  const path: NavPoint[] = [];
  let node: Node | undefined = found;
  while (node) {
    path.push(toWorld(node.ix, node.iz));
    node = node.parent;
  }
  path.reverse();
  if (path.length > 0) {
    path[0] = start;
    path[path.length - 1] = goal;
  }
  return enforceDoorStraightCorridors(path, objects);
}

export function pointBlocked(
  x: number,
  z: number,
  objects: PlacedObject[],
  halfW: number,
  halfD: number,
  radius = FURNITURE_PAD,
): boolean {
  if (Math.abs(x) > halfW - 0.5 || Math.abs(z) > halfD - 0.5) return true;
  if (pointInDoorPassage(x, z, objects)) return false;
  const { blocked, toCell } = buildOccupancy(objects, halfW, halfD, radius);
  const { ix, iz } = toCell(x, z);
  return blocked.has(cellKey(ix, iz));
}
