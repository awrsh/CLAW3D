import { createAgent, type OfficeAgent } from "@/features/office/core/agents";
import {
  createPlacedObject,
  createObjectId,
  ensureUniqueObjectIds,
  type ObjectType,
  type PlacedObject,
} from "@/features/office/core/objects";
import { createRoomBoundary } from "@/features/office/core/roomBoundaries";

export type RoomPresetId =
  | "empty"
  | "ceo"
  | "manager"
  | "engineering"
  | "finance"
  | "meeting"
  | "kitchen"
  | "kitchen_manager";

export type RoomPreset = {
  id: RoomPresetId;
  label: string;
  description: string;
  objects: PlacedObject[];
  agents: OfficeAgent[];
  /** Suggested wall style label for Tools. */
  wallStyle: ObjectType;
  /** Design-space size used when fitting into a workspace unit. */
  designWidth: number;
  designDepth: number;
};

let presetSeq = 0;

function place(
  type: ObjectType,
  x: number,
  z: number,
  rotationY = 0,
  elevation = 0,
  /** Stable template key — becomes part of instance id when preset is applied. */
  templateKey?: string,
): PlacedObject {
  presetSeq += 1;
  const templateId = templateKey ? `tpl-${templateKey}` : undefined;
  return createPlacedObject(type, presetSeq, {
    id: templateId ?? createObjectId(type),
    x,
    z,
    rotationY,
    elevation,
  });
}

function deskStation(
  cx: number,
  cz: number,
  facing = 180,
  keyPrefix = "desk",
): PlacedObject[] {
  const deskTop = 0.75;
  return [
    place("desk_cubicle", cx, cz, 0, 0, `${keyPrefix}-desk`),
    place("chair", cx, cz + (facing === 180 ? 1.1 : -1.1), facing, 0, `${keyPrefix}-chair`),
    place("computer", cx, cz - 0.15, 0, deskTop, `${keyPrefix}-monitor`),
    place("keyboard", cx + 0.15, cz + 0.15, 0, deskTop, `${keyPrefix}-keyboard`),
    place("mouse", cx + 0.55, cz + 0.15, 0, deskTop, `${keyPrefix}-mouse`),
    place("mug", cx - 0.55, cz + 0.1, 0, deskTop, `${keyPrefix}-mug`),
  ];
}

function withRoom(
  wallType: Extract<
    ObjectType,
    "wall_solid" | "wall_glass" | "wall_brick" | "wall_drywall" | "wall_partition"
  >,
  innerW: number,
  innerD: number,
  furniture: PlacedObject[],
  agents: OfficeAgent[],
  doorSide: "n" | "s" | "e" | "w" = "s",
): {
  objects: PlacedObject[];
  agents: OfficeAgent[];
  designWidth: number;
  designDepth: number;
} {
  return {
    objects: [
      ...createRoomBoundary({
        innerW,
        innerD,
        wallType,
        doorSide,
      }),
      ...furniture,
    ],
    agents,
    designWidth: innerW,
    designDepth: innerD,
  };
}

