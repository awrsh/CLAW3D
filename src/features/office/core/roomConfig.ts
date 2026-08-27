/** Building + floor config — editable from Tools, no gateway. */

import {
  cloneAgents,
  type OfficeAgent,
} from "@/features/office/core/agents";
import {
  clonePlacedObjects,
  createPlacedObject,
  ensureUniqueObjectIds,
  resolveObjectType,
  type ObjectType,
  type PlacedObject,
} from "@/features/office/core/objects";

export type { PlacedObject, ObjectType } from "@/features/office/core/objects";
export type { OfficeAgent } from "@/features/office/core/agents";
export type { RoomPresetId } from "@/features/office/core/roomPresets";
export { ROOM_PRESETS, getRoomPreset } from "@/features/office/core/roomPresets";
import { fitPresetToWorkspace } from "@/features/office/core/roomPresets";

export type WorkspaceShape = "rectangle" | "square";

export type WorkspaceUnit = {
  id: string;
  label: string;
  shape: WorkspaceShape;
  /** Center on the floor XZ plane. */
  x: number;
  z: number;
  width: number;
  depth: number;
  floorColor: string;
  wallColor: string;
  /** When true, draw a simple 4-wall enclosure around the unit. */
  withWalls: boolean;
};

export type DrawMode = "none" | "workspace" | "wall";

export type DrawWallType = Extract<
  ObjectType,
  | "wall_solid"
  | "wall_glass"
  | "wall_brick"
  | "wall_drywall"
  | "wall_partition"
  | "door"
>;

export function isDrawWallType(type: ObjectType): type is DrawWallType {
  return (
    type === "wall_solid" ||
    type === "wall_glass" ||
    type === "wall_brick" ||
    type === "wall_drywall" ||
    type === "wall_partition" ||
    type === "door"
  );
}

function normalizeDrawWallType(raw: unknown): DrawWallType {
  if (
    raw === "wall_solid" ||
    raw === "wall_glass" ||
    raw === "wall_brick" ||
    raw === "wall_drywall" ||
    raw === "wall_partition" ||
    raw === "door"
  ) {
    return raw;
  }
  return "wall_drywall";
}

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
  /** Drawn workspace units on this floor (empty = single full-floor slab). */
  workspaces: WorkspaceUnit[];
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
  /** واحد کاری انتخاب‌شده */
  selectedWorkspaceId: string | null;
  snapToGrid: boolean;
  snapToWall: boolean;
  lightingMode: LightingMode;
  lampsOn: boolean;
  muteSfx: boolean;
  /** When false, scene is view-only — no accidental object moves. */
  editMode: boolean;
  /** On-canvas draw tool mode. */
  drawMode: DrawMode;
  workspaceShape: WorkspaceShape;
  workspaceWithWalls: boolean;
  /** Wall/door type used when drawMode === "wall". */
  drawWallType: DrawWallType;
};

const baseRoom = {
  width: 64.8,
  depth: 34.56,
  wallHeight: 2.2,
  wallThickness: 0.12,
  showFloorGrain: true,
  objects: [] as PlacedObject[],
  agents: [] as OfficeAgent[],
  workspaces: [] as WorkspaceUnit[],
};

export const WORKSPACE_LIMITS = {
  width: { min: 1, max: 80, step: 0.5 },
  depth: { min: 1, max: 60, step: 0.5 },
} as const;

const WORKSPACE_PALETTE = [
  { floorColor: "#c9d2dc", wallColor: "#e8eef4" },
  { floorColor: "#d2d8cf", wallColor: "#eef4ef" },
  { floorColor: "#d8d2cb", wallColor: "#f3efe9" },
  { floorColor: "#cfd0d8", wallColor: "#eceef4" },
] as const;

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
      floorColor: "#d5d8dc",
      wallColor: "#eef1f4",
      objects: [],
      workspaces: [],
    },
  ],
  activeFloorId: "floor-0",
  floorSpacing: 4,
  showAllFloors: true,
  structure: DEFAULT_STRUCTURE,
  selectedObjectId: null,
  selectedWorkspaceId: null,
  snapToGrid: true,
  snapToWall: false,
  lightingMode: "day",
  lampsOn: true,
  muteSfx: false,
  editMode: false,
  drawMode: "none",
  workspaceShape: "rectangle",
  workspaceWithWalls: true,
  drawWallType: "wall_drywall",
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

