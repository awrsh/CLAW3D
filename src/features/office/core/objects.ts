/**
 * Placeable object catalog mirrored from old-version ITEM_FOOTPRINT
 * (excluding structural wall/door).
 */

export type ObjectType =
  | "desk_cubicle"
  | "executive_desk"
  | "chair"
  | "round_table"
  | "table_rect"
  | "couch"
  | "couch_v"
  | "beanbag"
  | "bookshelf"
  | "plant"
  | "lamp"
  | "pingpong"
  | "computer"
  | "keyboard"
  | "mouse"
  | "mug"
  | "trash"
  | "clock"
  | "whiteboard"
  | "kanban_board"
  | "easel"
  | "coffee_machine"
  | "fridge"
  | "stove"
  | "microwave"
  | "sink"
  | "dishwasher"
  | "cabinet"
  | "wall_cabinet"
  | "vending"
  | "water_cooler"
  | "printer"
  | "atm"
  | "phone_booth"
  | "sms_booth"
  | "jukebox"
  | "server_rack"
  | "server_terminal"
  | "qa_terminal"
  | "device_rack"
  | "test_bench"
  | "treadmill"
  | "weight_bench"
  | "dumbbell_rack"
  | "kettlebell_rack"
  | "exercise_bike"
  | "rowing_machine"
  | "punching_bag"
  | "yoga_mat"
  | "wall_solid"
  | "wall_glass"
  | "wall_brick"
  | "wall_drywall"
  | "wall_partition"
  | "door";

export type ObjectCategory =
  | "work"
  | "lounge"
  | "decor"
  | "kitchen"
  | "tech"
  | "gym"
  | "structure";

export type PlacedObject = {
  /** Stable instance id — survives moves/swaps; never reuse across objects. */
  id: string;
  type: ObjectType;
  x: number;
  z: number;
  /** Height above the floor slab — for stacking (keyboard on desk). */
  elevation: number;
  rotationY: number;
  scale: number;
  /** Segment length in world units (walls / doors). */
  length: number;
};

export type ObjectCatalogItem = {
  type: ObjectType;
  label: string;
  category: ObjectCategory;
  footprint: [number, number];
  height: number;
  color: string;
  defaultScale: number;
  /** Can other small items sit on top of this? */
  providesSurface?: boolean;
  /** Prefer snapping onto a surface when dropped nearby. */
  sitsOnSurface?: boolean;
};

const SCALE = 0.018;

const SURFACE_PROVIDERS = new Set<ObjectType>([
  "desk_cubicle",
  "executive_desk",
  "table_rect",
  "round_table",
  "cabinet",
  "test_bench",
  "pingpong",
  "bookshelf",
]);

const SURFACE_SITTERS = new Set<ObjectType>([
  "keyboard",
  "mouse",
  "computer",
  "mug",
  "coffee_machine",
  "microwave",
  "printer",
  "plant",
  "lamp",
  "clock",
]);

function item(
  partial: Omit<ObjectCatalogItem, "providesSurface" | "sitsOnSurface">,
): ObjectCatalogItem {
  return {
    ...partial,
    providesSurface: SURFACE_PROVIDERS.has(partial.type),
    sitsOnSurface: SURFACE_SITTERS.has(partial.type),
  };
}

