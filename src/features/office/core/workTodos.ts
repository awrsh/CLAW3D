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
};

const WORK_AGENT_PROFILES: Record<string, WorkAgentProfile> = {
  "hr-job-description-analyst": {
    givenName: "آرش",
    role: "منابع انسانی",
  },
  "professional-writing": {
    givenName: "سارا",
    role: "مدیر آموزش",
  },
  "webpage-designer": {
    givenName: "نیما",
    role: "فرانت‌اند",
  },
  collaborator: {
    givenName: "مسعود",
    role: "بک‌اند",
  },
};

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
  const todos: WorkTodo[] = [
    {
      id: "01K8FSDEVTODO0000000000001",
      title: "Create Full Stack Developer Job Description",
      description:
        "Generate a JD for Full Stack Developer (NestJS, Next.js, Postgres)",
      status: "pending",
      agentKey: "hr-job-description-analyst",
      agentLabel: "AI Human Resource Deputy",
      avatarUrl: "https://avatarapi.runflare.run/public/55",
      agentType: "chat",
      dependencies: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "01K8FSDEVTODO0000000000002",
      title: "Create Onboarding Training Plan",
      description:
        "Build a structured training plan for the Full Stack Developer role from the JD",
      status: "pending",
      agentKey: "professional-writing",
      agentLabel: "AI Training Manager",
      avatarUrl: "https://avatarapi.runflare.run/public/56",
      agentType: "chat",
      dependencies: ["01K8FSDEVTODO0000000000001"],
      createdAt: new Date().toISOString(),
    },
    {
      id: "01K8FSDEVTODO0000000000003",
      title: "Create Career Post Webpage",
      description: "Design a public webpage for this Full Stack Developer job post",
      status: "pending",
      agentKey: "webpage-designer",
      agentLabel: "Frontend Developer",
      avatarUrl: "https://avatarapi.runflare.run/public/80",
      agentType: "webpage",
      dependencies: ["01K8FSDEVTODO0000000000002"],
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    id: "01K8FSDEVTODOMSG0000000001",
    goal:
      "create a job description for full stack developer (Nest JS and Next JS and Postgres) and create a training plan for him and then create a webpage for this post",
    todos: reconcileTodoStatuses(todos),
    running: false,
  };
}

const AGENT_KEY_COLORS: Record<string, string> = {
  "hr-job-description-analyst": "#ffb74d",
  "professional-writing": "#ce93d8",
  "webpage-designer": "#4fc3f7",
};

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
  switch (todo.agentKey) {
    case "hr-job-description-analyst":
      return [
        {
          speaker: "a",
          text: `${peerName}، دارم JD فول‌استک می‌نویسم: NestJS، Next.js و Postgres. سطح senior و full-time.`,
        },
        {
          speaker: "b",
          text: `${leadName}، حتماً auth، API design و تست رو هم توی responsibilities بگذار.`,
        },
        {
          speaker: "a",
          text: `آره — TypeScript end-to-end، مدل‌سازی Postgres و query optimization هم هایلایت می‌کنم.`,
        },
        {
          speaker: "b",
          text: `عالی. وقتی draft آماده شد بده تا با Engineering Manager مرور کنیم.`,
        },
      ];
    case "professional-writing":
      return [
        {
          speaker: "a",
          text: `${peerName}، از روی JD یک پلن ۳۰/۶۰/۹۰ برای آنبوردینگ فول‌استک می‌سازم.`,
        },
        {
          speaker: "b",
          text: `${leadName}، هفته‌به‌هفته milestone و پروژهٔ عملی Nest و Next بگذار.`,
        },
        {
          speaker: "a",
          text: `حتماً — چک‌پوینت منتورینگ و معیار موفقیت هر فاز را هم جدول می‌کنم.`,
        },
        {
          speaker: "b",
          text: `خوبه. بعد از تایید، می‌دیم به فرانت برای صفحهٔ شغلی.`,
        },
      ];
    case "webpage-designer":
      return [
        {
          speaker: "a",
          text: `${peerName}، صفحهٔ شغلی می‌سازم: هیرو با Nest / Next / Postgres و CTA درخواست.`,
        },
        {
          speaker: "b",
          text: `${leadName}، بخش مسئولیت‌ها، مهارت‌ها و مسیر رشد از پلن آموزش را هم بیاور.`,
        },
        {
          speaker: "a",
          text: `باشه — overview کوتاه، مهارت‌ها، و یک بلوک Apply واضح.`,
        },
        {
          speaker: "b",
          text: `اگر موبایل هم درست باشه، آماده‌ایم برای انتشار.`,
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

  const todoAgents = pipeline.todos.map((todo, index) => {
    const id = agentIdForTodo(todo);
    const name = workAgentDisplayName(todo.agentKey);
    const prev = byId.get(id);
    const seat = seats[index % seats.length]!;
    // Only the in-progress owner types at their desk; blocked wait seated.
    const deskState: AgentState = agentStateFromTodoStatus(todo.status);

    return createAgent(index, {
      id,
      name,
      color: AGENT_KEY_COLORS[todo.agentKey] ?? prev?.color ?? "#81c784",
      // Preserve live position so AgentSystem can walk (never snap).
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
