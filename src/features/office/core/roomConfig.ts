/** Building + floor config — editable from Tools, no gateway. */

import {
  cloneAgents,
  type OfficeAgent,
} from "@/features/office/core/agents";
import {
  clonePlacedObjects,
  createPlacedObject,
  resolveObjectType,
  type PlacedObject,
} from "@/features/office/core/objects";

export type { PlacedObject, ObjectType } from "@/features/office/core/objects";
export type { OfficeAgent } from "@/features/office/core/agents";
export type { RoomPresetId } from "@/features/office/core/roomPresets";
export { ROOM_PRESETS, getRoomPreset } from "@/features/office/core/roomPresets";

export type FloorConfig = {
  id: string;
  label: string;
  width: number;
  depth: number;
  wallHeight: number;
  wallThickness: number;
  floorColor: string;
  wallColor: string;
  showFloorGrain: boolean;
  objects: PlacedObject[];
  agents: OfficeAgent[];
};

export type StructureConfig = {
  /** راه‌پله بین طبقات */
  showStairs: boolean;
  /** ستون‌های گوشه که طبقات را به هم وصل می‌کنند */
  showColumns: boolean;
  /** گوشهٔ قرارگیری راه‌پله */
  stairsCorner: "ne" | "nw" | "se" | "sw";
  /** شعاع ستون */
  columnRadius: number;
};

export type LightingMode = "day" | "evening" | "night";

export type BuildingConfig = {
  floors: FloorConfig[];
  activeFloorId: string;
  /** فاصلهٔ عمودی مرکز کف‌ها (فاصلهٔ طبقات) */
  floorSpacing: number;
  /** همهٔ طبقات روی هم دیده شوند یا فقط طبقهٔ فعال */
  showAllFloors: boolean;
  structure: StructureConfig;
  /** ابجکت انتخاب‌شده در Tools (روی طبقهٔ فعال) */
  selectedObjectId: string | null;
  snapToGrid: boolean;
  snapToWall: boolean;
  lightingMode: LightingMode;
  lampsOn: boolean;
  muteSfx: boolean;
};

const baseRoom = {
  width: 64.8,
  depth: 34.56,
  wallHeight: 2.2,
  wallThickness: 0.12,
  showFloorGrain: true,
  objects: [] as PlacedObject[],
  agents: [] as OfficeAgent[],
};

export const DEFAULT_STRUCTURE: StructureConfig = {
  showStairs: true,
  showColumns: true,
  stairsCorner: "se",
  columnRadius: 0.28,
};

export const DEFAULT_BUILDING: BuildingConfig = {
  floors: [
    {
      id: "floor-0",
      label: "طبقه ۰ — همکف",
      ...baseRoom,
      floorColor: "#c8a97e",
      wallColor: "#8d6e63",
      objects: [],
    },
  ],
  activeFloorId: "floor-0",
  floorSpacing: 4,
  showAllFloors: true,
  structure: DEFAULT_STRUCTURE,
  selectedObjectId: null,
  snapToGrid: true,
  snapToWall: false,
  lightingMode: "day",
  lampsOn: true,
  muteSfx: false,
};

/** Limits used by the Tools panel sliders. */
export const ROOM_LIMITS = {
  width: { min: 4, max: 120, step: 0.5 },
  depth: { min: 4, max: 80, step: 0.5 },
  wallHeight: { min: 0.3, max: 6, step: 0.05 },
  wallThickness: { min: 0.04, max: 1, step: 0.01 },
  floorSpacing: { min: 2, max: 20, step: 0.25 },
  columnRadius: { min: 0.1, max: 1.2, step: 0.02 },
} as const;

export const MAX_FLOORS = 8;

export const STORAGE_KEY = "claw3d-sample-building-v7";

export const CAMERA_OFFSET: [number, number, number] = [22, 28, 28];
export const CAMERA_ZOOM = 28;

