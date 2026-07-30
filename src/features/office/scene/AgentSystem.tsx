"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { OfficeAgent } from "@/features/office/core/agents";
import { findNavPath, type NavPoint } from "@/features/office/core/navigation";
import { pointHitsBlockers } from "@/features/office/core/roomBoundaries";
import type { PlacedObject } from "@/features/office/core/objects";
import { OfficeAgentModel } from "@/features/office/scene/OfficeAgentModel";

type AgentSystemProps = {
  agents: OfficeAgent[];
  objects: PlacedObject[];
  floorHalfW: number;
  floorHalfD: number;
  enabled?: boolean;
  onAgentState?: (agentId: string, state: OfficeAgent["state"]) => void;
};

type RuntimeAgent = OfficeAgent & {
  targetX: number;
  targetZ: number;
  waitUntil: number;
  path: NavPoint[];
  pathIndex: number;
  stuckFrames: number;
};

const WALK_SPEED = 1.6;
const ARRIVE_EPS = 0.22;
const AGENT_RADIUS = 0.35;

function pickRoamPoint(
  agent: RuntimeAgent,
  objects: PlacedObject[],
  halfW: number,
  halfD: number,
): { x: number; z: number; state: OfficeAgent["state"] } {
  const chairs = objects.filter((object) => object.type === "chair");
  const desks = objects.filter(
    (object) =>
      object.type === "desk_cubicle" || object.type === "executive_desk",
  );
  const roll = Math.random();

  if (roll < 0.28 && chairs.length > 0) {
    const chair = chairs[Math.floor(Math.random() * chairs.length)]!;
    return { x: chair.x, z: chair.z + 0.15, state: "sitting" };
  }
  if (roll < 0.55 && desks.length > 0) {
    const desk = desks[Math.floor(Math.random() * desks.length)]!;
    return { x: desk.x, z: desk.z + 1.05, state: "working" };
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const x = (Math.random() * 2 - 1) * (halfW - 1.5);
    const z = (Math.random() * 2 - 1) * (halfD - 1.5);
    if (!pointHitsBlockers(x, z, AGENT_RADIUS, objects)) {
      return { x, z, state: "idle" };
    }
  }
  return { x: agent.homeX, z: agent.homeZ, state: "idle" };
}

/**
 * Walk / sit / work loop with A* pathfinding around walls and furniture.
 */
export function AgentSystem({
  agents,
  objects,
  floorHalfW,
  floorHalfD,
  enabled = true,
  onAgentState,
}: AgentSystemProps) {
  const agentsRef = useRef<RuntimeAgent[]>([]);
  const objectsRef = useRef(objects);
  const onStateRef = useRef(onAgentState);
  objectsRef.current = objects;
  onStateRef.current = onAgentState;

  useEffect(() => {
    agentsRef.current = agents.map((agent) => ({
      ...agent,
      targetX: agent.x,
      targetZ: agent.z,
      waitUntil: 0,
      path: [],
      pathIndex: 0,
      stuckFrames: 0,
    }));
  }, [agents]);

  useFrame((_, delta) => {
    if (!enabled) return;
    const now = performance.now();
    const dt = Math.min(delta, 0.05);
    const blockers = objectsRef.current;

    for (const agent of agentsRef.current) {
      if (!agent.roam) {
        agent.state = "idle";
        continue;
      }

      if (now < agent.waitUntil) continue;

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

        if (agent.state === "walking") {
          const nearChair = blockers.some(
            (object) =>
              object.type === "chair" &&
              Math.hypot(object.x - agent.x, object.z - agent.z) < 0.7,
          );
          const nearDesk = blockers.some(
            (object) =>
              (object.type === "desk_cubicle" ||
                object.type === "executive_desk") &&
              Math.hypot(object.x - agent.x, object.z - agent.z) < 1.4,
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
        } else {
          const next = pickRoamPoint(
            agent,
            blockers,
            floorHalfW,
            floorHalfD,
          );
          agent.targetX = next.x;
          agent.targetZ = next.z;
          agent.path = findNavPath(
            { x: agent.x, z: agent.z },
            { x: next.x, z: next.z },
            blockers,
            floorHalfW,
            floorHalfD,
          );
          agent.pathIndex = 0;
          agent.state = "walking";
          agent.waitUntil = 0;
          agent.stuckFrames = 0;
        }
        continue;
      }

      agent.state = "walking";
      const step = WALK_SPEED * dt;
      const nx = agent.x + (dx / dist) * Math.min(step, dist);
      const nz = agent.z + (dz / dist) * Math.min(step, dist);

      if (pointHitsBlockers(nx, nz, AGENT_RADIUS, blockers)) {
        agent.stuckFrames += 1;
        if (agent.stuckFrames > 8) {
          agent.path = findNavPath(
            { x: agent.x, z: agent.z },
            { x: agent.targetX, z: agent.targetZ },
            blockers,
            floorHalfW,
            floorHalfD,
          );
          agent.pathIndex = 0;
          agent.stuckFrames = 0;
        }
        continue;
      }

      agent.stuckFrames = 0;
      agent.x = nx;
      agent.z = nz;
      agent.facing = Math.atan2(dx, dz);
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
        />
      ))}
    </group>
  );
}