export const ROOM_PRESETS: readonly RoomPreset[] = [
  {
    id: "empty",
    label: "خالی",
    description: "اتاق خالی با دیوار گچی و در",
    wallStyle: "wall_drywall",
    ...withRoom("wall_drywall", 18, 12, [], []),
  },
  {
    id: "ceo",
    label: "دفتر مدیرعامل",
    description: "اتاق محصور شیشه‌ای با میز مدیریت و مبل",
    wallStyle: "wall_glass",
    ...withRoom(
      "wall_glass",
      22,
      14,
      [
        place("executive_desk", 0, -2, 0, 0, "ceo-desk"),
        place("chair", 0, -0.6, 180, 0, "ceo-chair"),
        place("computer", 0, -2.2, 0, 0.78, "ceo-monitor"),
        place("keyboard", 0.2, -1.85, 0, 0.78, "ceo-keyboard"),
        place("mouse", 0.55, -1.85, 0, 0.78, "ceo-mouse"),
        place("couch", -4.5, 2.5, 90, 0, "ceo-couch-l"),
        place("couch", 4.5, 2.5, 270, 0, "ceo-couch-r"),
        place("table_rect", 0, 2.5, 0, 0, "ceo-table"),
        place("bookshelf", -7, -4, 0, 0, "ceo-shelf"),
        place("plant", 7, -4, 0, 0, "ceo-plant-a"),
        place("plant", -7, 4, 0, 0, "ceo-plant-b"),
        place("lamp", 5, -1, 0, 0, "ceo-lamp"),
        place("whiteboard", -8.5, 0, 90, 0, "ceo-board"),
      ],
      [
        createAgent(0, {
          name: "قادر (سرپرست سیستم اطلاعاتی)",
          color: "#ffb74d",
          x: 0,
          z: 1,
          homeX: 0,
          homeZ: 1,
        }),
        createAgent(1, {
          name: "مینا (منشی)",
          color: "#4fc3f7",
          x: 3,
          z: 3,
          homeX: 3,
          homeZ: 3,
        }),
      ],
      "s",
    ),
  },
  {
    id: "manager",
    label: "دفتر مدیریت",
    description: "اتاق گچی با میز مدیریت و مهمان",
    wallStyle: "wall_drywall",
    ...withRoom(
      "wall_drywall",
      18,
      12,
      [
        place("executive_desk", -2, 0, 0, 0, "manager-desk"),
        place("chair", -2, 1.4, 180, 0, "manager-chair"),
        place("computer", -2, -0.25, 0, 0.78, "manager-monitor"),
        place("keyboard", -1.8, 0.15, 0, 0.78, "manager-keyboard"),
        place("mouse", -1.4, 0.15, 0, 0.78, "manager-mouse"),
        place("chair", 2, -1, 270, 0, "manager-guest-chair-a"),
        place("chair", 2, 1, 270, 0, "manager-guest-chair-b"),
        place("bookshelf", -6, -3, 0, 0, "manager-shelf"),
        place("plant", 5.5, -3.5, 0, 0, "manager-plant"),
        place("whiteboard", 7, 0, 90, 0, "manager-board"),
        place("trash", -4, 1.5, 0, 0, "manager-trash"),
      ],
      [createAgent(0, { name: "رضا (مدیر)", color: "#81c784", x: -2, z: 2.5 })],
    ),
  },
  {
    id: "engineering",
    label: "تیم برنامه‌نویسی",
    description: "سالن پارتیشن‌شده با چند میز توسعه",
    wallStyle: "wall_partition",
    ...withRoom(
      "wall_partition",
      28,
      16,
      [
        ...deskStation(-8, -3, 180, "eng-frontend-1"),
        ...deskStation(-3, -3, 180, "eng-backend-1"),
        ...deskStation(2, -3, 180, "eng-fullstack-1"),
        ...deskStation(7, -3, 180, "eng-qa-1"),
        ...deskStation(-8, 4, 0, "eng-frontend-2"),
        ...deskStation(-3, 4, 0, "eng-backend-2"),
        place("kanban_board", 10, 0, 90, 0, "eng-kanban"),
        place("printer", 10, -4, 0, 0, "eng-printer"),
        place("water_cooler", 10, 4, 0, 0, "eng-cooler"),
        place("plant", -11, 0, 0, 0, "eng-plant"),
        place("trash", 0, 0.5, 0, 0, "eng-trash"),
      ],
      [
        createAgent(0, { name: "سارا (فرانت‌اند)", color: "#4fc3f7", x: -8, z: 0 }),
        createAgent(1, { name: "مسعود (بک‌اند)", color: "#ce93d8", x: -3, z: 0 }),
        createAgent(2, { name: "آرش (فول‌استک)", color: "#81c784", x: 2, z: 1 }),
      ],
    ),
  },
  {
    id: "finance",
    label: "دفتر مدیر مالی",
    description: "اتاق آجری با کابینت اسناد",
    wallStyle: "wall_brick",
    ...withRoom(
      "wall_brick",
      16,
      12,
      [
        place("executive_desk", 0, -1, 0, 0, "finance-desk"),
        place("chair", 0, 0.5, 180, 0, "finance-chair"),
        place("computer", 0, -1.25, 0, 0.78, "finance-monitor"),
        place("keyboard", 0.2, -0.85, 0, 0.78, "finance-keyboard"),
        place("mouse", 0.55, -0.85, 0, 0.78, "finance-mouse"),
        place("cabinet", -5, 2, 0, 0, "finance-cabinet"),
        place("bookshelf", 5, -3, 0, 0, "finance-shelf"),
        place("printer", 4, 2, 0, 0, "finance-printer"),
        place("plant", -5, -3.5, 0, 0, "finance-plant"),
        place("lamp", 3, -1, 0, 0, "finance-lamp"),
        place("trash", 2, 1, 0, 0, "finance-trash"),
      ],
      [createAgent(0, { name: "لیلا (مالی)", color: "#ffb74d", x: 1, z: 2 })],
    ),
  },
  {
    id: "meeting",
    label: "اتاق جلسه",
    description: "اتاق شیشه‌ای با میز گرد",
    wallStyle: "wall_glass",
    ...withRoom(
      "wall_glass",
      16,
      14,
      [
        place("round_table", 0, 0, 0, 0, "meeting-table"),
        place("chair", 2.2, 0, 270, 0, "meeting-chair-e"),
        place("chair", -2.2, 0, 90, 0, "meeting-chair-w"),
        place("chair", 0, 2.2, 180, 0, "meeting-chair-s"),
        place("chair", 0, -2.2, 0, 0, "meeting-chair-n"),
        place("chair", 1.6, 1.6, 225, 0, "meeting-chair-se"),
        place("chair", -1.6, 1.6, 135, 0, "meeting-chair-sw"),
        place("chair", 1.6, -1.6, 315, 0, "meeting-chair-ne"),
        place("chair", -1.6, -1.6, 45, 0, "meeting-chair-nw"),
        place("whiteboard", -6.5, 0, 90, 0, "meeting-board"),
        place("plant", 5.5, -4, 0, 0, "meeting-plant-a"),
        place("plant", 5.5, 4, 0, 0, "meeting-plant-b"),
      ],
      [
        createAgent(0, { name: "نوید (هماهنگ‌کننده)", x: 3, z: 3 }),
        createAgent(1, { name: "مهمان (بازدیدکننده)", color: "#ef9a9a", x: -3, z: -2 }),
      ],
    ),
  },
  {
    id: "kitchen",
    label: "آشپزخانه اداری",
    description: "فضای گچی با کابینت و میز ناهار",
    wallStyle: "wall_drywall",
    ...withRoom(
      "wall_drywall",
      18,
      12,
      [
        place("cabinet", -4, -4, 0, 0, "kitchen-cabinet"),
        place("coffee_machine", -5, -4, 0, 0.9, "kitchen-coffee"),
        place("microwave", -3, -4, 0, 0.9, "kitchen-microwave"),
        place("fridge", 2, -4, 0, 0, "kitchen-fridge"),
        place("sink", 4.5, -4, 0, 0, "kitchen-sink"),
        place("dishwasher", 6.5, -4, 0, 0, "kitchen-dishwasher"),
        place("vending", 7, 1, 90, 0, "kitchen-vending"),
        place("water_cooler", 7, 3.5, 0, 0, "kitchen-cooler"),
        place("round_table", -2, 2.5, 0, 0, "kitchen-table"),
        place("chair", 0, 2.5, 270, 0, "kitchen-chair-a"),
        place("chair", -4, 2.5, 90, 0, "kitchen-chair-b"),
        place("trash", 0, -2, 0, 0, "kitchen-trash"),
        place("plant", -7, 3.5, 0, 0, "kitchen-plant"),
      ],
      [createAgent(0, { name: "کیان (استراحت)", color: "#80cbc4", x: -2, z: 1 })],
    ),
  },
  {
    id: "kitchen_manager",
    label: "آشپزخانه + مدیریت",
    description:
      "دو اتاق کنار هم با راهرو؛ مهماندار در آشپزخانه و مدیر پشت میز",
    wallStyle: "wall_drywall",
    ...(() => {
      const kitchenShifted = {
        objects: createRoomBoundary({
          cx: -14,
          cz: 0,
          innerW: 12,
          innerD: 10,
          wallType: "wall_drywall",
          doorSide: "e",
        }).concat([
          place("cabinet", -16, -3, 0, 0, "km-kitchen-cabinet"),
          place("coffee_machine", -17, -3, 0, 0.9, "km-kitchen-coffee"),
          place("microwave", -15, -3, 0, 0.9, "km-kitchen-microwave"),
          place("fridge", -12, -3, 0, 0, "km-kitchen-fridge"),
          place("sink", -10, -3, 0, 0, "km-kitchen-sink"),
          place("round_table", -14, 1.5, 0, 0, "km-kitchen-table"),
          place("chair", -12.2, 1.5, 270, 0, "km-kitchen-chair-a"),
          place("chair", -15.8, 1.5, 90, 0, "km-kitchen-chair-b"),
          place("water_cooler", -10, 2.5, 0, 0, "km-kitchen-cooler"),
          place("plant", -17.5, 2.5, 0, 0, "km-kitchen-plant"),
          place("lamp", -11, 1, 0, 0, "km-kitchen-lamp"),
        ]),
        agents: [
          createAgent(0, {
            name: "پریا (مهماندار)",
            color: "#80cbc4",
            x: -14,
            z: 0,
            homeX: -14,
            homeZ: 0,
          }),
        ],
      };
      const managerRoom = {
        objects: createRoomBoundary({
          cx: 10,
          cz: 0,
          innerW: 14,
          innerD: 12,
          wallType: "wall_brick",
          doorSide: "w",
        }).concat([
          place("executive_desk", 10, -1.5, 0, 0, "km-manager-desk"),
          place("chair", 10, 0.2, 180, 0, "km-manager-chair"),
          place("computer", 10, -1.8, 0, 0.78, "km-manager-monitor"),
          place("keyboard", 10.2, -1.4, 0, 0.78, "km-manager-keyboard"),
          place("mouse", 10.55, -1.4, 0, 0.78, "km-manager-mouse"),
          place("bookshelf", 14.5, -3.5, 0, 0, "km-manager-shelf"),
          place("plant", 5.5, -4, 0, 0, "km-manager-plant"),
          place("couch", 10, 4, 180, 0, "km-manager-couch"),
          place("lamp", 13, -1, 0, 0, "km-manager-lamp"),
          place("mug", 9.4, -1.3, 0, 0.78, "km-manager-mug"),
        ]),
        agents: [
          createAgent(1, {
            name: "قادر (سرپرست سیستم اطلاعاتی)",
            color: "#4fc3f7",
            x: 10,
            z: 1.2,
            homeX: 10,
            homeZ: 1.2,
          }),
        ],
      };
      return {
        objects: [...kitchenShifted.objects, ...managerRoom.objects],
        agents: [...kitchenShifted.agents, ...managerRoom.agents],
        designWidth: 38,
        designDepth: 14,
      };
    })(),
  },
];