export const OBJECT_CATALOG: readonly ObjectCatalogItem[] = [
  item({ type: "desk_cubicle", label: "میز کابین", category: "work", footprint: [100, 55], height: 0.75, color: "#8b5e32", defaultScale: 1 }),
  item({ type: "executive_desk", label: "میز مدیریت", category: "work", footprint: [130, 65], height: 0.78, color: "#6b3c1a", defaultScale: 1 }),
  item({ type: "chair", label: "صندلی", category: "work", footprint: [24, 24], height: 0.55, color: "#4a5568", defaultScale: 1 }),
  item({ type: "table_rect", label: "میز مستطیل", category: "work", footprint: [80, 40], height: 0.72, color: "#7a5028", defaultScale: 1 }),
  item({ type: "round_table", label: "میز گرد", category: "work", footprint: [120, 120], height: 0.72, color: "#9a6332", defaultScale: 1 }),
  item({ type: "computer", label: "مانیتور", category: "work", footprint: [30, 20], height: 0.4, color: "#363c58", defaultScale: 1 }),
  item({ type: "keyboard", label: "کیبورد", category: "work", footprint: [30, 14], height: 0.04, color: "#2a2a32", defaultScale: 1 }),
  item({ type: "mouse", label: "ماوس", category: "work", footprint: [16, 10], height: 0.04, color: "#333842", defaultScale: 1 }),
  item({ type: "mug", label: "ماگ", category: "work", footprint: [14, 14], height: 0.12, color: "#c62828", defaultScale: 1 }),
  item({ type: "whiteboard", label: "وایت‌برد", category: "work", footprint: [10, 60], height: 1.2, color: "#f4f2ee", defaultScale: 1 }),
  item({ type: "kanban_board", label: "کانبان", category: "work", footprint: [130, 65], height: 1.1, color: "#8b5e32", defaultScale: 1 }),
  item({ type: "easel", label: "سه‌پایه", category: "work", footprint: [40, 40], height: 1.3, color: "#5d4037", defaultScale: 1 }),
  item({ type: "printer", label: "پرینتر", category: "work", footprint: [40, 35], height: 0.45, color: "#404858", defaultScale: 1 }),

  item({ type: "couch", label: "مبل", category: "lounge", footprint: [100, 40], height: 0.55, color: "#3d5575", defaultScale: 1 }),
  item({ type: "couch_v", label: "مبل عمودی", category: "lounge", footprint: [40, 80], height: 0.55, color: "#5a4870", defaultScale: 1 }),
  item({ type: "beanbag", label: "بین‌بگ", category: "lounge", footprint: [40, 40], height: 0.4, color: "#7c3aed", defaultScale: 1 }),
  item({ type: "pingpong", label: "پینگ‌پنگ", category: "lounge", footprint: [100, 60], height: 0.78, color: "#2d6048", defaultScale: 1 }),
  item({ type: "jukebox", label: "جوک‌باکس", category: "lounge", footprint: [60, 40], height: 1.2, color: "#b71c1c", defaultScale: 1 }),

  item({ type: "bookshelf", label: "قفسه کتاب", category: "decor", footprint: [80, 120], height: 1.5, color: "#5c3520", defaultScale: 1 }),
  item({ type: "plant", label: "گیاه", category: "decor", footprint: [24, 24], height: 0.7, color: "#43a047", defaultScale: 1 }),
  item({ type: "lamp", label: "چراغ", category: "decor", footprint: [30, 30], height: 1.2, color: "#c8a060", defaultScale: 1 }),
  item({ type: "trash", label: "سطل زباله", category: "decor", footprint: [20, 20], height: 0.35, color: "#546e7a", defaultScale: 1 }),
  item({ type: "clock", label: "ساعت", category: "decor", footprint: [20, 20], height: 0.25, color: "#eceff1", defaultScale: 1 }),

  item({ type: "coffee_machine", label: "قهوه‌ساز", category: "kitchen", footprint: [32, 34], height: 0.4, color: "#2d2d38", defaultScale: 1 }),
  item({ type: "fridge", label: "یخچال", category: "kitchen", footprint: [40, 80], height: 1.5, color: "#505a60", defaultScale: 1 }),
  item({ type: "stove", label: "اجاق", category: "kitchen", footprint: [40, 40], height: 0.85, color: "#37474f", defaultScale: 1 }),
  item({ type: "microwave", label: "مایکروویو", category: "kitchen", footprint: [30, 20], height: 0.28, color: "#455a64", defaultScale: 1 }),
  item({ type: "sink", label: "سینک", category: "kitchen", footprint: [40, 40], height: 0.85, color: "#90a4ae", defaultScale: 1 }),
  item({ type: "dishwasher", label: "ماشین ظرفشویی", category: "kitchen", footprint: [40, 40], height: 0.85, color: "#607d8b", defaultScale: 1 }),
  item({ type: "cabinet", label: "کابینت", category: "kitchen", footprint: [200, 40], height: 0.9, color: "#3c4248", defaultScale: 1 }),
  item({ type: "wall_cabinet", label: "کابینت دیواری", category: "kitchen", footprint: [80, 20], height: 0.5, color: "#455a64", defaultScale: 1 }),
  item({ type: "vending", label: "دستگاه فروش", category: "kitchen", footprint: [40, 60], height: 1.6, color: "#1565c0", defaultScale: 1 }),
  item({ type: "water_cooler", label: "آب‌سردکن", category: "kitchen", footprint: [20, 54], height: 1.2, color: "#3a5070", defaultScale: 1 }),

  item({ type: "atm", label: "خودپرداز", category: "tech", footprint: [42, 38], height: 1.3, color: "#1b5e20", defaultScale: 1 }),
  item({ type: "phone_booth", label: "باجه تلفن", category: "tech", footprint: [78, 72], height: 2.2, color: "#ef6c00", defaultScale: 1 }),
  item({ type: "sms_booth", label: "باجه پیام", category: "tech", footprint: [58, 54], height: 2.0, color: "#0277bd", defaultScale: 1 }),
  item({ type: "server_rack", label: "رک سرور", category: "tech", footprint: [45, 90], height: 1.8, color: "#263238", defaultScale: 1 }),
  item({ type: "server_terminal", label: "ترمینال سرور", category: "tech", footprint: [42, 34], height: 1.1, color: "#37474f", defaultScale: 1 }),
  item({ type: "qa_terminal", label: "ترمینال QA", category: "tech", footprint: [54, 38], height: 1.1, color: "#4a148c", defaultScale: 1 }),
  item({ type: "device_rack", label: "رک دستگاه", category: "tech", footprint: [70, 36], height: 1.2, color: "#311b92", defaultScale: 1 }),
  item({ type: "test_bench", label: "میز تست", category: "tech", footprint: [90, 42], height: 0.85, color: "#4527a0", defaultScale: 1 }),

  item({ type: "treadmill", label: "تردمیل", category: "gym", footprint: [70, 35], height: 1.1, color: "#212121", defaultScale: 1 }),
  item({ type: "weight_bench", label: "نیمکت وزنه", category: "gym", footprint: [90, 45], height: 0.55, color: "#b71c1c", defaultScale: 1 }),
  item({ type: "dumbbell_rack", label: "قفسه دمبل", category: "gym", footprint: [80, 28], height: 1.0, color: "#424242", defaultScale: 1 }),
  item({ type: "kettlebell_rack", label: "قفسه کتل‌بل", category: "gym", footprint: [70, 26], height: 0.7, color: "#616161", defaultScale: 1 }),
  item({ type: "exercise_bike", label: "دوچرخه ثابت", category: "gym", footprint: [45, 65], height: 1.1, color: "#0d47a1", defaultScale: 1 }),
  item({ type: "rowing_machine", label: "پارویی", category: "gym", footprint: [90, 34], height: 0.55, color: "#1565c0", defaultScale: 1 }),
  item({ type: "punching_bag", label: "کیسه بوکس", category: "gym", footprint: [28, 28], height: 1.5, color: "#4e342e", defaultScale: 1 }),
  item({ type: "yoga_mat", label: "مت یوگا", category: "gym", footprint: [70, 30], height: 0.03, color: "#0f766e", defaultScale: 1 }),

  // structure — interior walls & doors
  item({ type: "wall_solid", label: "دیوار ساده", category: "structure", footprint: [120, 8], height: 2.2, color: "#eef1f4", defaultScale: 1 }),
  item({ type: "wall_drywall", label: "دیوار گچی", category: "structure", footprint: [120, 8], height: 2.2, color: "#f2f4f6", defaultScale: 1 }),
  item({ type: "wall_brick", label: "دیوار آجری", category: "structure", footprint: [120, 10], height: 2.2, color: "#b7aea6", defaultScale: 1 }),
  item({ type: "wall_glass", label: "دیوار شیشه‌ای", category: "structure", footprint: [120, 6], height: 2.2, color: "#c5d8e8", defaultScale: 1 }),
  item({ type: "wall_partition", label: "پارتیشن", category: "structure", footprint: [100, 6], height: 1.35, color: "#d7dde3", defaultScale: 1 }),
  item({ type: "door", label: "در", category: "structure", footprint: [80, 10], height: 2.1, color: "#e8eaed", defaultScale: 1 }),
] as const;