const FLOOR_PALETTE = [
  { floorColor: "#c8a97e", wallColor: "#8d6e63" },
  { floorColor: "#a8b89a", wallColor: "#6d7f6a" },
  { floorColor: "#b8a090", wallColor: "#7a6558" },
  { floorColor: "#9aa8b8", wallColor: "#5f6d7c" },
  { floorColor: "#c4a878", wallColor: "#8a7358" },
  { floorColor: "#a898a8", wallColor: "#6f5f6f" },
  { floorColor: "#98b8a8", wallColor: "#5a7a6a" },
  { floorColor: "#b8a8a0", wallColor: "#7a6a62" },
] as const;

export function createFloor(index: number): FloorConfig {
  const colors = FLOOR_PALETTE[index % FLOOR_PALETTE.length];
  return {
    id: `floor-${Date.now()}-${index}`,
    label: `طبقه ${index}`,
    ...baseRoom,
    objects: [],
    agents: [],
    ...colors,
  };
}

/** Deep-copy the active floor (layout + objects) as a new story. */
export function duplicateFloor(
  building: BuildingConfig,
  floorId: string,
): BuildingConfig | null {
  if (building.floors.length >= MAX_FLOORS) return null;
  const source = building.floors.find((floor) => floor.id === floorId);
  if (!source) return null;
  const index = building.floors.findIndex((floor) => floor.id === floorId);
  const copy: FloorConfig = {
    ...source,
    id: `floor-${Date.now()}-copy`,
    label: `${source.label} (کپی)`,
    objects: clonePlacedObjects(source.objects),
    agents: cloneAgents(source.agents ?? []),
  };
  const floors = [
    ...building.floors.slice(0, index + 1),
    copy,
    ...building.floors.slice(index + 1),
  ];
  return {
    ...building,
    floors,
    activeFloorId: copy.id,
    selectedObjectId: null,
    structure: {
      ...building.structure,
      showStairs: true,
      showColumns: true,
    },
  };
}

/** Replace objects on a floor with a ready-made room preset. */
export function applyPresetToFloor(
  building: BuildingConfig,
  floorId: string,
  objects: PlacedObject[],
  agents: OfficeAgent[] = [],
  label?: string,
): BuildingConfig {
  return {
    ...building,
    floors: building.floors.map((floor) =>
      floor.id !== floorId
        ? floor
        : {
            ...floor,
            label: label ?? floor.label,
            objects: clonePlacedObjects(objects),
            agents: cloneAgents(agents),
          },
    ),
    selectedObjectId: null,
  };
}

export function getActiveFloor(building: BuildingConfig): FloorConfig {
  return (
    building.floors.find((floor) => floor.id === building.activeFloorId) ??
    building.floors[0]!
  );
}

export function getFloorWorldY(
  building: BuildingConfig,
  floorId: string,
): number {
  const index = building.floors.findIndex((floor) => floor.id === floorId);
  return Math.max(0, index) * building.floorSpacing;
}

export function getSelectedObject(
  building: BuildingConfig,
): PlacedObject | null {
  const floor = getActiveFloor(building);
  if (!building.selectedObjectId) return null;
  return (
    floor.objects.find((object) => object.id === building.selectedObjectId) ??
    null
  );
}

function normalizeObjects(raw: unknown): PlacedObject[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const object = item as Partial<PlacedObject> & { type?: string };
    const type = resolveObjectType(object.type ?? "desk_cubicle");
    const fallback = createPlacedObject(type, index);
    return {
      ...fallback,
      ...object,
      id: typeof object.id === "string" ? object.id : fallback.id,
      type,
      x: typeof object.x === "number" ? object.x : fallback.x,
      z: typeof object.z === "number" ? object.z : fallback.z,
      elevation:
        typeof object.elevation === "number" ? object.elevation : 0,
      length:
        typeof object.length === "number"
          ? object.length
          : fallback.length,
      rotationY:
        typeof object.rotationY === "number"
          ? object.rotationY
          : fallback.rotationY,
      scale: typeof object.scale === "number" ? object.scale : fallback.scale,
    } satisfies PlacedObject;
  });
}

