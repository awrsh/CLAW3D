/** Minimal old-version furniture API for ported procedural/GLB meshes. */

export const SCALE = 0.018;
export const SNAP_GRID = 10;
export const WALL_THICKNESS = 8;
export const DOOR_THICKNESS = 8;
export const DOOR_LENGTH = 40;
export const CANVAS_W = 3600;
export const CANVAS_H = 4440;

/** Treat x/y as world-space corner coords (new-version adapter). */
export const toWorld = (cx: number, cy: number): [number, number, number] => [
  cx,
  0,
  cy,
];

export type FurnitureItem = {
  _uid: string;
  type: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  r?: number;
  color?: string;
  id?: string;
  facing?: number;
  vertical?: boolean;
  elevation?: number;
};

/** Stub so DoorModel props still typecheck; unused in new-version. */
export type RenderAgent = {
  id: string;
  x: number;
  y: number;
};

export type BasicFurnitureModelProps = {
  item: FurnitureItem;
  onPointerDown?: (uid: string) => void;
  onPointerOver?: (uid: string) => void;
  onPointerOut?: () => void;
  editMode?: boolean;
};

export type InteractiveFurnitureModelProps = {
  item: FurnitureItem;
  isSelected: boolean;
  isHovered: boolean;
  editMode: boolean;
  kanbanTaskCount?: number;
  doorOpen?: boolean;
  onPointerDown: (uid: string) => void;
  onPointerOver: (uid: string) => void;
  onPointerOut: () => void;
  onClick?: (uid: string) => void;
};

export const ITEM_FOOTPRINT: Record<string, [number, number]> = {
  wall: [40, 8],
  door: [40, 8],
  desk_cubicle: [90, 60],
  chair: [36, 36],
  round_table: [70, 70],
  executive_desk: [110, 70],
  couch: [100, 40],
  couch_v: [40, 100],
  bookshelf: [50, 30],
  plant: [28, 28],
  beanbag: [50, 50],
  pingpong: [140, 70],
  table_rect: [80, 50],
  coffee_machine: [30, 24],
  fridge: [40, 36],
  water_cooler: [28, 28],
  atm: [36, 30],
  sms_booth: [50, 50],
  phone_booth: [50, 50],
  whiteboard: [80, 16],
  cabinet: [70, 30],
  computer: [36, 24],
  lamp: [20, 20],
  printer: [36, 30],
  stove: [50, 40],
  microwave: [36, 28],
  wall_cabinet: [60, 24],
  sink: [50, 36],
  vending: [40, 30],
  server_rack: [40, 40],
  server_terminal: [50, 40],
  qa_terminal: [50, 40],
  kanban_board: [90, 60],
  device_rack: [40, 40],
  test_bench: [80, 40],
  treadmill: [60, 120],
  weight_bench: [50, 100],
  dumbbell_rack: [50, 30],
  exercise_bike: [40, 70],
  punching_bag: [28, 28],
  jukebox: [40, 30],
  rowing_machine: [50, 120],
  kettlebell_rack: [50, 30],
  yoga_mat: [60, 100],
  keyboard: [28, 14],
  mouse: [12, 18],
  trash: [18, 18],
  mug: [14, 14],
  clock: [20, 20],
  dishwasher: [50, 40],
  easel: [40, 40],
};

export const resolveItemTypeKey = (item: FurnitureItem) => item.type;

export const getItemBaseSize = (item: FurnitureItem) => {
  if (item.r !== undefined) {
    return { width: item.r * 2, height: item.r * 2 };
  }
  const [defaultWidth, defaultHeight] = ITEM_FOOTPRINT[
    resolveItemTypeKey(item)
  ] ?? [item.w ?? 40, item.h ?? 40];
  return {
    width: item.w ?? defaultWidth,
    height: item.h ?? defaultHeight,
  };
};

export const FURNITURE_ROTATION: Record<string, number> = {
  couch: Math.PI,
  couch_v: Math.PI / 2,
  executive_desk: -Math.PI / 2,
  whiteboard: Math.PI / 2,
};

export const getItemRotationRadians = (item: FurnitureItem) =>
  ((item.facing ?? 0) * Math.PI) / 180 +
  (FURNITURE_ROTATION[resolveItemTypeKey(item)] ?? 0);

export const ITEM_METADATA: Record<
  string,
  { blocksNavigation: boolean; navPadding?: number }
> = {
  wall: { blocksNavigation: true },
  door: { blocksNavigation: false },
  chair: { blocksNavigation: false },
  couch: { blocksNavigation: true },
  couch_v: { blocksNavigation: true },
  beanbag: { blocksNavigation: true },
  desk_cubicle: { blocksNavigation: true, navPadding: 0 },
  executive_desk: { blocksNavigation: true },
  round_table: { blocksNavigation: true },
  table_rect: { blocksNavigation: true },
  pingpong: { blocksNavigation: true },
  bookshelf: { blocksNavigation: true },
  cabinet: { blocksNavigation: true },
  wall_cabinet: { blocksNavigation: false },
  fridge: { blocksNavigation: true },
  stove: { blocksNavigation: true },
  microwave: { blocksNavigation: false },
  dishwasher: { blocksNavigation: true },
  sink: { blocksNavigation: true },
  coffee_machine: { blocksNavigation: false },
  printer: { blocksNavigation: true },
  vending: { blocksNavigation: true },
  atm: { blocksNavigation: true },
  whiteboard: { blocksNavigation: true },
  computer: { blocksNavigation: false },
  keyboard: { blocksNavigation: false },
  mouse: { blocksNavigation: false },
  server_rack: { blocksNavigation: true },
  server_terminal: { blocksNavigation: true },
  sms_booth: { blocksNavigation: true },
  phone_booth: { blocksNavigation: true },
  qa_terminal: { blocksNavigation: true },
  kanban_board: { blocksNavigation: true },
  device_rack: { blocksNavigation: true },
  test_bench: { blocksNavigation: true },
  treadmill: { blocksNavigation: true },
  weight_bench: { blocksNavigation: true },
  dumbbell_rack: { blocksNavigation: true },
  exercise_bike: { blocksNavigation: true },
  punching_bag: { blocksNavigation: true },
  jukebox: { blocksNavigation: true },
  rowing_machine: { blocksNavigation: true },
  kettlebell_rack: { blocksNavigation: true },
  yoga_mat: { blocksNavigation: true },
  easel: { blocksNavigation: true },
  water_cooler: { blocksNavigation: true },
  plant: { blocksNavigation: true },
  lamp: { blocksNavigation: false },
  trash: { blocksNavigation: false },
  clock: { blocksNavigation: false },
  mug: { blocksNavigation: false },
  wall_solid: { blocksNavigation: true },
  wall_glass: { blocksNavigation: true },
  wall_brick: { blocksNavigation: true },
  wall_drywall: { blocksNavigation: true },
  wall_partition: { blocksNavigation: true },
};
