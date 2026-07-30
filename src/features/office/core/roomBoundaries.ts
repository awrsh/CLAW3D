import {
  createPlacedObject,
  type ObjectType,
  type PlacedObject,
} from "@/features/office/core/objects";

export type DoorSide = "n" | "s" | "e" | "w";

type BoundaryOptions = {
  cx?: number;
  cz?: number;
  /** Inner clear width (X). */
  innerW: number;
  /** Inner clear depth (Z). */
  innerD: number;
  wallType?: Extract<
    ObjectType,
    | "wall_solid"
    | "wall_glass"
    | "wall_brick"
    | "wall_drywall"
    | "wall_partition"
  >;
  doorSide?: DoorSide;
  doorWidth?: number;
};

let boundarySeq = 0;

function wall(
  type: ObjectType,
  x: number,
  z: number,
  length: number,
  rotationY: number,
): PlacedObject {
  boundarySeq += 1;
  return createPlacedObject(type, boundarySeq, {
    x,
    z,
    rotationY,
    length,
    elevation: 0,
    scale: 1,
  });
}

/**
 * Axis-aligned room enclosure with an optional door gap.
 * Walls sit on the perimeter so furniture stays inside.
 */
export function createRoomBoundary({
  cx = 0,
  cz = 0,
  innerW,
  innerD,
  wallType = "wall_drywall",
  doorSide = "s",
  doorWidth = 1.6,
}: BoundaryOptions): PlacedObject[] {
  const thickness = 0.14;
  const halfW = innerW / 2;
  const halfD = innerD / 2;
  const northZ = cz - halfD - thickness / 2;
  const southZ = cz + halfD + thickness / 2;
  const westX = cx - halfW - thickness / 2;
  const eastX = cx + halfW + thickness / 2;
  const fullW = innerW + thickness * 2;
  const fullD = innerD + thickness * 2;
  const gap = Math.min(doorWidth, innerW * 0.45, innerD * 0.45);

  const items: PlacedObject[] = [];

  const addHorizontal = (
    z: number,
    side: "n" | "s",
    withDoor: boolean,
  ) => {
    if (!withDoor) {
      items.push(wall(wallType, cx, z, fullW, 0));
      return;
    }
    const remain = (fullW - gap) / 2;
    items.push(wall(wallType, cx - gap / 2 - remain / 2, z, remain, 0));
    items.push(wall(wallType, cx + gap / 2 + remain / 2, z, remain, 0));
    items.push(wall("door", cx, z, gap, 0));
  };

  const addVertical = (
    x: number,
    side: "e" | "w",
    withDoor: boolean,
  ) => {
    if (!withDoor) {
      items.push(wall(wallType, x, cz, fullD, 90));
      return;
    }
    const remain = (fullD - gap) / 2;
    items.push(wall(wallType, x, cz - gap / 2 - remain / 2, remain, 90));
    items.push(wall(wallType, x, cz + gap / 2 + remain / 2, remain, 90));
    items.push(wall("door", x, cz, gap, 90));
  };

  addHorizontal(northZ, "n", doorSide === "n");
  addHorizontal(southZ, "s", doorSide === "s");
  addVertical(westX, "w", doorSide === "w");
  addVertical(eastX, "e", doorSide === "e");

  return items;
}

/** AABB for movement blocking (walls block, doors do not). */
export function getBlockingAabb(object: PlacedObject): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
} | null {
  if (
    object.type !== "wall_solid" &&
    object.type !== "wall_glass" &&
    object.type !== "wall_brick" &&
    object.type !== "wall_drywall" &&
    object.type !== "wall_partition"
  ) {
    return null;
  }
  const length = object.length ?? 2;
  const thickness = 0.14 * object.scale;
  const rad = (object.rotationY * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const halfX = (length * cos + thickness * sin) / 2;
  const halfZ = (length * sin + thickness * cos) / 2;
  return {
    minX: object.x - halfX,
    maxX: object.x + halfX,
    minZ: object.z - halfZ,
    maxZ: object.z + halfZ,
  };
}

export function pointHitsBlockers(
  x: number,
  z: number,
  radius: number,
  objects: PlacedObject[],
): boolean {
  for (const object of objects) {
    const box = getBlockingAabb(object);
    if (!box) continue;
    if (
      x + radius > box.minX &&
      x - radius < box.maxX &&
      z + radius > box.minZ &&
      z - radius < box.maxZ
    ) {
      return true;
    }
  }
  return false;
}
