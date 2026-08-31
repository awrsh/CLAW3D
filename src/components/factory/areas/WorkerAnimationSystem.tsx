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
  /** Skip procedural limb swing — GLB handles walk visuals */
  useGltfCharacter?: boolean;
};

const bindings = new Map<string, WorkerAnimBinding>();

const _from = new THREE.Vector3();
const _to = new THREE.Vector3();
const _pos = new THREE.Vector3();

export function registerWorkerAnimation(binding: WorkerAnimBinding) {
  bindings.set(binding.id, binding);
}

export function unregisterWorkerAnimation(id: string) {
  bindings.delete(id);
}

function yawToward(from: THREE.Vector3, to: THREE.Vector3) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  if (dx * dx + dz * dz < 0.0004) return null;
  return Math.atan2(dx, dz);
}

function pathLength(waypoints: THREE.Vector3[]) {
  let total = 0;
  for (let i = 0; i < waypoints.length; i++) {
    const a = waypoints[i]!;
    const b = waypoints[(i + 1) % waypoints.length]!;
    total += a.distanceTo(b);
  }
  return total;
}

/** Sample closed patrol path at arc-length distance (meters). */
function samplePath(
  waypoints: THREE.Vector3[],
  offset: THREE.Vector3,
  distance: number,
  out: THREE.Vector3,
): { from: THREE.Vector3; to: THREE.Vector3 } | null {
  const n = waypoints.length;
  if (n < 2) return null;

  const total = pathLength(waypoints);
  if (total < 0.02) return null;

  let d = ((distance % total) + total) % total;

  for (let i = 0; i < n; i++) {
    const a = waypoints[i]!;
    const b = waypoints[(i + 1) % n]!;
    const segLen = a.distanceTo(b);
    if (d <= segLen || i === n - 1) {
      const t = segLen > 0.001 ? d / segLen : 0;
      out.copy(a).lerp(b, t).add(offset);
      _from.copy(a).add(offset);
      _to.copy(b).add(offset);
      return { from: _from, to: _to };
    }
    d -= segLen;
  }

  return null;
}

/** Single animation tick for every worker — distance-based path following. */
export function WorkerAnimationLoop() {
  const progress = useRef(new Map<string, { distance: number }>());

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
        useGltfCharacter,
      } = entry;

      if (!rootRef.current) continue;

      if (walking && waypoints.length >= 2) {
        let prog = progress.current.get(entry.id);
        if (!prog) {
          prog = { distance: 0 };
          progress.current.set(entry.id, prog);
        }

        prog.distance += Math.max(speed, 0.6) * delta;

        const sample = samplePath(waypoints, areaOffset, prog.distance, _pos);
        if (sample) {
          rootRef.current.position.copy(_pos);

          const targetYaw = yawToward(sample.from, sample.to);
          if (targetYaw !== null) {
            rootRef.current.rotation.y = THREE.MathUtils.lerp(
              rootRef.current.rotation.y,
              targetYaw,
              Math.min(1, delta * 10),
            );
          }
        }

        const walkCycle = elapsed * speed * 2.4;
        if (!useGltfCharacter) {
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
        }
      } else {
        progress.current.delete(entry.id);
        rootRef.current.rotation.y = THREE.MathUtils.lerp(
          rootRef.current.rotation.y,
          baseYaw,
          Math.min(1, delta * 6),
        );
        if (!useGltfCharacter) {
          if (leftArmRef.current) leftArmRef.current.rotation.z = Math.PI / 2;
          if (rightArmRef.current) rightArmRef.current.rotation.z = -Math.PI / 2;
          if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
          if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
          if (bodyRef.current) bodyRef.current.position.y = 0;
        }
      }
    }
  });

  return null;
}

export function useWorkerAnimationBinding(binding: WorkerAnimBinding) {
  registerWorkerAnimation(binding);
  useEffect(() => () => unregisterWorkerAnimation(binding.id), [binding.id]);
}
