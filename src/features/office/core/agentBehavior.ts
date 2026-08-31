/** Professional office routines — desk focus, breaks, purposeful movement. */

import type { OfficeAgent } from "@/features/office/core/agents";
import { resolveAgentRole } from "@/features/office/core/agentDialogue";
import type { PlacedObject } from "@/features/office/core/objects";
import type { NavBounds } from "@/features/office/core/navigation";
import { pointHitsBlockers } from "@/features/office/core/roomBoundaries";

export type ProfessionalActivity =
  | "focus_work"
  | "coffee_break"
  | "water_break"
  | "collab_spot"
  | "rest_chair"
  | "stretch";

export type ActivityGoal = {
  x: number;
  z: number;
  facing: number;
  state: OfficeAgent["state"];
  activity: ProfessionalActivity;
  /** How long to stay once arrived (ms). */
  durationMs: number;
};

const WORK_DURATIONS = { min: 28_000, max: 95_000 } as const;
const BREAK_DURATIONS = { min: 9_000, max: 22_000 } as const;
const REST_DURATIONS = { min: 12_000, max: 28_000 } as const;
const STRETCH_DURATIONS = { min: 4_000, max: 9_000 } as const;

const THINKING_PHRASES = [
  "بذار ببینم…",
  "یه لحظه فکر کنم…",
  "دارم جمع‌بندی می‌کنم…",
  "خب، از کجا شروع کنم…",
  "باید دقیق‌تر نگاه کنم…",
] as const;

const PASSING_GREETINGS = [
  "سلام!",
  "درود!",
  "خوبی؟",
  "صبح بخیر.",
  "اوضاع چطوره؟",
] as const;

const SOLO_WORK_THOUGHTS: Record<string, string[]> = {
  frontend: [
    "این state رو باید تمیزتر کنم…",
    "LCP هنوز بالاست — lazy load می‌ذارم.",
    "اسکلتون UI رو هم‌تراز می‌کنم.",
    "این کامپوننت رو memo می‌کنم.",
  ],
  backend: [
    "ایندکس query رو چک می‌کنم…",
    "idempotency این endpoint رو می‌بندم.",
    "لاگ correlation-id رو اضافه می‌کنم.",
    "migration رو قبل از deploy تست می‌کنم.",
  ],
  fullstack: [
    "contract API و UI رو sync می‌کنم…",
    "یک برش عمودی end-to-end می‌زنم.",
    "تست integration رو می‌نویسم.",
    "PR رو برای review آماده می‌کنم.",
  ],
  manager: [
    "بلاکرهای اسپرینت رو اولویت می‌کنم…",
    "acceptance criteria رو شفاف‌تر می‌کنم.",
    "ریسک delivery رو یادداشت می‌کنم.",
    "sync کوتاه با تیم می‌ذارم.",
  ],
  general: [
    "دارم روی تسک جاری تمرکز می‌کنم…",
    "یه لحظه — این بخش رو تموم کنم.",
    "یادداشت می‌کنم بعداً follow up کنم.",
    "اولویت امروز رو مرتب می‌کنم.",
  ],
};

const BREAK_THOUGHTS = [
  "یه قهوه بزنم، ذهنم تازه بشه.",
  "استراحت کوتاه — بعد برمی‌گردم سر کار.",
  "آب بخورم و برگردم.",
  "دو دقیقه استراحت، بعد ادامه می‌دم.",
] as const;

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function durationMs(range: { min: number; max: number }): number {
  return randBetween(range.min, range.max);
}

export function pickThinkingPhrase(): string {
  return THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)]!;
}

export function pickPassingGreeting(): string {
  return PASSING_GREETINGS[Math.floor(Math.random() * PASSING_GREETINGS.length)]!;
}

export function pickSoloWorkThought(agentName: string): string {
  const role = resolveAgentRole(agentName);
  const pool =
    SOLO_WORK_THOUGHTS[role] ??
    SOLO_WORK_THOUGHTS.general ??
    SOLO_WORK_THOUGHTS.general!;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function pickBreakThought(): string {
  return BREAK_THOUGHTS[Math.floor(Math.random() * BREAK_THOUGHTS.length)]!;
}

export function facingToward(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
): number {
  return Math.atan2(toX - fromX, toZ - fromZ);
}

function clampInBounds(
  x: number,
  z: number,
  bounds: NavBounds,
): { x: number; z: number } {
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, x)),
    z: Math.min(bounds.maxZ, Math.max(bounds.minZ, z)),
  };
}

