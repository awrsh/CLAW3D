"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { OfficeAgent } from "@/features/office/core/agents";
import { buildPeerDialogue, type DialogueTurn } from "@/features/office/core/agentDialogue";
import {
  findNavPath,
  snapToDoorCenterline,
  type NavBounds,
  type NavPoint,
} from "@/features/office/core/navigation";
import { pointHitsBlockers } from "@/features/office/core/roomBoundaries";
import type { PlacedObject } from "@/features/office/core/objects";
import type { WorkspaceUnit } from "@/features/office/core/roomConfig";
import { OfficeAgentModel } from "@/features/office/scene/OfficeAgentModel";

export type AgentFocusRequest = {
  agentId: string;
  nonce: number;
};

export type ForcedChatRequest = {
  leadId: string;
  partnerId: string;
  turns: DialogueTurn[];
  nonce: number;
};

type AgentSystemProps = {
  agents: OfficeAgent[];
  objects: PlacedObject[];
  workspaces?: WorkspaceUnit[];
  floorHalfW: number;
  floorHalfD: number;
  /** World-space Y of this floor (group origin). */
  worldY?: number;
  enabled?: boolean;
  selectedAgentId?: string | null;
  focusRequest?: AgentFocusRequest | null;
  forcedChatRequest?: ForcedChatRequest | null;
  onAgentSelect?: (agent: OfficeAgent) => void;
  onAgentState?: (agentId: string, state: OfficeAgent["state"]) => void;
  onPeerChat?: (
    a: OfficeAgent,
    b: OfficeAgent,
    turns: DialogueTurn[],
  ) => void;
  onWorkSessionDone?: (leadId: string) => void;
};

type OrbitLike = {
  target: THREE.Vector3;
  update: () => void;
};

type SpeechPhase = "idle" | "thinking" | "typing" | "holding";

type RuntimeAgent = OfficeAgent & {
  targetX: number;
  targetZ: number;
  waitUntil: number;
  path: NavPoint[];
  pathIndex: number;
  stuckFrames: number;
  roamBounds: NavBounds;
  /** Visible bubble text (typed so far, or thinking label). */
  speechText: string;
  speechUntil: number;
  chatCooldownUntil: number;
  chatPartnerId: string | null;
  chatTurns: DialogueTurn[];
  chatTurnIndex: number;
  chatIsA: boolean;
  speechPhase: SpeechPhase;
  speechFullText: string;
  speechCharIndex: number;
  speechNextAt: number;
  speechThinkStartedAt: number;
  /** Walk toward this agent, then start pendingChatTurns. */
  meetTargetId: string | null;
  pendingChatTurns: DialogueTurn[] | null;
  /** Walk back / to assigned desk, then resume working. */
  seekHome: boolean;
};

const WALK_SPEED = 1.7;
const ARRIVE_EPS = 0.22;
const AGENT_RADIUS = 0.18;
/** Visual body is scaled ~1.35 — keep a clear gap while talking. */
const CHAT_PAIR_GAP = 2.2;
/** Start scripted/casual chat once both are within this of each other. */
const PEER_CHAT_DIST = CHAT_PAIR_GAP + 0.45;
const PEER_APPROACH_DIST = 5.5;
/** Soft collision so agents never sit inside each other. */
const MIN_AGENT_GAP = 1.35;
const PEER_CHAT_COOLDOWN_MS = 28000;
const TYPE_MS_PER_CHAR = 28;
const THINK_MS_MIN = 900;
const THINK_MS_MAX = 1800;
const HOLD_MS_AFTER_TYPE = 1600;
const BOUNDS_INSET = 0.55;

function floorBounds(halfW: number, halfD: number): NavBounds {
  return {
    minX: -halfW + BOUNDS_INSET,
    maxX: halfW - BOUNDS_INSET,
    minZ: -halfD + BOUNDS_INSET,
    maxZ: halfD - BOUNDS_INSET,
  };
}

function workspaceBounds(unit: WorkspaceUnit): NavBounds {
  const inset = unit.withWalls ? 0.45 : BOUNDS_INSET;
  return {
    minX: unit.x - unit.width / 2 + inset,
    maxX: unit.x + unit.width / 2 - inset,
    minZ: unit.z - unit.depth / 2 + inset,
    maxZ: unit.z + unit.depth / 2 - inset,
  };
}

function pointInBounds(x: number, z: number, bounds: NavBounds): boolean {
  return (
    x >= bounds.minX &&
    x <= bounds.maxX &&
    z >= bounds.minZ &&
    z <= bounds.maxZ
  );
}