export const STORAGE_KEY = "claw3d-sample-building-v9";

export const CAMERA_OFFSET: [number, number, number] = [22, 28, 28];
export const CAMERA_ZOOM = 28;

const FLOOR_PALETTE = [
  { floorColor: "#d5d8dc", wallColor: "#eef1f4" },
  { floorColor: "#cfd6cf", wallColor: "#f4f6f5" },
  { floorColor: "#d8d2cb", wallColor: "#f5f2ef" },
  { floorColor: "#c9d0d8", wallColor: "#e9eef4" },
  { floorColor: "#d2d2d6", wallColor: "#f0f0f3" },
  { floorColor: "#c8d4d8", wallColor: "#eef5f6" },
  { floorColor: "#d6d0d4", wallColor: "#f5f0f3" },
  { floorColor: "#cfd3c8", wallColor: "#f2f4ef" },
] as const;

export function createFloor(index: number): FloorConfig {
  const colors = FLOOR_PALETTE[index % FLOOR_PALETTE.length];
  return {
    id: `floor-${Date.now()}-${index}`,
    label: `طبقه ${index}`,
    ...baseRoom,
    objects: [],
    agents: [],
    workspaces: [],
    ...colors,
  };
}

export function createWorkspaceUnit(
  index: number,
  partial: Partial<WorkspaceUnit> &
    Pick<WorkspaceUnit, "x" | "z" | "width" | "depth" | "shape">,
): WorkspaceUnit {
  const colors = WORKSPACE_PALETTE[index % WORKSPACE_PALETTE.length]!;
  return {
    id: `workspace-${Date.now()}-${index}`,
    label: `واحد ${index + 1}`,
    floorColor: colors.floorColor,
    wallColor: colors.wallColor,
    withWalls: true,
    ...partial,
    width: Math.max(WORKSPACE_LIMITS.width.min, partial.width),
    depth: Math.max(WORKSPACE_LIMITS.depth.min, partial.depth),
  };
}