export function getRoomPreset(id: RoomPresetId): RoomPreset {
  return ROOM_PRESETS.find((preset) => preset.id === id) ?? ROOM_PRESETS[0]!;
}

function isLengthScaledWall(type: ObjectType): boolean {
  return (
    type === "wall_solid" ||
    type === "wall_glass" ||
    type === "wall_brick" ||
    type === "wall_drywall" ||
    type === "wall_partition" ||
    type === "door"
  );
}

function axisScaleForRotation(
  rotationY: number,
  scaleX: number,
  scaleZ: number,
): number {
  const rot = ((rotationY % 360) + 360) % 360;
  const vertical = (rot > 45 && rot < 135) || (rot > 225 && rot < 315);
  return vertical ? scaleZ : scaleX;
}

/**
 * Map a preset (authored around origin with designWidth×designDepth)
 * into a workspace unit so it fills that unit's full width×depth.
 */
export function fitPresetToWorkspace(
  preset: Pick<
    RoomPreset,
    "objects" | "agents" | "designWidth" | "designDepth"
  >,
  workspace: { x: number; z: number; width: number; depth: number },
): { objects: PlacedObject[]; agents: OfficeAgent[] } {
  const designW = Math.max(1, preset.designWidth);
  const designD = Math.max(1, preset.designDepth);
  const scaleX = workspace.width / designW;
  const scaleZ = workspace.depth / designD;
  const furnitureScale = Math.max(
    0.35,
    Math.min(2.5, Math.sqrt(scaleX * scaleZ)),
  );

  const objects = ensureUniqueObjectIds(
    preset.objects.map((object, index) => {
      const slug = object.id.startsWith("tpl-")
        ? object.id.slice(4)
        : String(index);
      const next = {
        ...object,
        id: createObjectId(object.type, slug),
        x: workspace.x + object.x * scaleX,
        z: workspace.z + object.z * scaleZ,
      };
      if (isLengthScaledWall(object.type)) {
        next.length =
          object.length *
          axisScaleForRotation(object.rotationY, scaleX, scaleZ);
        next.scale = 1;
      } else {
        next.scale = object.scale * furnitureScale;
      }
      return next;
    }),
  );

  const agents = preset.agents.map((agent, index) => {
    const x = workspace.x + agent.x * scaleX;
    const z = workspace.z + agent.z * scaleZ;
    const homeX = workspace.x + (agent.homeX ?? agent.x) * scaleX;
    const homeZ = workspace.z + (agent.homeZ ?? agent.z) * scaleZ;
    return {
      ...agent,
      id: `preset-agent-${Date.now()}-${index}`,
      x,
      z,
      homeX,
      homeZ,
    };
  });

  return { objects, agents };
}