function clampToBounds(x: number, z: number, bounds: NavBounds): NavPoint {
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, x)),
    z: Math.min(bounds.maxZ, Math.max(bounds.minZ, z)),
  };
}

function resolveRoamBounds(
  homeX: number,
  homeZ: number,
  workspaces: WorkspaceUnit[],
  halfW: number,
  halfD: number,
): NavBounds {
  const floor = floorBounds(halfW, halfD);
  if (workspaces.length === 0) return floor;

  // Prefer the workspace that contains the agent's home desk.
  const atHome = workspaces.find((unit) => {
    const halfWu = unit.width / 2;
    const halfDu = unit.depth / 2;
    return (
      Math.abs(homeX - unit.x) <= halfWu &&
      Math.abs(homeZ - unit.z) <= halfDu
    );
  });
  if (atHome) return workspaceBounds(atHome);

  // Fallback: nearest workspace center (still confine — don't roam whole floor).
  let best = workspaces[0]!;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const unit of workspaces) {
    const dist = Math.hypot(homeX - unit.x, homeZ - unit.z);
    if (dist < bestDist) {
      best = unit;
      bestDist = dist;
    }
  }
  return workspaceBounds(best);
}

function tryMove(
  x: number,
  z: number,
  nx: number,
  nz: number,
  objects: PlacedObject[],
  bounds: NavBounds,
): { x: number; z: number } | null {
  const snapped = snapToDoorCenterline(nx, nz, objects);
  const clamped = clampToBounds(snapped.x, snapped.z, bounds);
  const tx = clamped.x;
  const tz = clamped.z;

  if (!pointHitsBlockers(tx, tz, AGENT_RADIUS, objects)) {
    return { x: tx, z: tz };
  }
  if (!pointHitsBlockers(tx, z, AGENT_RADIUS, objects) && pointInBounds(tx, z, bounds)) {
    return { x: tx, z };
  }
  if (!pointHitsBlockers(x, tz, AGENT_RADIUS, objects) && pointInBounds(x, tz, bounds)) {
    return { x, z: tz };
  }
  return null;
}

function pickRoamPoint(
  agent: RuntimeAgent,
  objects: PlacedObject[],
  bounds: NavBounds,
): { x: number; z: number; state: OfficeAgent["state"] } {
  const chairs = objects.filter(
    (object) =>
      object.type === "chair" && pointInBounds(object.x, object.z, bounds),
  );
  const desks = objects.filter(
    (object) =>
      (object.type === "desk_cubicle" || object.type === "executive_desk") &&
      pointInBounds(object.x, object.z, bounds),
  );
  const roll = Math.random();

  if (roll < 0.28 && chairs.length > 0) {
    const chair = chairs[Math.floor(Math.random() * chairs.length)]!;
    const point = clampToBounds(chair.x, chair.z + 0.55, bounds);
    return { ...point, state: "sitting" };
  }
  if (roll < 0.55 && desks.length > 0) {
    const desk = desks[Math.floor(Math.random() * desks.length)]!;
    const point = clampToBounds(desk.x, desk.z + 1.15, bounds);
    return { ...point, state: "working" };
  }

  for (let attempt = 0; attempt < 16; attempt += 1) {
    const x =
      bounds.minX + Math.random() * Math.max(0.5, bounds.maxX - bounds.minX);
    const z =
      bounds.minZ + Math.random() * Math.max(0.5, bounds.maxZ - bounds.minZ);
    if (!pointHitsBlockers(x, z, AGENT_RADIUS, objects)) {
      return { x, z, state: "idle" };
    }
  }
  const home = clampToBounds(agent.homeX, agent.homeZ, bounds);
  return { ...home, state: "idle" };
}

function beginWalkTo(
  agent: RuntimeAgent,
  next: { x: number; z: number; state?: OfficeAgent["state"] },
  objects: PlacedObject[],
  halfW: number,
  halfD: number,
) {
  const goal = clampToBounds(next.x, next.z, agent.roamBounds);
  agent.targetX = goal.x;
  agent.targetZ = goal.z;
  agent.path = findNavPath(
    { x: agent.x, z: agent.z },
    goal,
    objects,
    halfW,
    halfD,
    agent.roamBounds,
  );
  agent.pathIndex = 0;
  agent.stuckFrames = 0;
  if (agent.path.length === 0) {
    agent.state = "idle";
    agent.waitUntil = performance.now() + 500 + Math.random() * 700;
    return;
  }
  agent.state = "walking";
  agent.waitUntil = 0;
}