export const OBJECT_CATEGORIES: { id: ObjectCategory; label: string }[] = [
  { id: "structure", label: "دیوار / در" },
  { id: "work", label: "کار" },
  { id: "lounge", label: "استراحت" },
  { id: "decor", label: "دکور" },
  { id: "kitchen", label: "آشپزخانه" },
  { id: "tech", label: "تک / سرور" },
  { id: "gym", label: "باشگاه" },
];

const CATALOG_BY_TYPE: Readonly<Record<ObjectType, ObjectCatalogItem>> =
  OBJECT_CATALOG.reduce(
    (acc, entry) => {
      acc[entry.type] = entry;
      return acc;
    },
    {} as Record<ObjectType, ObjectCatalogItem>,
  );

export const OBJECT_LIMITS = {
  x: { min: -80, max: 80, step: 0.1 },
  z: { min: -50, max: 50, step: 0.1 },
  elevation: { min: 0, max: 3, step: 0.02 },
  rotationY: { min: 0, max: 360, step: 15 },
  scale: { min: 0.4, max: 2.5, step: 0.05 },
  length: { min: 0.6, max: 40, step: 0.1 },
} as const;

export function isWallType(type: ObjectType): boolean {
  return (
    type === "wall_solid" ||
    type === "wall_glass" ||
    type === "wall_brick" ||
    type === "wall_drywall" ||
    type === "wall_partition" ||
    type === "door"
  );
}

