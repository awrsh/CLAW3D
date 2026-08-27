import {
  createObjectId,
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
  slug: string,
): PlacedObject {
  boundarySeq += 1;
  return createPlacedObject(type, boundarySeq, {
    id: createObjectId(type, slug),
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
  doorWidth = 2.4,
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
  const gap = Math.min(doorWidth, innerW * 0.5, innerD * 0.5);

  const items: PlacedObject[] = [];

  let wallSeq = 0;
  const nextSlug = (kind: string) => {
    wallSeq += 1;
    return `${kind}-${wallSeq}`;
  };

  const addHorizontal = (
    z: number,
    side: "n" | "s",
    withDoor: boolean,
  ) => {
    if (!withDoor) {
      items.push(wall(wallType, cx, z, fullW, 0, nextSlug(`wall-${side}`)));
      return;
    }
    const remain = (fullW - gap) / 2;
    items.push(
      wall(
        wallType,
        cx - gap / 2 - remain / 2,
        z,
        remain,
        0,
        nextSlug(`wall-${side}-a`),
      ),
    );
    items.push(
      wall(
        wallType,
        cx + gap / 2 + remain / 2,
        z,
        remain,
        0,
        nextSlug(`wall-${side}-b`),
      ),
    );
    items.push(wall("door", cx, z, gap, 0, nextSlug(`door-${side}`)));
  };

  const addVertical = (
    x: number,
    side: "e" | "w",
    withDoor: boolean,
  ) => {
    if (!withDoor) {
      items.push(wall(wallType, x, cz, fullD, 90, nextSlug(`wall-${side}`)));
      return;
    }
    const remain = (fullD - gap) / 2;
    items.push(
      wall(
        wallType,
        x,
        cz - gap / 2 - remain / 2,
        remain,
        90,
        nextSlug(`wall-${side}-a`),
      ),
    );
    items.push(
      wall(
        wallType,
        x,
        cz + gap / 2 + remain / 2,
        remain,
        90,
        nextSlug(`wall-${side}-b`),
      ),
    );
    items.push(wall("door", x, cz, gap, 90, nextSlug(`door-${side}`)));
  };

  addHorizontal(northZ, "n", doorSide === "n");
  addHorizontal(southZ, "s", doorSide === "s");
  addVertical(westX, "w", doorSide === "w");
  addVertical(eastX, "e", doorSide === "e");

  return items;
}

function normRot(rotationY: number): number {
  return ((rotationY % 360) + 360) % 360;
}

function isVerticalRot(rotationY: number): boolean {
  const rot = normRot(rotationY);
  return (rot > 45 && rot < 135) || (rot > 225 && rot < 315);
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

function sameWallLine(wall: PlacedObject, door: PlacedObject): boolean {
  if (door.type !== "door") return false;
  const wallVert = isVerticalRot(wall.rotationY);
  const doorVert = isVerticalRot(door.rotationY);
  if (wallVert !== doorVert) return false;
  if (wallVert) return Math.abs(wall.x - door.x) < 0.45;
  return Math.abs(wall.z - door.z) < 0.45;
}

/** True when the agent is within the door's open span along the wall. */
export function agentInDoorOpening(
  x: number,
  z: number,
  door: PlacedObject,
  inset = 0.02,
): boolean {
  if (door.type !== "door") return false;
  const halfOpen = Math.max(0.4, (door.length ?? 2) / 2 - inset);
  if (isVerticalRot(door.rotationY)) {
    return Math.abs(z - door.z) <= halfOpen;
  }
  return Math.abs(x - door.x) <= halfOpen;
}

export function pointInDoorClearing(
  x: number,
  z: number,
  objects: PlacedObject[],
): boolean {
  for (const object of objects) {
    if (object.type !== "door") continue;
    const halfOpen = Math.max(0.4, (object.length ?? 2) / 2);
    const thick = 0.9;
    if (isVerticalRot(object.rotationY)) {
      if (
        Math.abs(x - object.x) <= thick &&
        Math.abs(z - object.z) <= halfOpen
      ) {
        return true;
      }
    } else if (
      Math.abs(z - object.z) <= thick &&
      Math.abs(x - object.x) <= halfOpen
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Circle vs wall AABB, but door openings on the same wall line never block.
 * This is what stops agents from snagging on door jambs.
 */
export function pointHitsBlockers(
  x: number,
  z: number,
  radius: number,
  objects: PlacedObject[],
): boolean {
  if (pointInDoorClearing(x, z, objects)) return false;

  const doors = objects.filter((object) => object.type === "door");

  for (const object of objects) {
    const box = getBlockingAabb(object);
    if (!box) continue;
    if (
      !(
        x + radius > box.minX &&
        x - radius < box.maxX &&
        z + radius > box.minZ &&
        z - radius < box.maxZ
      )
    ) {
      continue;
    }

    // Jamb fix: if we're aligned with a door opening on this wall, ignore.
    const passesDoor = doors.some(
      (door) =>
        sameWallLine(object, door) && agentInDoorOpening(x, z, door, 0),
    );
    if (passesDoor) continue;

    return true;
  }
  return false;
}

/** Nearest door center within maxDist, or null. */
export function findNearbyDoor(
  x: number,
  z: number,
  objects: PlacedObject[],
  maxDist = 2.2,
): PlacedObject | null {
  let best: PlacedObject | null = null;
  let bestDist = maxDist;
  for (const object of objects) {
    if (object.type !== "door") continue;
    const dist = Math.hypot(object.x - x, object.z - z);
    if (dist < bestDist) {
      best = object;
      bestDist = dist;
    }
  }
  return best;
}