function clearSpeech(agent: RuntimeAgent) {
  agent.speechPhase = "idle";
  agent.speechText = "";
  agent.speechFullText = "";
  agent.speechCharIndex = 0;
  agent.speechNextAt = 0;
  agent.speechThinkStartedAt = 0;
}

function beginSpeakTurn(speaker: RuntimeAgent, listener: RuntimeAgent, text: string, now: number) {
  clearSpeech(listener);
  const thinkMs = THINK_MS_MIN + Math.random() * (THINK_MS_MAX - THINK_MS_MIN);
  speaker.speechPhase = "thinking";
  speaker.speechFullText = text;
  speaker.speechCharIndex = 0;
  speaker.speechText = "…";
  speaker.speechThinkStartedAt = now;
  speaker.speechNextAt = now + thinkMs;
}

function estimateDialogueMs(turns: DialogueTurn[]): number {
  let total = 0;
  for (const turn of turns) {
    total +=
      (THINK_MS_MIN + THINK_MS_MAX) / 2 +
      turn.text.length * TYPE_MS_PER_CHAR +
      HOLD_MS_AFTER_TYPE +
      200;
  }
  return total;
}

/** Stand beside a peer — never on top of them. */
function standBeside(
  peerX: number,
  peerZ: number,
  fromX: number,
  fromZ: number,
  gap = CHAT_PAIR_GAP,
): NavPoint {
  const dx = fromX - peerX;
  const dz = fromZ - peerZ;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.05) {
    return { x: peerX + gap, z: peerZ };
  }
  return {
    x: peerX + (dx / dist) * gap,
    z: peerZ + (dz / dist) * gap,
  };
}

/** Push a chatting pair apart around their midpoint until gap is met. */
function ensureChatSpacing(
  a: RuntimeAgent,
  b: RuntimeAgent,
  gap = CHAT_PAIR_GAP,
) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const dist = Math.hypot(dx, dz);
  if (dist >= gap) return;
  if (dist < 0.05) {
    a.x -= gap / 2;
    b.x += gap / 2;
  } else {
    const nx = dx / dist;
    const nz = dz / dist;
    const midX = (a.x + b.x) / 2;
    const midZ = (a.z + b.z) / 2;
    a.x = midX - (nx * gap) / 2;
    a.z = midZ - (nz * gap) / 2;
    b.x = midX + (nx * gap) / 2;
    b.z = midZ + (nz * gap) / 2;
  }
  const aClamped = clampToBounds(a.x, a.z, a.roamBounds);
  const bClamped = clampToBounds(b.x, b.z, b.roamBounds);
  a.x = aClamped.x;
  a.z = aClamped.z;
  b.x = bClamped.x;
  b.z = bClamped.z;
  // If clamp collapsed them again, force an X offset inside bounds.
  if (Math.hypot(b.x - a.x, b.z - a.z) < gap * 0.75) {
    const side = a.x <= b.x ? -1 : 1;
    const shiftedA = clampToBounds(a.x + side * (gap / 2), a.z, a.roamBounds);
    const shiftedB = clampToBounds(b.x - side * (gap / 2), b.z, b.roamBounds);
    a.x = shiftedA.x;
    a.z = shiftedA.z;
    b.x = shiftedB.x;
    b.z = shiftedB.z;
  }
  a.targetX = a.x;
  a.targetZ = a.z;
  b.targetX = b.x;
  b.targetZ = b.z;
}

function separateOverlappingAgents(agents: RuntimeAgent[]) {
  for (let i = 0; i < agents.length; i += 1) {
    const a = agents[i]!;
    for (let j = i + 1; j < agents.length; j += 1) {
      const b = agents[j]!;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const dist = Math.hypot(dx, dz);
      if (dist >= MIN_AGENT_GAP || dist < 1e-6) {
        if (dist < 1e-6) {
          b.x += MIN_AGENT_GAP;
        }
        continue;
      }
      const push = (MIN_AGENT_GAP - dist) / 2;
      const nx = dx / dist;
      const nz = dz / dist;
      // Prefer not to shove walkers off their path as hard.
      const aWeight = a.state === "walking" ? 0.25 : 0.5;
      const bWeight = b.state === "walking" ? 0.25 : 0.5;
      a.x -= nx * push * (aWeight * 2);
      a.z -= nz * push * (aWeight * 2);
      b.x += nx * push * (bWeight * 2);
      b.z += nz * push * (bWeight * 2);
    }
  }
}