export function isObjectType(value: string): value is ObjectType {
  return value in CATALOG_BY_TYPE;
}

const LEGACY_TYPE_MAP: Record<string, ObjectType> = {
  desk: "desk_cubicle",
  table: "round_table",
  box: "cabinet",
};

export function resolveObjectType(raw: string): ObjectType {
  if (isObjectType(raw)) return raw;
  return LEGACY_TYPE_MAP[raw] ?? "desk_cubicle";
}

export function getCatalogItem(type: ObjectType): ObjectCatalogItem {
  return CATALOG_BY_TYPE[type];
}

export function getObjectWorldSize(
  type: ObjectType,
  length?: number,
): {
  width: number;
  depth: number;
  height: number;
} {
  const entry = getCatalogItem(type);
  const defaultWidth = entry.footprint[0] * SCALE;
  return {
    width: length ?? defaultWidth,
    depth: entry.footprint[1] * SCALE,
    height: entry.height,
  };
}

export function getSurfaceTopY(object: PlacedObject): number {
  const size = getObjectWorldSize(object.type, object.length);
  return object.elevation + size.height * object.scale;
}

/** If `moving` can sit on a nearby surface provider, snap elevation to its top. */
export function snapOntoNearbySurface(
  moving: PlacedObject,
  others: PlacedObject[],
  options?: { force?: boolean },
): PlacedObject {
  const movingCatalog = getCatalogItem(moving.type);
  let best: { elevation: number; score: number } | null = null;

  for (const other of others) {
    if (other.id === moving.id) continue;
    const otherCatalog = getCatalogItem(other.type);
    if (!otherCatalog.providesSurface) continue;

    const size = getObjectWorldSize(other.type, other.length);
    const halfW = (size.width * other.scale) / 2 + 0.15;
    const halfD = (size.depth * other.scale) / 2 + 0.15;
    const dx = Math.abs(moving.x - other.x);
    const dz = Math.abs(moving.z - other.z);
    if (dx > halfW || dz > halfD) continue;

    const score = dx + dz;
    const elevation = getSurfaceTopY(other);
    if (!best || score < best.score) {
      best = { elevation, score };
    }
  }

  if (!best) return moving;
  if (
    !options?.force &&
    !movingCatalog.sitsOnSurface &&
    moving.elevation < 0.05
  ) {
    return moving;
  }
  return { ...moving, elevation: best.elevation };
}

