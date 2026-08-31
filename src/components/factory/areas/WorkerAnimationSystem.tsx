"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";

export type WorkerAnimBinding = {
  id: string;
  rootRef: RefObject<THREE.Group | null>;
  bodyRef: RefObject<THREE.Group | null>;
  leftArmRef: RefObject<THREE.Group | null>;
  rightArmRef: RefObject<THREE.Group | null>;
  leftLegRef: RefObject<THREE.Group | null>;
  rightLegRef: RefObject<THREE.Group | null>;
  /** Area-local waypoints (includes Y=0); empty = static */
  waypoints: THREE.Vector3[];
  speed: number;
  baseYaw: number;
  walking: boolean;
  /** World offset applied to waypoints */
  areaOffset: THREE.Vector3;
};

const bindings = new Map<string, WorkerAnimBinding>();

export function registerWorkerAnimation(binding: WorkerAnimBinding) {
  bindings.set(binding.id, binding);
}

export function unregisterWorkerAnimation(id: string) {
  bindings.delete(id);
}

function yawToward(from: THREE.Vector3, to: THREE.Vector3, baseYaw: number) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  if (dx * dx + dz * dz < 0.0004) return baseYaw;
  return Math.atan2(dx, dz) + baseYaw;
}

/** Single animation tick for every worker — nav-mesh waypoints, no object clipping. */
export function WorkerAnimationLoop() {
  const progress = useRef(new Map<string, { seg: number; t: number }>());

  useFrame((state, delta) => {
    if (bindings.size === 0) return;

    const elapsed = state.clock.elapsedTime;

    for (const entry of bindings.values()) {
      const {
        rootRef,
        bodyRef,
        leftArmRef,
        rightArmRef,
        leftLegRef,
        rightLegRef,
        waypoints,
        speed,
        baseYaw,
        walking,
        areaOffset,
      } = entry;

      if (!rootRef.current) continue;

      if (walking && waypoints.length >= 2) {
        let state = progress.current.get(entry.id);
        if (!state) {
          state = { seg: 0, t: 0 };
          progress.current.set(entry.id, state);
        }

        const a = waypoints[state.seg]!;
        const b = waypoints[(state.seg + 1) % waypoints.length]!;
        const from = a.clone().add(areaOffset);
        const to = b.clone().add(areaOffset);

        const segLen = from.distanceTo(to);
        const step = speed * delta;
        state.t += segLen > 0.01 ? step / segLen : 1;

        if (state.t >= 1) {
          state.t = 0;
          state.seg = (state.seg + 1) % waypoints.length;
        }

        rootRef.current.position.lerpVectors(from, to, state.t);
        const targetYaw = yawToward(from, to, 0);
        rootRef.current.rotation.y = THREE.MathUtils.lerp(
          rootRef.current.rotation.y,
          targetYaw + baseYaw,
          0.14,
        );

        const walkCycle = elapsed * speed * 2.2;
        const legSwing = Math.sin(walkCycle) * 0.42;
        if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
        if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
        if (bodyRef.current) {
          bodyRef.current.position.y = Math.abs(Math.sin(walkCycle)) * 0.035;
        }
        if (leftArmRef.current) {
          leftArmRef.current.rotation.z = Math.PI / 2 + Math.sin(walkCycle) * 0.08;
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = -Math.PI / 2 - Math.sin(walkCycle) * 0.08;
        }
      } else {
        progress.current.delete(entry.id);
        if (leftArmRef.current) leftArmRef.current.rotation.z = Math.PI / 2;
        if (rightArmRef.current) rightArmRef.current.rotation.z = -Math.PI / 2;
        if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
        if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
        if (bodyRef.current) bodyRef.current.position.y = 0;
      }
    }
  });

  return null;
}

export function useWorkerAnimationBinding(binding: WorkerAnimBinding) {
  registerWorkerAnimation(binding);
  useEffect(() => () => unregisterWorkerAnimation(binding.id), [binding.id]);
}