export function cloneWorkspaces(workspaces: WorkspaceUnit[]): WorkspaceUnit[] {
  return workspaces.map((unit, index) => ({
    ...unit,
    id: `workspace-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
  }));
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
    workspaces: cloneWorkspaces(source.workspaces ?? []),
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
    selectedWorkspaceId: null,
    structure: {
      ...building.structure,
      showStairs: true,
      showColumns: true,
    },
  };
}

/** Replace objects on a floor with a ready-made room preset.
 * When `workspaceId` is set, the preset is scaled to fill that unit and
 * only replaces objects/agents that sit inside it.
 */
export function applyPresetToFloor(
  building: BuildingConfig,
  floorId: string,
  objects: PlacedObject[],
  agents: OfficeAgent[] = [],
  label?: string,
  options?: {
    workspaceId?: string | null;
    designWidth?: number;
    designDepth?: number;
  },
): BuildingConfig {
  const workspaceId = options?.workspaceId ?? null;

  return {
    ...building,
    floors: building.floors.map((floor) => {
      if (floor.id !== floorId) return floor;

      const workspace = workspaceId
        ? (floor.workspaces ?? []).find((unit) => unit.id === workspaceId)
        : null;

      if (
        workspace &&
        typeof options?.designWidth === "number" &&
        typeof options?.designDepth === "number"
      ) {
        const fitted = fitPresetToWorkspace(
          {
            objects,
            agents,
            designWidth: options.designWidth,
            designDepth: options.designDepth,
          },
          workspace,
        );
        const halfW = workspace.width / 2;
        const halfD = workspace.depth / 2;
        const inside = (x: number, z: number) =>
          Math.abs(x - workspace.x) <= halfW + 0.05 &&
          Math.abs(z - workspace.z) <= halfD + 0.05;

        return {
          ...floor,
          objects: [
            ...floor.objects.filter((object) => !inside(object.x, object.z)),
            ...clonePlacedObjects(fitted.objects),
          ],
          agents: [
            ...(floor.agents ?? []).filter(
              (agent) => !inside(agent.x, agent.z),
            ),
            ...cloneAgents(fitted.agents),
          ],
          // Preset brings its own walls; avoid double enclosure.
          workspaces: (floor.workspaces ?? []).map((unit) =>
            unit.id === workspace.id ? { ...unit, withWalls: false } : unit,
          ),
        };
      }

      return {
        ...floor,
        label: label ?? floor.label,
        objects: clonePlacedObjects(objects),
        agents: cloneAgents(agents),
      };
    }),
    selectedObjectId: null,
    selectedWorkspaceId: workspaceId ?? null,
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
  const mapped = raw.map((item, index) => {
    const object = item as Partial<PlacedObject> & { type?: string };
    const type = resolveObjectType(object.type ?? "desk_cubicle");
    const fallback = createPlacedObject(type, index);
    return {
      ...fallback,
      ...object,
      id: typeof object.id === "string" ? object.id.trim() : fallback.id,
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
  return ensureUniqueObjectIds(mapped);
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

function normalizeWorkspaces(raw: unknown): WorkspaceUnit[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      const unit = item as Partial<WorkspaceUnit>;
      const width =
        typeof unit.width === "number"
          ? Math.max(WORKSPACE_LIMITS.width.min, unit.width)
          : 0;
      const depth =
        typeof unit.depth === "number"
          ? Math.max(WORKSPACE_LIMITS.depth.min, unit.depth)
          : 0;
      if (width <= 0 || depth <= 0) return null;
      const colors = WORKSPACE_PALETTE[index % WORKSPACE_PALETTE.length]!;
      return {
        id: typeof unit.id === "string" ? unit.id : `workspace-${index}`,
        label:
          typeof unit.label === "string" ? unit.label : `واحد ${index + 1}`,
        shape: unit.shape === "square" ? "square" : "rectangle",
        x: typeof unit.x === "number" ? unit.x : 0,
        z: typeof unit.z === "number" ? unit.z : 0,
        width,
        depth,
        floorColor:
          typeof unit.floorColor === "string"
            ? unit.floorColor
            : colors.floorColor,
        wallColor:
          typeof unit.wallColor === "string"
            ? unit.wallColor
            : colors.wallColor,
        withWalls: unit.withWalls !== false,
      } satisfies WorkspaceUnit;
    })
    .filter((unit): unit is WorkspaceUnit => unit !== null);
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
        workspaces: normalizeWorkspaces(
          (floor as Partial<FloorConfig>).workspaces,
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
      selectedWorkspaceId:
        typeof data.selectedWorkspaceId === "string"
          ? data.selectedWorkspaceId
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
      editMode:
        typeof data.editMode === "boolean" ? data.editMode : false,
      drawMode:
        data.drawMode === "workspace" || data.drawMode === "wall"
          ? data.drawMode
          : "none",
      workspaceShape:
        data.workspaceShape === "square" ? "square" : "rectangle",
      workspaceWithWalls:
        typeof data.workspaceWithWalls === "boolean"
          ? data.workspaceWithWalls
          : DEFAULT_BUILDING.workspaceWithWalls,
      drawWallType: normalizeDrawWallType(data.drawWallType),
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
      workspaces: normalizeWorkspaces(
        (data as Partial<FloorConfig>).workspaces,
      ),
    };
    return {
      ...DEFAULT_BUILDING,
      floors: [floor],
      activeFloorId: floor.id,
    };
  }

  return DEFAULT_BUILDING;
}