function normalizeAgents(raw: unknown): OfficeAgent[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const agent = item as Partial<OfficeAgent>;
    const x = typeof agent.x === "number" ? agent.x : 0;
    const z = typeof agent.z === "number" ? agent.z : 0;
    return {
      id: typeof agent.id === "string" ? agent.id : `agent-${index}`,
      name:
        typeof agent.name === "string" ? agent.name : `کاراکتر ${index + 1}`,
      color: typeof agent.color === "string" ? agent.color : "#4fc3f7",
      x,
      z,
      facing: typeof agent.facing === "number" ? agent.facing : 0,
      state: agent.state ?? "idle",
      roam: agent.roam !== false,
      homeX: typeof agent.homeX === "number" ? agent.homeX : x,
      homeZ: typeof agent.homeZ === "number" ? agent.homeZ : z,
    } satisfies OfficeAgent;
  });
}

function normalizeStructure(raw: unknown): StructureConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_STRUCTURE;
  const data = raw as Partial<StructureConfig>;
  return {
    showStairs:
      typeof data.showStairs === "boolean"
        ? data.showStairs
        : DEFAULT_STRUCTURE.showStairs,
    showColumns:
      typeof data.showColumns === "boolean"
        ? data.showColumns
        : DEFAULT_STRUCTURE.showColumns,
    stairsCorner:
      data.stairsCorner === "ne" ||
      data.stairsCorner === "nw" ||
      data.stairsCorner === "se" ||
      data.stairsCorner === "sw"
        ? data.stairsCorner
        : DEFAULT_STRUCTURE.stairsCorner,
    columnRadius:
      typeof data.columnRadius === "number"
        ? data.columnRadius
        : DEFAULT_STRUCTURE.columnRadius,
  };
}

/** Migrate old storage into current building shape. */
export function normalizeBuilding(raw: unknown): BuildingConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_BUILDING;
  const data = raw as Record<string, unknown>;

  if (Array.isArray(data.floors) && data.floors.length > 0) {
    const floors = data.floors.map((item, index) => {
      const floor = item as Partial<FloorConfig>;
      return {
        ...createFloor(index),
        ...floor,
        id: typeof floor.id === "string" ? floor.id : `floor-${index}`,
        label:
          typeof floor.label === "string" ? floor.label : `طبقه ${index}`,
        objects: normalizeObjects(floor.objects),
        agents: normalizeAgents(
          (floor as Partial<FloorConfig>).agents,
        ),
      } satisfies FloorConfig;
    });
    const activeFloorId =
      typeof data.activeFloorId === "string" &&
      floors.some((floor) => floor.id === data.activeFloorId)
        ? data.activeFloorId
        : floors[0]!.id;
    return {
      floors,
      activeFloorId,
      floorSpacing:
        typeof data.floorSpacing === "number"
          ? data.floorSpacing
          : DEFAULT_BUILDING.floorSpacing,
      showAllFloors:
        typeof data.showAllFloors === "boolean"
          ? data.showAllFloors
          : DEFAULT_BUILDING.showAllFloors,
      structure: normalizeStructure(data.structure),
      selectedObjectId:
        typeof data.selectedObjectId === "string"
          ? data.selectedObjectId
          : null,
      snapToGrid:
        typeof data.snapToGrid === "boolean"
          ? data.snapToGrid
          : DEFAULT_BUILDING.snapToGrid,
      snapToWall:
        typeof data.snapToWall === "boolean"
          ? data.snapToWall
          : DEFAULT_BUILDING.snapToWall,
      lightingMode:
        data.lightingMode === "day" ||
        data.lightingMode === "evening" ||
        data.lightingMode === "night"
          ? data.lightingMode
          : DEFAULT_BUILDING.lightingMode,
      lampsOn:
        typeof data.lampsOn === "boolean"
          ? data.lampsOn
          : DEFAULT_BUILDING.lampsOn,
      muteSfx:
        typeof data.muteSfx === "boolean"
          ? data.muteSfx
          : DEFAULT_BUILDING.muteSfx,
    };
  }

  if ("width" in data) {
    const floor: FloorConfig = {
      ...createFloor(0),
      ...(data as Partial<FloorConfig>),
      id: "floor-0",
      label: "طبقه ۰ — همکف",
      objects: normalizeObjects((data as Partial<FloorConfig>).objects),
      agents: normalizeAgents((data as Partial<FloorConfig>).agents),
    };
    return {
      ...DEFAULT_BUILDING,
      floors: [floor],
      activeFloorId: floor.id,
    };
  }

  return DEFAULT_BUILDING;
}
