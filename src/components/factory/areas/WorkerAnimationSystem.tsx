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
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  speed: number;
  baseYaw: number;
  walking: boolean;
};

const bindings = new Map<string, WorkerAnimBinding>();

export function registerWorkerAnimation(binding: WorkerAnimBinding) {
  bindings.set(binding.id, binding);
}

export function unregisterWorkerAnimation(id: string) {
  bindings.delete(id);
}

/** Single animation tick for every worker — avoids N separate useFrame subscriptions. */
export function WorkerAnimationLoop() {
  const dir = useRef(new THREE.Vector3());

  useFrame(({ clock }) => {
    if (bindings.size === 0) return;

    const t = clock.elapsedTime;

    for (const entry of bindings.values()) {
      const {
        rootRef,
        bodyRef,
        leftArmRef,
        rightArmRef,
        leftLegRef,
        rightLegRef,
        startPos,
        endPos,
        speed,
        baseYaw,
        walking,
      } = entry;

      if (walking && rootRef.current) {
        const phase = (Math.sin(t * speed) + 1) * 0.5;
        rootRef.current.position.lerpVectors(startPos, endPos, phase);

        const movingToEnd = Math.cos(t * speed) >= 0;
        dir.current.copy(endPos).sub(startPos);
        if (dir.current.lengthSq() > 0.001) {
          const yaw =
            Math.atan2(movingToEnd ? dir.current.x : -dir.current.x, movingToEnd ? dir.current.z : -dir.current.z) + baseYaw;
          rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, yaw, 0.12);
        }

        const walkCycle = t * speed * 2.2;
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
  useEffect(() => {
    return () => unregisterWorkerAnimation(binding.id);
  }, [binding.id]);

  registerWorkerAnimation(binding);
}