let objectIdCounter = 0;

function randomIdSuffix(length = 8): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, length);
  }
  return Math.random().toString(36).slice(2, 2 + length);
}

/**
 * Create a unique object instance id.
 * Format: obj-{type}-{slug} — type helps grep; slug keeps instances distinct.
 */
export function createObjectId(type: ObjectType, slug?: string): string {
  objectIdCounter += 1;
  const cleanSlug = slug
    ? slug
        .replace(/^(tpl|obj)-/i, "")
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 32)
    : `${objectIdCounter.toString(36)}-${randomIdSuffix(6)}`;
  return `obj-${type}-${cleanSlug}`;
}

/** Short id for lists (full id stays in data + localStorage). */
export function formatObjectIdShort(id: string, max = 26): string {
  if (id.length <= max) return id;
  return `${id.slice(0, max - 7)}…${id.slice(-5)}`;
}

/** Guarantee every object on a floor has a distinct id. */
export function ensureUniqueObjectIds(objects: PlacedObject[]): PlacedObject[] {
  const seen = new Set<string>();
  return objects.map((object) => {
    let id =
      typeof object.id === "string" && object.id.trim().length > 0
        ? object.id.trim()
        : createObjectId(object.type);
    if (seen.has(id)) {
      id = createObjectId(object.type);
    }
    while (seen.has(id)) {
      id = createObjectId(object.type);
    }
    seen.add(id);
    return id === object.id ? object : { ...object, id };
  });
}

/**
 * Swap placement of two objects — ids (identity) stay put, only pose changes.
 */
export function swapPlacedObjectTransforms(
  objects: PlacedObject[],
  idA: string,
  idB: string,
): PlacedObject[] {
  const a = objects.find((object) => object.id === idA);
  const b = objects.find((object) => object.id === idB);
  if (!a || !b || a.id === b.id) return objects;
  return objects.map((object) => {
    if (object.id === idA) {
      return {
        ...object,
        x: b.x,
        z: b.z,
        elevation: b.elevation,
        rotationY: b.rotationY,
      };
    }
    if (object.id === idB) {
      return {
        ...object,
        x: a.x,
        z: a.z,
        elevation: a.elevation,
        rotationY: a.rotationY,
      };
    }
    return object;
  });
}

export function createPlacedObject(
  type: ObjectType,
  index: number,
  overrides: Partial<PlacedObject> = {},
): PlacedObject {
  const catalog = getCatalogItem(type);
  const offset = (index % 5) * 1.4;
  const defaultLength = catalog.footprint[0] * SCALE;
  const { id: idOverride, type: _typeOverride, ...rest } = overrides;
  return {
    id: idOverride ?? createObjectId(type),
    type,
    x: -4 + offset,
    z: -2 + (index % 3) * 1.2,
    elevation: 0,
    rotationY: 0,
    scale: catalog.defaultScale,
    length: defaultLength,
    ...rest,
  };
}

export function clonePlacedObjects(objects: PlacedObject[]): PlacedObject[] {
  return ensureUniqueObjectIds(
    objects.map((object) => ({
      ...object,
      id: createObjectId(object.type, `${object.id}-copy`),
    })),
  );
}

/**
 * Change furniture type but keep the same instance id (identity).
 * Useful when swapping “manager desk” visual for another type later.
 */
export function changePlacedObjectType(
  object: PlacedObject,
  nextType: ObjectType,
): PlacedObject {
  if (object.type === nextType) return object;
  const catalog = getCatalogItem(nextType);
  const defaultLength = catalog.footprint[0] * SCALE;
  return {
    ...object,
    type: nextType,
    scale: catalog.defaultScale,
    length: isWallType(nextType) ? object.length || defaultLength : defaultLength,
  };
}

export function getObjectLabel(type: ObjectType): string {
  return getCatalogItem(type).label;
}