function startPeerChat(
  a: RuntimeAgent,
  b: RuntimeAgent,
  now: number,
  onPeerChat?: AgentSystemProps["onPeerChat"],
  scriptedTurns?: DialogueTurn[],
) {
  const turns = scriptedTurns ?? buildPeerDialogue(a, b);
  const totalMs = estimateDialogueMs(turns);

  ensureChatSpacing(a, b, CHAT_PAIR_GAP);

  a.state = "chatting";
  b.state = "chatting";
  a.path = [];
  b.path = [];
  a.pathIndex = 0;
  b.pathIndex = 0;
  a.chatTurns = turns;
  b.chatTurns = turns;
  a.chatTurnIndex = 0;
  b.chatTurnIndex = 0;
  a.chatPartnerId = b.id;
  b.chatPartnerId = a.id;
  a.chatIsA = true;
  b.chatIsA = false;
  a.speechUntil = now + totalMs + 500;
  b.speechUntil = now + totalMs + 500;
  a.waitUntil = now + totalMs + 500;
  b.waitUntil = now + totalMs + 500;
  a.chatCooldownUntil = now + PEER_CHAT_COOLDOWN_MS + totalMs;
  b.chatCooldownUntil = now + PEER_CHAT_COOLDOWN_MS + totalMs;
  a.facing = Math.atan2(b.x - a.x, b.z - a.z);
  b.facing = Math.atan2(a.x - b.x, a.z - b.z);

  const first = turns[0];
  if (first) {
    if (first.speaker === "a") beginSpeakTurn(a, b, first.text, now);
    else beginSpeakTurn(b, a, first.text, now);
  }

  onPeerChat?.(a, b, turns);
  return totalMs;
}

/**
 * Leader (chatIsA) advances the shared dialogue: think → type → hold → next.
 */
function tickDialogue(
  leader: RuntimeAgent,
  partner: RuntimeAgent,
  now: number,
) {
  const turns = leader.chatTurns;
  if (turns.length === 0) return;

  const turn = turns[leader.chatTurnIndex];
  if (!turn) return;

  const speaker = turn.speaker === "a" ? leader : partner;
  const listener = turn.speaker === "a" ? partner : leader;

  if (speaker.speechPhase === "thinking") {
    const pulse = Math.floor((now - speaker.speechThinkStartedAt) / 400) % 3;
    speaker.speechText = `فکر می‌کنه${".".repeat(pulse + 1)}`;
    if (now >= speaker.speechNextAt) {
      speaker.speechPhase = "typing";
      speaker.speechCharIndex = 0;
      speaker.speechText = "";
      speaker.speechNextAt = now;
    }
    return;
  }

  if (speaker.speechPhase === "typing") {
    while (
      now >= speaker.speechNextAt &&
      speaker.speechCharIndex < speaker.speechFullText.length
    ) {
      speaker.speechCharIndex += 1;
      speaker.speechText = speaker.speechFullText.slice(
        0,
        speaker.speechCharIndex,
      );
      const ch = speaker.speechFullText[speaker.speechCharIndex - 1] ?? "";
      const pause =
        ch === " " || ch === "،" || ch === "."
          ? TYPE_MS_PER_CHAR * 1.8
          : TYPE_MS_PER_CHAR;
      speaker.speechNextAt += pause;
    }
    if (speaker.speechCharIndex >= speaker.speechFullText.length) {
      speaker.speechPhase = "holding";
      speaker.speechText = speaker.speechFullText;
      speaker.speechNextAt = now + HOLD_MS_AFTER_TYPE;
    }
    return;
  }

  if (speaker.speechPhase === "holding" && now >= speaker.speechNextAt) {
    const nextIndex = leader.chatTurnIndex + 1;
    if (nextIndex >= turns.length) {
      clearSpeech(leader);
      clearSpeech(partner);
      leader.chatTurns = [];
      partner.chatTurns = [];
      leader.speechUntil = now;
      partner.speechUntil = now;
      return;
    }
    leader.chatTurnIndex = nextIndex;
    partner.chatTurnIndex = nextIndex;
    const next = turns[nextIndex]!;
    if (next.speaker === "a") beginSpeakTurn(leader, partner, next.text, now);
    else beginSpeakTurn(partner, leader, next.text, now);
    void listener;
  }
}

/**
 * Walk / sit / work loop with A* around walls/furniture.
 * Agents stay inside their workspace (or floor if none).
 * Nearby pairs pause and exchange a short chat.
 */