function isReachable(
  x: number,
  z: number,
  objects: PlacedObject[],
  bounds: NavBounds,
): boolean {
  if (x < bounds.minX || x > bounds.maxX || z < bounds.minZ || z > bounds.maxZ) {
    return false;
  }
  return !pointHitsBlockers(x, z, 0.18, objects);
}

function nearestOfType(
  fromX: number,
  fromZ: number,
  objects: PlacedObject[],
  types: PlacedObject["type"][],
  bounds: NavBounds,
): PlacedObject | null {
  let best: PlacedObject | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const object of objects) {
    if (!types.includes(object.type)) continue;
    if (!isReachable(object.x, object.z, objects, bounds)) continue;
    const dist = Math.hypot(fromX - object.x, fromZ - object.z);
    if (dist < bestDist) {
      best = object;
      bestDist = dist;
    }
  }
  return best;
}

/** Desk/chair closest to agent home — their «assigned» spot. */
export function findAssignedDesk(
  homeX: number,
  homeZ: number,
  objects: PlacedObject[],
  bounds: NavBounds,
): { desk: PlacedObject; chair: PlacedObject | null } | null {
  const desks = objects.filter(
    (object) =>
      (object.type === "desk_cubicle" || object.type === "executive_desk") &&
      isReachable(object.x, object.z, objects, bounds),
  );
  if (desks.length === 0) return null;

  let bestDesk = desks[0]!;
  let bestDist = Math.hypot(homeX - bestDesk.x, homeZ - bestDesk.z);
  for (const desk of desks) {
    const dist = Math.hypot(homeX - desk.x, homeZ - desk.z);
    if (dist < bestDist) {
      bestDesk = desk;
      bestDist = dist;
    }
  }

  const chairs = objects.filter(
    (object) =>
      object.type === "chair" &&
      Math.hypot(object.x - bestDesk.x, object.z - bestDesk.z) < 1.4,
  );
  let bestChair: PlacedObject | null = null;
  let chairDist = Number.POSITIVE_INFINITY;
  for (const chair of chairs) {
    const dist = Math.hypot(chair.x - bestDesk.x, chair.z - bestDesk.z);
    if (dist < chairDist) {
      bestChair = chair;
      chairDist = dist;
    }
  }

  return { desk: bestDesk, chair: bestChair };
}

function deskWorkSpot(
  desk: PlacedObject,
  chair: PlacedObject | null,
  bounds: NavBounds,
): { x: number; z: number; facing: number } {
  if (chair) {
    const spot = clampInBounds(chair.x, chair.z + 0.55, bounds);
    return {
      ...spot,
      facing: facingToward(spot.x, spot.z, desk.x, desk.z),
    };
  }
  const spot = clampInBounds(desk.x, desk.z + 1.05, bounds);
  return {
    ...spot,
    facing: facingToward(spot.x, spot.z, desk.x, desk.z),
  };
}

type ActivityWeights = Array<{ activity: ProfessionalActivity; weight: number }>;

