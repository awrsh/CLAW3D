import * as THREE from "three";
import {
  LAYOUT,
  PATROL_ROUTE,
  pushOutOfObstacles,
  type PatrolNode,
} from "@/components/laboratory/labLayout";

export type InspectorPhase = "idle" | "patrol" | "checking" | "exiting";

export const AIRLOCK_ENTRY = LAYOUT.airlockEntry;
export const AIRLOCK_INSIDE = LAYOUT.airlockInside;

export const INSPECTOR_IDLE_SEC = 32;
export const INSPECTOR_WALK_SPEED = 1.2;

export type InspectorState = {
  phase: InspectorPhase;
  visible: boolean;
  position: THREE.Vector3;
  rotationY: number;
  routeIndex: number;
  dwellRemaining: number;
  idleRemaining: number;
  activityLabel: string;
};

export function createInspectorState(): InspectorState {
  return {
    phase: "idle",
    visible: false,
    position: AIRLOCK_ENTRY.clone(),
    rotationY: Math.PI,
    routeIndex: 0,
    dwellRemaining: 0,
    idleRemaining: INSPECTOR_IDLE_SEC * 0.45,
    activityLabel: "Off duty",
  };
}

function yawToward(from: THREE.Vector3, target: THREE.Vector3): number {
  const dx = target.x - from.x;
  const dz = target.z - from.z;
  return Math.atan2(dx, dz);
}

function moveToward(
  current: THREE.Vector3,
  target: THREE.Vector3,
  step: number,
): boolean {
  const dist = current.distanceTo(target);
  if (dist <= step) {
    current.copy(target);
    pushOutOfObstacles(current);
    return true;
  }
  current.lerp(target, step / dist);
  pushOutOfObstacles(current);
  return false;
}

function currentNode(index: number): PatrolNode | null {
  return PATROL_ROUTE[index] ?? null;
}

export function tickInspector(
  state: InspectorState,
  delta: number,
): InspectorState {
  const next: InspectorState = {
    ...state,
    position: state.position.clone(),
  };

  switch (next.phase) {
    case "idle": {
      next.visible = false;
      next.idleRemaining -= delta;
      next.activityLabel = "Awaiting isolated entry";
      if (next.idleRemaining <= 0) {
        next.phase = "patrol";
        next.visible = true;
        next.routeIndex = 0;
        next.position.copy(PATROL_ROUTE[0]?.position ?? AIRLOCK_ENTRY);
        next.activityLabel = "Entering via airlock corridor";
      }
      break;
    }
    case "patrol": {
      next.visible = true;
      const node = currentNode(next.routeIndex);
      if (!node) {
        next.phase = "idle";
        next.visible = false;
        next.idleRemaining = INSPECTOR_IDLE_SEC;
        next.routeIndex = 0;
        next.activityLabel = "Off duty";
        break;
      }

      if (node.kind === "check") {
        next.phase = "checking";
        next.dwellRemaining = node.dwellSec ?? 4;
        next.activityLabel = `Checking · ${node.label ?? "Equipment"}`;
        if (node.lookAt) {
          next.rotationY = yawToward(next.position, node.lookAt);
        }
        break;
      }

      const arrived = moveToward(
        next.position,
        node.position,
        INSPECTOR_WALK_SPEED * delta,
      );
      if (node.lookAt) {
        next.rotationY = yawToward(next.position, node.lookAt);
      } else if (next.routeIndex + 1 < PATROL_ROUTE.length) {
        const ahead = PATROL_ROUTE[next.routeIndex + 1];
        next.rotationY = yawToward(next.position, ahead.position);
      }
      next.activityLabel = "Patrol · corridor route";

      if (arrived) {
        next.routeIndex += 1;
        if (next.routeIndex >= PATROL_ROUTE.length) {
          next.phase = "idle";
          next.visible = false;
          next.idleRemaining = INSPECTOR_IDLE_SEC;
          next.routeIndex = 0;
          next.activityLabel = "Off duty";
        }
      }
      break;
    }
    case "checking": {
      next.visible = true;
      const node = currentNode(next.routeIndex);
      if (node?.lookAt) {
        next.rotationY = yawToward(next.position, node.lookAt);
      }
      next.dwellRemaining -= delta;
      if (next.dwellRemaining <= 0) {
        next.routeIndex += 1;
        next.phase = "patrol";
      }
      break;
    }
    case "exiting":
      next.phase = "patrol";
      break;
    default:
      break;
  }

  return next;
}
