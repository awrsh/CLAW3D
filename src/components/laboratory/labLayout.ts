import * as THREE from "three";

/** Expanded pharmaceutical R&D floor plan */
export const LAB_LAYOUT = {
  width: 36,
  depth: 26,
  height: 4.8,
  glassPartitionHeight: 2.6,
} as const;

export const LAYOUT = {
  airlockEntry: new THREE.Vector3(15.5, 0, 11.5),
  airlockInside: new THREE.Vector3(13.2, 0, 9.8),

  bioreactorMain: [-12, 0, -2] as const,
  bioreactorSecondary: [-17, 0, -5] as const,
  singleUseMixer: [-8, 0, -7] as const,
  centrifuge: [-10, 0, 4] as const,
  chromatography: [-16, 0, 3] as const,

  workstation: [11, 0, 7] as const,
  fumeHood: [6, 0, 10] as const,
  incubator: [15, 0, 5] as const,

  labCabinet: [13, 0, -7] as const,
  autoclave: [17, 0, -9] as const,

  scadaWall: [-10, 2.35, -11.8] as const,
  heroWallZ: -LAB_LAYOUT.depth / 2 + 0.06,
} as const;

/** Axis-aligned keep-out zones — inspector must not enter these. */
export const EQUIPMENT_OBSTACLES: Array<{
  x: number;
  z: number;
  halfW: number;
  halfD: number;
}> = [
  { x: -12, z: -2, halfW: 2.4, halfD: 2.2 },
  { x: -17, z: -5, halfW: 2.0, halfD: 1.9 },
  { x: -8, z: -7, halfW: 1.3, halfD: 1.1 },
  { x: -10, z: 4, halfW: 1.0, halfD: 1.0 },
  { x: -16, z: 3, halfW: 1.4, halfD: 1.0 },
  { x: 11, z: 7, halfW: 1.8, halfD: 1.2 },
  { x: 6, z: 10, halfW: 1.5, halfD: 1.1 },
  { x: 15, z: 5, halfW: 1.1, halfD: 1.0 },
  { x: 13, z: -7, halfW: 1.2, halfD: 0.8 },
  { x: 17, z: -9, halfW: 1.0, halfD: 1.0 },
  { x: -10, z: -11.5, halfW: 2.0, halfD: 0.5 },
];

export type PatrolNode = {
  position: THREE.Vector3;
  kind: "walk" | "check";
  lookAt?: THREE.Vector3;
  label?: string;
  dwellSec?: number;
};

function v(x: number, z: number) {
  return new THREE.Vector3(x, 0, z);
}

function look(x: number, y: number, z: number) {
  return new THREE.Vector3(x, y, z);
}

/**
 * Corridor-only patrol — follows walkways around equipment, never through machines.
 */
