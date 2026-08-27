/**
 * Orchestrator-style work todos for the office sample.
 * Status drives agent behavior on the floor.
 */

import type { DialogueTurn } from "@/features/office/core/agentDialogue";
import type { AgentState, OfficeAgent } from "@/features/office/core/agents";
import { createAgent } from "@/features/office/core/agents";
import type { PlacedObject } from "@/features/office/core/objects";

export type WorkTodoStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "blocked"
  | "failed";

export type WorkTodo = {
  id: string;
  title: string;
  description: string;
  status: WorkTodoStatus;
  /** Logical agent key from orchestrator (e.g. webpage-designer). */
  agentKey: string;
  agentLabel: string;
  avatarUrl?: string;
  agentType: "chat" | "webpage" | "orchestrator";
  dependencies: string[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
};

export type WorkPipeline = {
  id: string;
  goal: string;
  todos: WorkTodo[];
  running: boolean;
};

export const COLLABORATOR_AGENT_ID = "work-agent-collaborator";
export const COLLABORATOR_NAME = "مسعود (بک‌اند)";

type WorkAgentProfile = {
  givenName: string;
  role: string;
  agentLabel: string;
  agentType: WorkTodo["agentType"];
  avatarUrl: string;
  color: string;
  /** FA/EN keywords that route a free-text goal to this role. */
  keywords: RegExp[];
};

const WORK_AGENT_PROFILES: Record<string, WorkAgentProfile> = {
  "hr-job-description-analyst": {
    givenName: "آرش",
    role: "منابع انسانی",
    agentLabel: "AI Human Resource Deputy",
    agentType: "chat",
    avatarUrl: "https://avatarapi.runflare.run/public/55",
    color: "#ffb74d",
    keywords: [
      /hr|human\s*resource|استخدام|جاب|job\s*desc|jd\b|شرح\s*شغل|استخدامی|منابع\s*انسانی/i,
    ],
  },
  "professional-writing": {
    givenName: "سارا",
    role: "مدیر آموزش",
    agentLabel: "AI Training Manager",
    agentType: "chat",
    avatarUrl: "https://avatarapi.runflare.run/public/56",
    color: "#ce93d8",
    keywords: [
      /training|onboard|آموزش|آنبورد|پلن\s*آموزش|مستند|مستندات|writing|محتوا|مستندسازی/i,
    ],
  },
  "webpage-designer": {
    givenName: "نیما",
    role: "فرانت‌اند",
    agentLabel: "Frontend Developer",
    agentType: "webpage",
    avatarUrl: "https://avatarapi.runflare.run/public/80",
    color: "#4fc3f7",
    keywords: [
      /webpage|website|landing|frontend|فرانت|صفحه|وب|ui|داشبورد|dashboard|طراحی\s*صفحه/i,
    ],
  },
  "data-analyst": {
    givenName: "النا",
    role: "دیتا آنالیز",
    agentLabel: "Data Analyst",
    agentType: "chat",
    avatarUrl: "https://avatarapi.runflare.run/public/62",
    color: "#a5d6a7",
    keywords: [
      /data|analy|دیتا|تحلیل|آنالیز|آمار|متریک|kpi|گزارش\s*داده|insight/i,
    ],
  },
  "product-manager": {
    givenName: "مریم",
    role: "محصول",
    agentLabel: "Product Manager",
    agentType: "chat",
    avatarUrl: "https://avatarapi.runflare.run/public/70",
    color: "#ef9a9a",
    keywords: [
      /product|roadmap|بک‌لاگ|بکلاگ|پروداکت|محصول|اسپرینت|نیازمندی|requirement|epic/i,
    ],
  },
  "backend-engineer": {
    givenName: "کسرا",
    role: "بک‌اند",
    agentLabel: "Backend Engineer",
    agentType: "chat",
    avatarUrl: "https://avatarapi.runflare.run/public/74",
    color: "#80cbc4",
    keywords: [
      /backend|api|nestjs|server|بک‌اند|بکاند|سرویس|پایگاه|postgres|دیتابیس|endpoint/i,
    ],
  },
  collaborator: {
    givenName: "مسعود",
    role: "بک‌اند",
    agentLabel: "Collaborator",
    agentType: "chat",
    avatarUrl: "https://avatarapi.runflare.run/public/66",
    color: "#80cbc4",
    keywords: [],
  },
};

/** Preferred execution order when several roles match one goal. */
const ROLE_PIPELINE_ORDER = [
  "product-manager",
  "hr-job-description-analyst",
  "data-analyst",
  "professional-writing",
  "backend-engineer",
  "webpage-designer",
] as const;

export function workAgentDisplayName(agentKey: string): string {
  const profile =
    WORK_AGENT_PROFILES[agentKey] ?? WORK_AGENT_PROFILES.collaborator!;
  return `${profile.givenName} (${profile.role})`;
}

export function workAgentGivenName(agentKey: string): string {
  return (
    WORK_AGENT_PROFILES[agentKey]?.givenName ??
    WORK_AGENT_PROFILES.collaborator!.givenName
  );
}

/** Map todo status → office agent locomotion/activity state. */
export function agentStateFromTodoStatus(
  status: WorkTodoStatus,
): AgentState {
  switch (status) {
    case "pending":
      return "idle";
    case "blocked":
      return "sitting";
    case "in_progress":
      return "working";
    case "completed":
      return "idle";
    case "failed":
      return "idle";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function statusLabelFa(status: WorkTodoStatus): string {
  switch (status) {
    case "pending":
      return "در صف";
    case "blocked":
      return "منتظر وابستگی";
    case "in_progress":
      return "در حال انجام";
    case "completed":
      return "انجام شد";
    case "failed":
      return "ناموفق";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function statusColor(status: WorkTodoStatus): string {
  switch (status) {
    case "pending":
      return "#94a3b8";
    case "blocked":
      return "#f59e0b";
    case "in_progress":
      return "#38bdf8";
    case "completed":
      return "#22c55e";
    case "failed":
      return "#ef4444";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function depsSatisfied(todo: WorkTodo, todos: WorkTodo[]): boolean {
  if (todo.dependencies.length === 0) return true;
  return todo.dependencies.every((depId) => {
    const dep = todos.find((entry) => entry.id === depId);
    return dep?.status === "completed";
  });
}

/** Recompute blocked vs pending from dependency graph. */
export function reconcileTodoStatuses(todos: WorkTodo[]): WorkTodo[] {
  return todos.map((todo) => {
    if (todo.status === "completed" || todo.status === "failed") return todo;
    if (todo.status === "in_progress") return todo;
    const ready = depsSatisfied(todo, todos);
    if (!ready) return { ...todo, status: "blocked" };
    if (todo.status === "blocked") return { ...todo, status: "pending" };
    return todo;
  });
}

/**
 * Advance the pipeline one step (like orchestrator picking next ready todo).
 * Returns updated todos + which todo just changed (for toasts/SFX).
 */
export function advanceWorkPipeline(todos: WorkTodo[]): {
  todos: WorkTodo[];
  event:
    | { type: "started"; todo: WorkTodo }
    | { type: "completed"; todo: WorkTodo }
    | { type: "idle" };
} {
  const now = new Date().toISOString();
  let next = reconcileTodoStatuses(todos);

  const active = next.find((todo) => todo.status === "in_progress");
  if (active) {
    next = next.map((todo) =>
      todo.id === active.id
        ? { ...todo, status: "completed", completedAt: now }
        : todo,
    );
    next = reconcileTodoStatuses(next);
    const completed = next.find((todo) => todo.id === active.id)!;
    return { todos: next, event: { type: "completed", todo: completed } };
  }

  const ready = next.find((todo) => todo.status === "pending");
  if (ready) {
    next = next.map((todo) =>
      todo.id === ready.id
        ? { ...todo, status: "in_progress", startedAt: now }
        : todo,
    );
    const started = next.find((todo) => todo.id === ready.id)!;
    return { todos: next, event: { type: "started", todo: started } };
  }

  return { todos: next, event: { type: "idle" } };
}

/** Sample pipeline matching the orchestrator Full Stack JD flow. */
export function createSampleFullStackPipeline(): WorkPipeline {
  return createPipelineFromGoal(
    "create a job description for full stack developer (Nest JS and Next JS and Postgres) and create a training plan for him and then create a webpage for this post",
  );
}

function newTodoId(index: number): string {
  return `01K8GOALTODO${String(index + 1).padStart(12, "0")}`;
}

function truncateGoal(goal: string, max = 72): string {
  const clean = goal.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

function matchRolesForGoal(goal: string): string[] {
  const matched = ROLE_PIPELINE_ORDER.filter((key) => {
    const profile = WORK_AGENT_PROFILES[key];
    if (!profile) return false;
    return profile.keywords.some((pattern) => pattern.test(goal));
  });
  if (matched.length > 0) return matched;

  // Split on connectors; map each clause if possible.
  const clauses = goal
    .split(/\bthen\b| و بعد | سپس | بعد |، و | and then | and /i)
    .map((part) => part.trim())
    .filter((part) => part.length > 3);

  const fromClauses: string[] = [];
  for (const clause of clauses) {
    for (const key of ROLE_PIPELINE_ORDER) {
      const profile = WORK_AGENT_PROFILES[key];
      if (!profile) continue;
      if (
        profile.keywords.some((pattern) => pattern.test(clause)) &&
        !fromClauses.includes(key)
      ) {
        fromClauses.push(key);
      }
    }
  }
  if (fromClauses.length > 0) return fromClauses;

  // Fallback: product scopes the work, then a maker executes.
  return ["product-manager", "backend-engineer"];
}

function titleForRole(agentKey: string, goal: string): string {
  const short = truncateGoal(goal, 48);
  switch (agentKey) {
    case "hr-job-description-analyst":
      return `تهیه شرح شغل · ${short}`;
    case "professional-writing":
      return `مستند / پلن آموزش · ${short}`;
    case "webpage-designer":
      return `طراحی صفحه · ${short}`;
    case "data-analyst":
      return `تحلیل داده · ${short}`;
    case "product-manager":
      return `تعریف محصول · ${short}`;
    case "backend-engineer":
      return `پیاده‌سازی بک‌اند · ${short}`;
    default:
      return `اجرای کار · ${short}`;
  }
}

function descriptionForRole(agentKey: string, goal: string): string {
  const profile = WORK_AGENT_PROFILES[agentKey]!;
  return `${profile.role}: انجام بخش مربوط به مسئولیت خود از هدف «${truncateGoal(goal, 100)}».`;
}

/**
 * Build a runnable local pipeline from a free-text goal.
 * Roles are picked by keyword heuristics (no gateway / LLM).
 */
export function createPipelineFromGoal(goal: string): WorkPipeline {
  const trimmed = goal.replace(/\s+/g, " ").trim();
  const safeGoal =
    trimmed.length > 0
      ? trimmed
      : "یک هدف نمونه برای تیم آفیس تعریف و اجرا کن";

  const roleKeys = matchRolesForGoal(safeGoal);
  const now = new Date().toISOString();
  const todos: WorkTodo[] = roleKeys.map((agentKey, index) => {
    const profile = WORK_AGENT_PROFILES[agentKey]!;
    const id = newTodoId(index);
    const prevId = index > 0 ? newTodoId(index - 1) : null;
    return {
      id,
      title: titleForRole(agentKey, safeGoal),
      description: descriptionForRole(agentKey, safeGoal),
      status: "pending",
      agentKey,
      agentLabel: profile.agentLabel,
      avatarUrl: profile.avatarUrl,
      agentType: profile.agentType,
      dependencies: prevId ? [prevId] : [],
      createdAt: now,
    };
  });

  return {
    id: `goal-${Date.now().toString(36)}`,
    goal: safeGoal,
    todos: reconcileTodoStatuses(todos),
    running: false,
  };
}

const AGENT_KEY_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(WORK_AGENT_PROFILES).map(([key, profile]) => [
    key,
    profile.color,
  ]),
);

function seatPoints(objects: PlacedObject[]): Array<{ x: number; z: number }> {
  const desks = objects.filter(
    (object) =>
      object.type === "desk_cubicle" || object.type === "executive_desk",
  );
  if (desks.length > 0) {
    return desks.map((desk) => ({ x: desk.x, z: desk.z + 1.05 }));
  }
  return [
    { x: -6, z: 2 },
    { x: -2, z: 2 },
    { x: 2, z: 2 },
    { x: 6, z: 2 },
  ];
}

export function shortAgentName(label: string, key: string): string {
  if (WORK_AGENT_PROFILES[key]) return workAgentGivenName(key);
  if (/Human Resource|HR|Deputy/i.test(label) || key.includes("hr-")) {
    return workAgentGivenName("hr-job-description-analyst");
  }
  if (/Training/i.test(label) || key.includes("writing")) {
    return workAgentGivenName("professional-writing");
  }
  if (/Frontend|webpage/i.test(label) || key.includes("webpage")) {
    return workAgentGivenName("webpage-designer");
  }
  return label.split(" ").slice(-1)[0] ?? key;
}

export function agentIdForTodo(todo: WorkTodo): string {
  return `work-agent-${todo.agentKey}`;
}

/** Task-specific desk dialogue between the owner and a collaborator. */
export function dialogueForWorkTodo(
  todo: WorkTodo,
  leadName: string,
  peerName: string,
): DialogueTurn[] {
  const focus = truncateGoal(todo.description || todo.title, 90);
  switch (todo.agentKey) {
    case "hr-job-description-analyst":
      return [
        {
          speaker: "a",
          text: `${peerName}، دارم روی این هدف کار می‌کنم: ${focus}`,
        },
        {
          speaker: "b",
          text: `${leadName}، responsibilities، سطح seniority و مهارت‌های الزامی را شفاف بنویس.`,
        },
        {
          speaker: "a",
          text: `باشه — draft JD را با معیارهای استخدام آماده می‌کنم.`,
        },
        {
          speaker: "b",
          text: `عالی. بعد از تایید می‌دهیم به مرحلهٔ بعد.`,
        },
      ];
    case "professional-writing":
      return [
        {
          speaker: "a",
          text: `${peerName}، مستند/پلن آموزش را بر اساس «${truncateGoal(todo.title, 50)}» می‌نویسم.`,
        },
        {
          speaker: "b",
          text: `${leadName}، milestoneهای هفته‌به‌هفته و معیار موفقیت بگذار.`,
        },
        {
          speaker: "a",
          text: `حتماً — ساختار ۳۰/۶۰/۹۰ و چک‌لیست تحویل را هم اضافه می‌کنم.`,
        },
        {
          speaker: "b",
          text: `خوبه؛ بعد می‌فرستیم برای مرحلهٔ بعدی تیم.`,
        },
      ];
    case "webpage-designer":
      return [
        {
          speaker: "a",
          text: `${peerName}، صفحه/داشبورد را برای «${truncateGoal(todo.title, 50)}» طراحی می‌کنم.`,
        },
        {
          speaker: "b",
          text: `${leadName}، CTA واضح، سلسله‌مراتب بصری و نسخهٔ موبایل را چک کن.`,
        },
        {
          speaker: "a",
          text: `باشه — هیرو، بخش محتوا و بلوک اقدام را می‌بندم.`,
        },
        {
          speaker: "b",
          text: `اگر ریسپانسیو درست باشد آماده‌ایم.`,
        },
      ];
    case "data-analyst":
      return [
        {
          speaker: "a",
          text: `${peerName}، دارم داده‌های مربوط به «${truncateGoal(todo.title, 50)}» را تحلیل می‌کنم.`,
        },
        {
          speaker: "b",
          text: `${leadName}، متریک‌های کلیدی و outlierها را جداگانه هایلایت کن.`,
        },
        {
          speaker: "a",
          text: `آره — خلاصه insight و پیشنهاد اقدام را هم می‌نویسم.`,
        },
        {
          speaker: "b",
          text: `عالی؛ خروجی را برای مرحلهٔ بعد آماده کن.`,
        },
      ];
    case "product-manager":
      return [
        {
          speaker: "a",
          text: `${peerName}، دارم scope و اولویت‌ها را برای «${truncateGoal(todo.title, 50)}» می‌بندم.`,
        },
        {
          speaker: "b",
          text: `${leadName}، acceptance criteria و وابستگی‌ها را هم مشخص کن.`,
        },
        {
          speaker: "a",
          text: `حتماً — یک backlog کوتاه و ترتیب اجرا می‌دهم.`,
        },
        {
          speaker: "b",
          text: `خوبه؛ بعد تیم اجرا را درگیر می‌کنیم.`,
        },
      ];
    case "backend-engineer":
      return [
        {
          speaker: "a",
          text: `${peerName}، API/سرویس مربوط به «${truncateGoal(todo.title, 50)}» را پیاده می‌کنم.`,
        },
        {
          speaker: "b",
          text: `${leadName}، auth، validation و تست‌های اصلی را فراموش نکن.`,
        },
        {
          speaker: "a",
          text: `باشه — قرارداد API و مدل داده را هم مستند می‌کنم.`,
        },
        {
          speaker: "b",
          text: `اگر آماده شد، فرانت می‌تواند وصل شود.`,
        },
      ];
    default:
      return [
        {
          speaker: "a",
          text: `${peerName}، روی «${todo.title}» کار می‌کنم.`,
        },
        {
          speaker: "b",
          text: `${leadName}، اگر چیزی لازم داری بگو تا کمک کنم.`,
        },
        {
          speaker: "a",
          text: `تمرکزم روی تحویل همین بخش از هدف است.`,
        },
        {
          speaker: "b",
          text: `اوکی — بعد از اتمام سراغ مرحلهٔ بعد می‌رویم.`,
        },
      ];
  }
}

/** Rough duration so the orchestrator waits for the desk dialogue. */
export function estimateWorkDialogueMs(turns: DialogueTurn[]): number {
  let total = 1800;
  for (const turn of turns) {
    total += 1200 + turn.text.length * 28 + 1600;
  }
  return total;
}

/** Spawn / sync floor agents so each todo owner (+ collaborator) exists. */
export function agentsForPipeline(
  pipeline: WorkPipeline,
  existing: OfficeAgent[],
  objects: PlacedObject[] = [],
): OfficeAgent[] {
  const seats = seatPoints(objects);
  const byId = new Map(existing.map((agent) => [agent.id, agent]));

  // One floor agent per unique role (multiple todos may share a key).
  const uniqueKeys: string[] = [];
  for (const todo of pipeline.todos) {
    if (!uniqueKeys.includes(todo.agentKey)) uniqueKeys.push(todo.agentKey);
  }

  const todoAgents = uniqueKeys.map((agentKey, index) => {
    const id = `work-agent-${agentKey}`;
    const name = workAgentDisplayName(agentKey);
    const prev = byId.get(id);
    const seat = seats[index % seats.length]!;
    const ownTodos = pipeline.todos.filter((todo) => todo.agentKey === agentKey);
    const active = ownTodos.some((todo) => todo.status === "in_progress");
    const waiting =
      !active && ownTodos.every((todo) => todo.status === "blocked");
    const deskState: AgentState = active
      ? "working"
      : waiting
        ? "sitting"
        : "idle";

    return createAgent(index, {
      id,
      name,
      color: AGENT_KEY_COLORS[agentKey] ?? prev?.color ?? "#81c784",
      x: prev?.x ?? seat.x,
      z: prev?.z ?? seat.z,
      homeX: seat.x,
      homeZ: seat.z,
      state: deskState,
      roam: false,
      facing: prev?.facing ?? Math.PI,
    });
  });

  const hasActiveWork = pipeline.todos.some(
    (todo) => todo.status === "in_progress",
  );
  const collabSeat =
    seats[Math.min(seats.length - 1, todoAgents.length)] ?? { x: 4, z: 2 };
  const prevCollab = byId.get(COLLABORATOR_AGENT_ID);
  const collaborator = createAgent(todoAgents.length, {
    id: COLLABORATOR_AGENT_ID,
    name: COLLABORATOR_NAME,
    color: "#80cbc4",
    x: prevCollab?.x ?? collabSeat.x,
    z: prevCollab?.z ?? collabSeat.z,
    homeX: collabSeat.x,
    homeZ: collabSeat.z,
    // Helper stays ready while a desk agent is actively executing a todo.
    state: hasActiveWork ? "working" : "idle",
    roam: false,
    facing: prevCollab?.facing ?? 0,
  });

  return [...todoAgents, collaborator];
}

/** Find the active todo for a named office agent. */
export function todoForAgent(
  pipeline: WorkPipeline,
  agentName: string,
): WorkTodo | null {
  return (
    pipeline.todos.find((todo) => {
      const display = workAgentDisplayName(todo.agentKey);
      const given = workAgentGivenName(todo.agentKey);
      return (
        display === agentName ||
        given === agentName ||
        agentName.startsWith(given)
      );
    }) ?? null
  );
}

export function todoById(
  pipeline: WorkPipeline,
  todoId: string,
): WorkTodo | null {
  return pipeline.todos.find((todo) => todo.id === todoId) ?? null;
}
