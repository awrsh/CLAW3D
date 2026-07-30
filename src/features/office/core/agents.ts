/** Local walking characters — no gateway. */

export type AgentState = "idle" | "walking" | "working" | "sitting";

export type OfficeAgent = {
  id: string;
  name: string;
  color: string;
  x: number;
  z: number;
  /** Facing in radians (0 = +Z). */
  facing: number;
  state: AgentState;
  /** Wander between points / interact with furniture. */
  roam: boolean;
  homeX: number;
  homeZ: number;
};

export const AGENT_COLORS = [
  "#4fc3f7",
  "#81c784",
  "#ffb74d",
  "#ce93d8",
  "#ef9a9a",
  "#80cbc4",
] as const;

export const AGENT_NAMES = [
  "آریا",
  "سارا",
  "نیما",
  "مریم",
  "کسرا",
  "النا",
] as const;

export function createAgent(
  index: number,
  overrides: Partial<OfficeAgent> = {},
): OfficeAgent {
  const x = overrides.x ?? -3 + (index % 4) * 2.5;
  const z = overrides.z ?? 2 + Math.floor(index / 4) * 2;
  return {
    id: `agent-${Date.now()}-${index}`,
    name: AGENT_NAMES[index % AGENT_NAMES.length]!,
    color: AGENT_COLORS[index % AGENT_COLORS.length]!,
    x,
    z,
    facing: 0,
    state: "idle",
    roam: true,
    homeX: x,
    homeZ: z,
    ...overrides,
  };
}

export function cloneAgents(agents: OfficeAgent[]): OfficeAgent[] {
  return agents.map((agent, index) => ({
    ...agent,
    id: `agent-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
  }));
}