export function buildPatrolRoute(): PatrolNode[] {
  const [bA, bB, mix, cent, chrom, ws, hood, inc, cab, auto] = [
    LAYOUT.bioreactorMain,
    LAYOUT.bioreactorSecondary,
    LAYOUT.singleUseMixer,
    LAYOUT.centrifuge,
    LAYOUT.chromatography,
    LAYOUT.workstation,
    LAYOUT.fumeHood,
    LAYOUT.incubator,
    LAYOUT.labCabinet,
    LAYOUT.autoclave,
  ];

  return [
    { position: LAYOUT.airlockEntry.clone(), kind: "walk" },
    { position: LAYOUT.airlockInside.clone(), kind: "walk" },
    // Main corridor (front of lab)
    { position: v(11, 9), kind: "walk" },
    { position: v(7, 9), kind: "walk" },
    { position: v(3, 8.5), kind: "walk" },
    { position: v(0, 7.5), kind: "walk" },
    // Bioprocessing aisle (south side — clear of vessels)
    { position: v(-2, 6), kind: "walk" },
    { position: v(-4, 4.5), kind: "walk" },
    {
      position: v(-5.5, 3.2),
      kind: "check",
      lookAt: look(bA[0], 1.6, bA[2]),
      label: "Bioreactor A",
      dwellSec: 4.5,
    },
    { position: v(-6, 1.5), kind: "walk" },
    { position: v(-8, 0.5), kind: "walk" },
    {
      position: v(-9.5, -0.2),
      kind: "check",
      lookAt: look(cent[0], 1.0, cent[2]),
      label: "Centrifuge",
      dwellSec: 3.5,
    },
    { position: v(-11, -0.5), kind: "walk" },
    {
      position: v(-12.5, -1.5),
      kind: "check",
      lookAt: look(bB[0], 1.4, bB[2]),
      label: "Bioreactor B",
      dwellSec: 4,
    },
    { position: v(-10, -3), kind: "walk" },
    {
      position: v(-7.5, -4.5),
      kind: "check",
      lookAt: look(chrom[0], 1.2, chrom[2]),
      label: "Chromatography",
      dwellSec: 3.5,
    },
    { position: v(-5.5, -5.5), kind: "walk" },
    {
      position: v(-4.5, -6.5),
      kind: "check",
      lookAt: look(mix[0], 1.3, mix[2]),
      label: "Single-Use Mixer",
      dwellSec: 4,
    },
    // Return via north walkway to SCADA
    { position: v(-4, -2), kind: "walk" },
    { position: v(-5, 1), kind: "walk" },
    { position: v(-6, 4), kind: "walk" },
    {
      position: v(-7, 6),
      kind: "check",
      lookAt: look(LAYOUT.scadaWall[0], LAYOUT.scadaWall[1], LAYOUT.scadaWall[2]),
      label: "SCADA Panel",
      dwellSec: 3.5,
    },
    // Research zone — east corridor
    { position: v(-2, 7), kind: "walk" },
    { position: v(2, 8), kind: "walk" },
    { position: v(5, 9), kind: "walk" },
    {
      position: v(4.5, 8.2),
      kind: "check",
      lookAt: look(hood[0], 1.6, hood[2]),
      label: "Fume Hood",
      dwellSec: 4,
    },
    { position: v(7, 7.5), kind: "walk" },
    {
      position: v(8.5, 6.8),
      kind: "check",
      lookAt: look(ws[0], 1.0, ws[2]),
      label: "Microscope Station",
      dwellSec: 4,
    },
    { position: v(11, 6), kind: "walk" },
    {
      position: v(12.5, 5.5),
      kind: "check",
      lookAt: look(inc[0], 1.2, inc[2]),
      label: "Incubator",
      dwellSec: 3.5,
    },
    // Storage aisle (rear east)
    { position: v(12, 2), kind: "walk" },
    { position: v(12, -1), kind: "walk" },
    { position: v(11, -4), kind: "walk" },
    {
      position: v(10, -5.5),
      kind: "check",
      lookAt: look(cab[0], 1.2, cab[2]),
      label: "Cold Storage",
      dwellSec: 3.5,
    },
    { position: v(12, -7), kind: "walk" },
    {
      position: v(14, -8.5),
      kind: "check",
      lookAt: look(auto[0], 1.1, auto[2]),
      label: "Autoclave",
      dwellSec: 3.5,
    },
    // Exit via airlock corridor
    { position: v(13, -2), kind: "walk" },
    { position: v(14, 2), kind: "walk" },
    { position: v(14.5, 6), kind: "walk" },
    { position: v(15, 9), kind: "walk" },
    { position: LAYOUT.airlockInside.clone(), kind: "walk" },
    { position: LAYOUT.airlockEntry.clone(), kind: "walk" },
  ];
}

export const PATROL_ROUTE = buildPatrolRoute();

export function pushOutOfObstacles(position: THREE.Vector3, margin = 0.35) {
  for (const box of EQUIPMENT_OBSTACLES) {
    const dx = position.x - box.x;
    const dz = position.z - box.z;
    const overlapX = box.halfW + margin - Math.abs(dx);
    const overlapZ = box.halfD + margin - Math.abs(dz);
    if (overlapX > 0 && overlapZ > 0) {
      if (overlapX < overlapZ) {
        position.x += dx > 0 ? overlapX : -overlapX;
      } else {
        position.z += dz > 0 ? overlapZ : -overlapZ;
      }
    }
  }
}

/** Visible walkway strips (for floor marking) */
export const WALKWAY_STRIPS: Array<{
  position: [number, number, number];
  size: [number, number];
}> = [
  { position: [4, 0.003, 8.8], size: [22, 1.8] },
  { position: [-6, 0.003, 2], size: [1.8, 14] },
  { position: [10, 0.003, -3], size: [1.6, 10] },
  { position: [13, 0.003, 9.5], size: [1.4, 5] },
];
