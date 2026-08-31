import * as THREE from "three";
import type { FactoryAreaId } from "@/components/factory/simulation/ProductionState";

/** Axis-aligned obstacle zones in area-local coordinates (meters). */
export type NavObstacle = { x: number; z: number; rx: number; rz: number };

const CELL = 0.55;

const AREA_OBSTACLES: Partial<Record<FactoryAreaId, NavObstacle[]>> = {
  bioreactor: [
    { x: -3.5, z: 0, rx: 2.2, rz: 2.2 },
    { x: 3.5, z: 1, rx: 2.2, rz: 2.2 },
    { x: -5.5, z: -3, rx: 1.2, rz: 1.2 },
    { x: 5.5, z: -3, rx: 1.2, rz: 1.2 },
    { x: 0, z: -4, rx: 2.5, rz: 0.8 },
  ],
  preparation: [
    { x: -3, z: 0, rx: 2, rz: 2 },
    { x: 2.5, z: 0, rx: 2, rz: 2 },
    { x: 0.5, z: 2.5, rx: 1.2, rz: 1.2 },
  ],
  downstream: [
    { x: -3, z: 0, rx: 2.5, rz: 2 },
    { x: 2, z: 0, rx: 2.5, rz: 2 },
  ],
  purification: [
    { x: 0, z: -1, rx: 2.5, rz: 2 },
    { x: -3, z: 2, rx: 1.5, rz: 1.5 },
  ],
  filling: [
    { x: 0, z: 0, rx: 3, rz: 2.5 },
    { x: -4, z: 2, rx: 1.5, rz: 1.5 },
  ],
  weighing: [{ x: 0, z: 0, rx: 2, rz: 2 }],
  "raw-materials": [
    { x: -3, z: -2, rx: 3, rz: 2 },
    { x: 3, z: 2, rx: 2, rz: 2 },
    { x: -4, z: 3, rx: 1.5, rz: 1.5 },
  ],
};

function isWalkable(
  x: number,
  z: number,
  halfW: number,
  halfD: number,
  obstacles: NavObstacle[],
): boolean {
  if (Math.abs(x) > halfW - 1.1 || Math.abs(z) > halfD - 1.1) return false;
  for (const o of obstacles) {
    if (Math.abs(x - o.x) < o.rx && Math.abs(z - o.z) < o.rz) return false;
  }
  return true;
}

type GridNode = { x: number; z: number; g: number; f: number; parent?: GridNode };

function heuristic(ax: number, az: number, bx: number, bz: number) {
  return Math.abs(ax - bx) + Math.abs(az - bz);
}

/** Grid A* path in area-local XZ plane. Returns world-offset waypoints from area origin. */
export function findNavPath(
  start: [number, number],
  end: [number, number],
  areaSize: [number, number],
  areaId: FactoryAreaId,
): THREE.Vector3[] {
  const [w, d] = areaSize;
  const hw = w / 2;
  const hd = d / 2;
  const obstacles = AREA_OBSTACLES[areaId] ?? [];

  const snap = (v: number) => Math.round(v / CELL) * CELL;
  const sx = snap(start[0]);
  const sz = snap(start[1]);
  const ex = snap(end[0]);
  const ez = snap(end[1]);

  if (
    !isWalkable(sx, sz, hw, hd, obstacles) ||
    !isWalkable(ex, ez, hw, hd, obstacles)
  ) {
    return [
      new THREE.Vector3(start[0], 0, start[1]),
      new THREE.Vector3(end[0], 0, end[1]),
    ];
  }

  const key = (x: number, z: number) => `${x},${z}`;
  const open = new Map<string, GridNode>();
  const closed = new Set<string>();

  const startNode: GridNode = { x: sx, z: sz, g: 0, f: heuristic(sx, sz, ex, ez) };
  open.set(key(sx, sz), startNode);

  const neighbors = [
    [CELL, 0],
    [-CELL, 0],
    [0, CELL],
    [0, -CELL],
  ] as const;

  while (open.size > 0) {
    let current: GridNode | null = null;
    let bestF = Infinity;
    for (const n of open.values()) {
      if (n.f < bestF) {
        bestF = n.f;
        current = n;
      }
    }
    if (!current) break;

    const ck = key(current.x, current.z);
    if (current.x === ex && current.z === ez) {
      const path: THREE.Vector3[] = [];
      let node: GridNode | undefined = current;
      while (node) {
        path.unshift(new THREE.Vector3(node.x, 0, node.z));
        node = node.parent;
      }
      return path.length > 1 ? path : [path[0]!, new THREE.Vector3(ex, 0, ez)];
    }

    open.delete(ck);
    closed.add(ck);

    for (const [dx, dz] of neighbors) {
      const nx = current.x + dx;
      const nz = current.z + dz;
      const nk = key(nx, nz);
      if (closed.has(nk) || !isWalkable(nx, nz, hw, hd, obstacles)) continue;

      const g = current.g + CELL;
      const existing = open.get(nk);
      if (!existing || g < existing.g) {
        open.set(nk, {
          x: nx,
          z: nz,
          g,
          f: g + heuristic(nx, nz, ex, ez),
          parent: current,
        });
      }
    }
  }

  return [
    new THREE.Vector3(start[0], 0, start[1]),
    new THREE.Vector3(end[0], 0, end[1]),
  ];
}

export function buildWorkerPatrolPath(
  startLocal: [number, number, number],
  patrolOffset: [number, number, number],
  areaSize: [number, number],
  areaId: FactoryAreaId,
): THREE.Vector3[] {
  const endLocal: [number, number] = [
    startLocal[0] + patrolOffset[0],
    startLocal[2] + patrolOffset[2],
  ];
  const forward = findNavPath(
    [startLocal[0], startLocal[2]],
    endLocal,
    areaSize,
    areaId,
  );
  const backward = [...forward].reverse();
  if (backward.length > 0) backward.shift();
  return [...forward, ...backward];
}

export function getAreaObstacles(areaId: FactoryAreaId): NavObstacle[] {
  return AREA_OBSTACLES[areaId] ?? [];
}