/** Weighted next activity — mimics a real workday rhythm. */
export function pickNextProfessionalActivity(
  agent: Pick<OfficeAgent, "homeX" | "homeZ" | "name"> & { x: number; z: number },
  objects: PlacedObject[],
  bounds: NavBounds,
  lastActivity: ProfessionalActivity | null,
): ActivityGoal {
  const assigned = findAssignedDesk(agent.homeX, agent.homeZ, objects, bounds);

  const weights: ActivityWeights = [
    { activity: "focus_work", weight: lastActivity === "focus_work" ? 0.15 : 0.52 },
    { activity: "coffee_break", weight: lastActivity === "coffee_break" ? 0.05 : 0.14 },
    { activity: "water_break", weight: 0.08 },
    { activity: "collab_spot", weight: 0.1 },
    { activity: "rest_chair", weight: 0.08 },
    { activity: "stretch", weight: lastActivity === "stretch" ? 0.02 : 0.08 },
  ];

  let roll = Math.random();
  let chosen: ProfessionalActivity = "focus_work";
  for (const entry of weights) {
    roll -= entry.weight;
    if (roll <= 0) {
      chosen = entry.activity;
      break;
    }
  }

  if (chosen === "focus_work" && assigned) {
    const spot = deskWorkSpot(assigned.desk, assigned.chair, bounds);
    return {
      ...spot,
      state: "working",
      activity: "focus_work",
      durationMs: durationMs(WORK_DURATIONS),
    };
  }

  if (chosen === "coffee_break") {
    const coffee = nearestOfType(
      agent.x,
      agent.z,
      objects,
      ["coffee_machine"],
      bounds,
    );
    if (coffee) {
      const spot = clampInBounds(coffee.x, coffee.z + 0.85, bounds);
      return {
        ...spot,
        facing: facingToward(spot.x, spot.z, coffee.x, coffee.z),
        state: "idle",
        activity: "coffee_break",
        durationMs: durationMs(BREAK_DURATIONS),
      };
    }
  }

  if (chosen === "water_break") {
    const cooler = nearestOfType(
      agent.x,
      agent.z,
      objects,
      ["water_cooler"],
      bounds,
    );
    if (cooler) {
      const spot = clampInBounds(cooler.x, cooler.z + 0.75, bounds);
      return {
        ...spot,
        facing: facingToward(spot.x, spot.z, cooler.x, cooler.z),
        state: "idle",
        activity: "water_break",
        durationMs: durationMs(BREAK_DURATIONS),
      };
    }
  }

  if (chosen === "collab_spot") {
    const board = nearestOfType(
      agent.x,
      agent.z,
      objects,
      ["whiteboard", "kanban_board", "round_table"],
      bounds,
    );
    if (board) {
      const spot = clampInBounds(board.x, board.z + 1.1, bounds);
      return {
        ...spot,
        facing: facingToward(spot.x, spot.z, board.x, board.z),
        state: "idle",
        activity: "collab_spot",
        durationMs: durationMs(REST_DURATIONS),
      };
    }
  }

  if (chosen === "rest_chair") {
    const chairs = objects.filter(
      (object) =>
        object.type === "chair" &&
        isReachable(object.x, object.z, objects, bounds),
    );
    if (chairs.length > 0) {
      const chair = chairs[Math.floor(Math.random() * chairs.length)]!;
      const spot = clampInBounds(chair.x, chair.z + 0.55, bounds);
      return {
        ...spot,
        facing: agent.homeX !== spot.x ? facingToward(spot.x, spot.z, agent.homeX, agent.homeZ) : 0,
        state: "sitting",
        activity: "rest_chair",
        durationMs: durationMs(REST_DURATIONS),
      };
    }
  }

  if (chosen === "stretch" && assigned) {
    const spot = deskWorkSpot(assigned.desk, assigned.chair, bounds);
    return {
      ...spot,
      state: "idle",
      activity: "stretch",
      durationMs: durationMs(STRETCH_DURATIONS),
    };
  }

  // Fallback — wander near home desk or center.
  if (assigned) {
    const spot = deskWorkSpot(assigned.desk, assigned.chair, bounds);
    return {
      ...spot,
      state: "working",
      activity: "focus_work",
      durationMs: durationMs(WORK_DURATIONS),
    };
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const x =
      bounds.minX + Math.random() * Math.max(0.5, bounds.maxX - bounds.minX);
    const z =
      bounds.minZ + Math.random() * Math.max(0.5, bounds.maxZ - bounds.minZ);
    if (isReachable(x, z, objects, bounds)) {
      return {
        x,
        z,
        facing: Math.random() * Math.PI * 2,
        state: "idle",
        activity: "stretch",
        durationMs: durationMs(STRETCH_DURATIONS),
      };
    }
  }

  const home = clampInBounds(agent.homeX, agent.homeZ, bounds);
  return {
    ...home,
    facing: 0,
    state: "idle",
    activity: "stretch",
    durationMs: durationMs(STRETCH_DURATIONS),
  };
}

/** Brief solo speech while focused — not a full chat. */
export function shouldEmitSoloThought(
  activity: ProfessionalActivity | null,
  state: OfficeAgent["state"],
  now: number,
  cooldownUntil: number,
): boolean {
  if (now < cooldownUntil) return false;
  if (activity === "focus_work" && state === "working") {
    return Math.random() < 0.018;
  }
  if (
    (activity === "coffee_break" || activity === "water_break") &&
    state === "idle"
  ) {
    return Math.random() < 0.025;
  }
  return false;
}

export function soloThoughtForActivity(
  activity: ProfessionalActivity | null,
  agentName: string,
): string {
  if (activity === "coffee_break" || activity === "water_break") {
    return pickBreakThought();
  }
  return pickSoloWorkThought(agentName);
}

/** Human-like pause before starting to walk. */
export function preWalkPauseMs(): number {
  return 420 + Math.random() * 780;
}
