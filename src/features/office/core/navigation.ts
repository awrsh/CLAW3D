/**
 * Grid A* pathfinding around walls and solid furniture.
 */

import {
  getObjectWorldSize,
  isWallType,
  type PlacedObject,
} from "@/features/office/core/objects";
import { ITEM_METADATA } from "@/features/office/legacy/shim";

export type NavPoint = { x: number; z: number };

const CELL = 0.5;

function blocksNav(type: string): boolean {
  if (isWallType(type as PlacedObject["type"])) {
    return type !== "door";
  }
  return ITEM_METADATA[type]?.blocksNavigation ?? true;
}

function cellKey(ix: number, iz: number) {
  return `${ix},${iz}`;
}

export function buildOccupancy(
  objects: PlacedObject[],
  halfW: number,
  halfD: number,
  agentRadius = 0.35,
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
  ) => {
    const rad = (rotDeg * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const aabbW = hw * cos + hd * sin;
    const aabbD = hw * sin + hd * cos;
    const minX = cx - aabbW - agentRadius;
    const maxX = cx + aabbW + agentRadius;
    const minZ = cz - aabbD - agentRadius;
    const maxZ = cz + aabbD + agentRadius;
    for (let x = minX; x <= maxX; x += CELL) {
      for (let z = minZ; z <= maxZ; z += CELL) {
        const { ix, iz } = toCell(x, z);
        blocked.add(cellKey(ix, iz));
      }
    }
  };

  for (const object of objects) {
    if (!blocksNav(object.type)) continue;
    if (isWallType(object.type) && object.type === "door") continue;
    const size = getObjectWorldSize(object.type, object.length);
    const hw = isWallType(object.type)
      ? (object.length || size.width) / 2
      : size.width / 2;
    const hd = size.depth / 2;
    markRect(object.x, object.z, hw, hd, object.rotationY);
  }

  // Soft floor bounds
  const boundPad = 0.8;
  for (let x = -halfW; x <= halfW; x += CELL) {
    for (const z of [-halfD + boundPad, halfD - boundPad]) {
      const { ix, iz } = toCell(x, z);
      // don't mark entire edge as blocked — agents stay inside via clamp
      void ix;
      void iz;
    }
  }
  void boundPad;

  return { blocked, toCell, toWorld };
}

export function findNavPath(
  start: NavPoint,
  goal: NavPoint,
  objects: PlacedObject[],
  halfW: number,
  halfD: number,
): NavPoint[] {
  const { blocked, toCell, toWorld } = buildOccupancy(objects, halfW, halfD);
  const startCell = toCell(start.x, start.z);
  const goalCell = toCell(goal.x, goal.z);

  const inBounds = (ix: number, iz: number) => {
    const p = toWorld(ix, iz);
    return (
      Math.abs(p.x) <= halfW - 0.6 && Math.abs(p.z) <= halfD - 0.6
    );
  };

  const walkable = (ix: number, iz: number) =>
    inBounds(ix, iz) && !blocked.has(cellKey(ix, iz));

  // If start/goal blocked, allow them and search neighbors
  const startWalk =
    walkable(startCell.ix, startCell.iz) || true;
  void startWalk;

  type Node = { ix: number; iz: number; g: number; f: number; parent?: Node };
  const open: Node[] = [];
  const closed = new Set<string>();
  const h = (ix: number, iz: number) =>
    Math.hypot(ix - goalCell.ix, iz - goalCell.iz);

  open.push({
    ix: startCell.ix,
    iz: startCell.iz,
    g: 0,
    f: h(startCell.ix, startCell.iz),
  });

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
  while (open.length > 0 && guard < 4000) {
    guard += 1;
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    const key = cellKey(current.ix, current.iz);
    if (closed.has(key)) continue;
    closed.add(key);

    if (current.ix === goalCell.ix && current.iz === goalCell.iz) {
      found = current;
      break;
    }

    for (const [dx, dz] of dirs) {
      const nix = current.ix + dx;
      const niz = current.iz + dz;
      const nkey = cellKey(nix, niz);
      if (closed.has(nkey)) continue;
      const isGoal = nix === goalCell.ix && niz === goalCell.iz;
      if (!isGoal && !walkable(nix, niz)) continue;
      // no corner cutting
      if (dx !== 0 && dz !== 0) {
        if (!walkable(current.ix + dx, current.iz) || !walkable(current.ix, current.iz + dz)) {
          if (!isGoal) continue;
        }
      }
      const step = dx !== 0 && dz !== 0 ? 1.414 : 1;
      const g = current.g + step;
      open.push({
        ix: nix,
        iz: niz,
        g,
        f: g + h(nix, niz),
        parent: current,
      });
    }
  }

  if (!found) {
    return [goal];
  }

  const path: NavPoint[] = [];
  let node: Node | undefined = found;
  while (node) {
    path.push(toWorld(node.ix, node.iz));
    node = node.parent;
  }
  path.reverse();
  // Replace ends with exact start/goal
  if (path.length > 0) {
    path[0] = start;
    path[path.length - 1] = goal;
  }
  return path;
}

export function pointBlocked(
  x: number,
  z: number,
  objects: PlacedObject[],
  halfW: number,
  halfD: number,
  radius = 0.35,
): boolean {
  if (Math.abs(x) > halfW - 0.5 || Math.abs(z) > halfD - 0.5) return true;
  const { blocked, toCell } = buildOccupancy(objects, halfW, halfD, radius);
  const { ix, iz } = toCell(x, z);
  return blocked.has(cellKey(ix, iz));
}