export function AgentSystem({
  agents,
  objects,
  workspaces = [],
  floorHalfW,
  floorHalfD,
  worldY = 0,
  enabled = true,
  selectedAgentId = null,
  focusRequest = null,
  forcedChatRequest = null,
  onAgentSelect,
  onAgentState,
  onPeerChat,
  onWorkSessionDone,
}: AgentSystemProps) {
  const agentsRef = useRef<RuntimeAgent[]>([]);
  const objectsRef = useRef(objects);
  const workspacesRef = useRef(workspaces);
  const onStateRef = useRef(onAgentState);
  const onPeerChatRef = useRef(onPeerChat);
  const onWorkDoneRef = useRef(onWorkSessionDone);
  const focusRafRef = useRef<number | null>(null);
  const workLeadRef = useRef<string | null>(null);
  const meetupStartedRef = useRef(false);
  const { camera } = useThree();
  const controls = useThree((state) => state.controls) as OrbitLike | null;
  objectsRef.current = objects;
  workspacesRef.current = workspaces;
  onStateRef.current = onAgentState;
  onPeerChatRef.current = onPeerChat;
  onWorkDoneRef.current = onWorkSessionDone;

  useEffect(() => {
    const previous = new Map(
      agentsRef.current.map((agent) => [agent.id, agent] as const),
    );
    agentsRef.current = agents.map((agent) => {
      const roamBounds = resolveRoamBounds(
        agent.homeX,
        agent.homeZ,
        workspacesRef.current,
        floorHalfW,
        floorHalfD,
      );
      const existing = previous.get(agent.id);
      if (existing) {
        // Keep live position — never teleport from props (walk instead).
        const clamped = clampToBounds(
          existing.x,
          existing.z,
          existing.meetTargetId || existing.seekHome
            ? existing.roamBounds
            : roamBounds,
        );
        const farFromHome =
          Math.hypot(clamped.x - agent.homeX, clamped.z - agent.homeZ) > 0.55;
        const shouldSeekHome =
          !existing.meetTargetId &&
          existing.state !== "chatting" &&
          existing.state !== "walking" &&
          !agent.roam &&
          (agent.state === "working" || agent.state === "sitting") &&
          farFromHome;
        return {
          ...existing,
          name: agent.name,
          color: agent.color,
          roam: agent.roam,
          homeX: agent.homeX,
          homeZ: agent.homeZ,
          roamBounds:
            existing.meetTargetId || existing.seekHome
              ? existing.roamBounds
              : roamBounds,
          x: clamped.x,
          z: clamped.z,
          state:
            existing.state === "chatting" ||
            existing.state === "walking" ||
            existing.meetTargetId ||
            existing.seekHome
              ? existing.state
              : agent.state,
          seekHome: existing.seekHome || shouldSeekHome,
          meetTargetId: existing.meetTargetId ?? null,
          pendingChatTurns: existing.pendingChatTurns ?? null,
          chatTurns: existing.chatTurns ?? [],
          chatTurnIndex: existing.chatTurnIndex ?? 0,
          chatIsA: existing.chatIsA ?? true,
          speechPhase: existing.speechPhase ?? "idle",
          speechFullText: existing.speechFullText ?? "",
          speechCharIndex: existing.speechCharIndex ?? 0,
          speechNextAt: existing.speechNextAt ?? 0,
          speechThinkStartedAt: existing.speechThinkStartedAt ?? 0,
        };
      }
      const spawn = clampToBounds(agent.x, agent.z, roamBounds);
      return {
        ...agent,
        x: spawn.x,
        z: spawn.z,
        targetX: spawn.x,
        targetZ: spawn.z,
        waitUntil: 0,
        path: [],
        pathIndex: 0,
        stuckFrames: 0,
        roamBounds,
        speechText: "",
        speechUntil: 0,
        chatCooldownUntil: 0,
        chatPartnerId: null,
        chatTurns: [],
        chatTurnIndex: 0,
        chatIsA: true,
        speechPhase: "idle" as const,
        speechFullText: "",
        speechCharIndex: 0,
        speechNextAt: 0,
        speechThinkStartedAt: 0,
        meetTargetId: null,
        pendingChatTurns: null,
        seekHome: false,
      };
    });
  }, [agents, floorHalfD, floorHalfW, workspaces]);

  // Smooth orbit focus onto an agent (todo card click / work start).
  useEffect(() => {
    if (!focusRequest?.agentId || !controls?.target) return;
    const agent = agentsRef.current.find(
      (entry) => entry.id === focusRequest.agentId,
    );
    if (!agent) return;

    if (focusRafRef.current != null) {
      cancelAnimationFrame(focusRafRef.current);
      focusRafRef.current = null;
    }

    const startTarget = controls.target.clone();
    const startCam = camera.position.clone();
    const endTarget = new THREE.Vector3(agent.x, worldY, agent.z);
    const offset = startCam.clone().sub(startTarget);
    let t = 0;

    const tick = () => {
      t = Math.min(1, t + 0.045);
      const ease = 1 - (1 - t) ** 3;
      controls.target.lerpVectors(startTarget, endTarget, ease);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      if (t < 1) {
        focusRafRef.current = requestAnimationFrame(tick);
      } else {
        focusRafRef.current = null;
      }
    };
    focusRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (focusRafRef.current != null) {
        cancelAnimationFrame(focusRafRef.current);
        focusRafRef.current = null;
      }
    };
  }, [camera, controls, focusRequest, worldY]);

  // Forced work dialogue: walk to meet, never teleport.
  useEffect(() => {
    if (!forcedChatRequest) return;
    const lead = agentsRef.current.find(
      (entry) => entry.id === forcedChatRequest.leadId,
    );
    const partner = agentsRef.current.find(
      (entry) => entry.id === forcedChatRequest.partnerId,
    );
    if (!lead || !partner) return;

    const floor = floorBounds(floorHalfW, floorHalfD);
    meetupStartedRef.current = false;
    workLeadRef.current = lead.id;

    lead.roamBounds = floor;
    partner.roamBounds = floor;
    lead.seekHome = false;
    partner.seekHome = false;
    lead.pendingChatTurns = forcedChatRequest.turns;
    partner.pendingChatTurns = forcedChatRequest.turns;
    lead.meetTargetId = partner.id;
    partner.meetTargetId = lead.id;

    beginWalkTo(
      lead,
      { x: lead.homeX, z: lead.homeZ },
      objectsRef.current,
      floorHalfW,
      floorHalfD,
    );
    beginWalkTo(
      partner,
      { x: lead.homeX + CHAT_PAIR_GAP, z: lead.homeZ },
      objectsRef.current,
      floorHalfW,
      floorHalfD,
    );
    onStateRef.current?.(lead.id, "walking");
    onStateRef.current?.(partner.id, "walking");
  }, [forcedChatRequest, floorHalfD, floorHalfW]);

  useFrame((_, delta) => {
    if (!enabled) return;
    const now = performance.now();
    const dt = Math.min(delta, 0.05);
    const blockers = objectsRef.current;
    const live = agentsRef.current;
    const floor = floorBounds(floorHalfW, floorHalfD);

    // Scripted work chat starts only after both walked close enough.
    for (const agent of live) {
      if (!agent.meetTargetId || !agent.pendingChatTurns) continue;
      if (meetupStartedRef.current) continue;
      if (agent.id !== workLeadRef.current) continue;
      const partner = live.find((entry) => entry.id === agent.meetTargetId);
      if (!partner) continue;
      if (Math.hypot(agent.x - partner.x, agent.z - partner.z) > PEER_CHAT_DIST) {
        continue;
      }
      meetupStartedRef.current = true;
      const turns = agent.pendingChatTurns;
      agent.meetTargetId = null;
      partner.meetTargetId = null;
      agent.pendingChatTurns = null;
      partner.pendingChatTurns = null;
      startPeerChat(agent, partner, now, onPeerChatRef.current, turns);
      onStateRef.current?.(agent.id, "chatting");
      onStateRef.current?.(partner.id, "chatting");
    }

    // Casual roamers: approach on foot, then chat (no pop-in).
    for (let i = 0; i < live.length; i += 1) {
      const a = live[i]!;
      if (
        !a.roam ||
        a.meetTargetId ||
        a.state === "chatting" ||
        a.state === "walking" ||
        now < a.chatCooldownUntil
      ) {
        continue;
      }
      for (let j = i + 1; j < live.length; j += 1) {
        const b = live[j]!;
        if (
          !b.roam ||
          b.meetTargetId ||
          b.state === "chatting" ||
          b.state === "walking" ||
          now < b.chatCooldownUntil
        ) {
          continue;
        }
        const sameSpace =
          Math.abs(
            (a.roamBounds.minX + a.roamBounds.maxX) / 2 -
              (b.roamBounds.minX + b.roamBounds.maxX) / 2,
          ) < 0.01 &&
          Math.abs(
            (a.roamBounds.minZ + a.roamBounds.maxZ) / 2 -
              (b.roamBounds.minZ + b.roamBounds.maxZ) / 2,
          ) < 0.01;
        if (!sameSpace) continue;
        const dist = Math.hypot(a.x - b.x, a.z - b.z);
        if (dist <= PEER_CHAT_DIST) {
          startPeerChat(a, b, now, onPeerChatRef.current);
          onStateRef.current?.(a.id, "chatting");
          onStateRef.current?.(b.id, "chatting");
        } else if (dist <= PEER_APPROACH_DIST && Math.random() < 0.002) {
          a.meetTargetId = b.id;
          b.meetTargetId = a.id;
          a.pendingChatTurns = null;
          b.pendingChatTurns = null;
          beginWalkTo(
            a,
            standBeside(b.x, b.z, a.x, a.z, CHAT_PAIR_GAP),
            blockers,
            floorHalfW,
            floorHalfD,
          );
        }
      }
    }

    // Casual walk-up meetup (no scripted turns).
    for (const agent of live) {
      if (!agent.meetTargetId || agent.pendingChatTurns) continue;
      if (agent.state === "chatting") continue;
      const partner = live.find((entry) => entry.id === agent.meetTargetId);
      if (!partner) {
        agent.meetTargetId = null;
        continue;
      }
      if (Math.hypot(agent.x - partner.x, agent.z - partner.z) > PEER_CHAT_DIST) {
        continue;
      }
      if (agent.id > partner.id) continue;
      agent.meetTargetId = null;
      partner.meetTargetId = null;
      startPeerChat(agent, partner, now, onPeerChatRef.current);
      onStateRef.current?.(agent.id, "chatting");
      onStateRef.current?.(partner.id, "chatting");
    }

    // Soft collision — keep bodies from nesting into each other.
    separateOverlappingAgents(live);

    for (const agent of live) {
      if (agent.state === "chatting" && agent.chatPartnerId) {
        const partner = live.find((entry) => entry.id === agent.chatPartnerId);
        if (partner && agent.chatIsA) {
          ensureChatSpacing(agent, partner, CHAT_PAIR_GAP);
          agent.facing = Math.atan2(partner.x - agent.x, partner.z - agent.z);
          partner.facing = Math.atan2(agent.x - partner.x, agent.z - partner.z);
        }
      }
    }

    for (const agent of live) {
      if (agent.state === "chatting" && agent.chatIsA && agent.chatTurns.length > 0) {
        const partner = live.find((entry) => entry.id === agent.chatPartnerId);
        if (partner) tickDialogue(agent, partner, now);
      }

      if (agent.speechUntil > 0 && now >= agent.speechUntil) {
        const wasWorkLead = workLeadRef.current === agent.id;
        clearSpeech(agent);
        agent.speechUntil = 0;
        agent.chatPartnerId = null;
        agent.chatTurns = [];
        agent.chatTurnIndex = 0;
        if (agent.state === "chatting") {
          agent.roamBounds = floor;
          agent.seekHome = true;
          agent.meetTargetId = null;
          agent.pendingChatTurns = null;
          beginWalkTo(
            agent,
            { x: agent.homeX, z: agent.homeZ },
            blockers,
            floorHalfW,
            floorHalfD,
          );
          onStateRef.current?.(agent.id, "walking");
          if (wasWorkLead) {
            workLeadRef.current = null;
            onWorkDoneRef.current?.(agent.id);
          }
        }
      }

      const pursuing =
        !!agent.meetTargetId || agent.seekHome || agent.state === "walking";

      if (!agent.roam && !pursuing) {
        const source = agents.find((entry) => entry.id === agent.id);
        if (source && agent.state !== "chatting") {
          agent.state = source.state;
        }
        continue;
      }
      if (agent.state === "chatting") continue;
      if (now < agent.waitUntil && !agent.meetTargetId && !agent.seekHome) {
        continue;
      }

      if (
        agent.seekHome &&
        agent.path.length === 0 &&
        Math.hypot(agent.x - agent.homeX, agent.z - agent.homeZ) > ARRIVE_EPS
      ) {
        agent.roamBounds = floor;
        beginWalkTo(
          agent,
          { x: agent.homeX, z: agent.homeZ },
          blockers,
          floorHalfW,
          floorHalfD,
        );
      }

      if (agent.meetTargetId && agent.path.length === 0) {
        const partner = live.find((entry) => entry.id === agent.meetTargetId);
        if (partner) {
          const isLead = agent.id === workLeadRef.current;
          const goal = isLead
            ? { x: agent.homeX, z: agent.homeZ }
            : agent.pendingChatTurns
              ? { x: partner.homeX + CHAT_PAIR_GAP, z: partner.homeZ }
              : standBeside(
                  partner.x,
                  partner.z,
                  agent.x,
                  agent.z,
                  CHAT_PAIR_GAP,
                );
          beginWalkTo(agent, goal, blockers, floorHalfW, floorHalfD);
        }
      }

      if (!pointInBounds(agent.x, agent.z, agent.roamBounds)) {
        const back = clampToBounds(agent.x, agent.z, agent.roamBounds);
        agent.x = back.x;
        agent.z = back.z;
      }

      const waypoint =
        agent.path[agent.pathIndex] ??
        ({ x: agent.targetX, z: agent.targetZ } satisfies NavPoint);
      const dx = waypoint.x - agent.x;
      const dz = waypoint.z - agent.z;
      const dist = Math.hypot(dx, dz);

      if (dist < ARRIVE_EPS) {
        if (agent.pathIndex < agent.path.length - 1) {
          agent.pathIndex += 1;
          continue;
        }

        if (agent.meetTargetId) {
          agent.path = [];
          agent.pathIndex = 0;
          // Scripted work: type at desk while waiting for the collaborator.
          agent.state = agent.pendingChatTurns ? "working" : "idle";
          continue;
        }

        if (agent.seekHome) {
          agent.seekHome = false;
          agent.path = [];
          agent.pathIndex = 0;
          agent.roamBounds = resolveRoamBounds(
            agent.homeX,
            agent.homeZ,
            workspacesRef.current,
            floorHalfW,
            floorHalfD,
          );
          const source = agents.find((entry) => entry.id === agent.id);
          agent.state = source?.state ?? "idle";
          onStateRef.current?.(agent.id, agent.state);
          agent.waitUntil = now + 800;
          continue;
        }

        if (agent.state === "walking") {
          const nearChair = blockers.some(
            (object) =>
              object.type === "chair" &&
              Math.hypot(object.x - agent.x, object.z - agent.z) < 0.9 &&
              pointInBounds(object.x, object.z, agent.roamBounds),
          );
          const nearDesk = blockers.some(
            (object) =>
              (object.type === "desk_cubicle" ||
                object.type === "executive_desk") &&
              Math.hypot(object.x - agent.x, object.z - agent.z) < 1.5 &&
              pointInBounds(object.x, object.z, agent.roamBounds),
          );
          const nextState = nearChair
            ? "sitting"
            : nearDesk
              ? "working"
              : "idle";
          onStateRef.current?.(agent.id, nextState);
          agent.state = nextState;
          agent.waitUntil = now + 1600 + Math.random() * 2200;
          agent.path = [];
          agent.pathIndex = 0;
        } else if (agent.roam) {
          beginWalkTo(
            agent,
            pickRoamPoint(agent, blockers, agent.roamBounds),
            blockers,
            floorHalfW,
            floorHalfD,
          );
        }
        continue;
      }

      agent.state = "walking";
      const step = WALK_SPEED * dt;
      const nx = agent.x + (dx / dist) * Math.min(step, dist);
      const nz = agent.z + (dz / dist) * Math.min(step, dist);
      const moved = tryMove(
        agent.x,
        agent.z,
        nx,
        nz,
        blockers,
        agent.roamBounds,
      );

      if (!moved) {
        agent.stuckFrames += 1;
        if (agent.stuckFrames > 8) {
          agent.path = findNavPath(
            { x: agent.x, z: agent.z },
            { x: agent.targetX, z: agent.targetZ },
            blockers,
            floorHalfW,
            floorHalfD,
            agent.roamBounds,
          );
          agent.pathIndex = 0;
          agent.stuckFrames = 0;
          if (agent.path.length === 0 && agent.roam && !agent.meetTargetId) {
            beginWalkTo(
              agent,
              pickRoamPoint(agent, blockers, agent.roamBounds),
              blockers,
              floorHalfW,
              floorHalfD,
            );
          }
        }
        continue;
      }

      const prevX = agent.x;
      const prevZ = agent.z;
      agent.stuckFrames = 0;
      agent.x = moved.x;
      agent.z = moved.z;
      agent.facing = Math.atan2(moved.x - prevX, moved.z - prevZ);
    }
  });

  if (!enabled || agents.length === 0) return null;

  return (
    <group>
      {agents.map((agent) => (
        <OfficeAgentModel
          key={agent.id}
          agentId={agent.id}
          agentsRef={agentsRef}
          selected={agent.id === selectedAgentId}
          onSelect={(agentId) => {
            const live = agentsRef.current.find((entry) => entry.id === agentId);
            if (live) onAgentSelect?.(live);
          }}
        />
      ))}
    </group>
  );
}
