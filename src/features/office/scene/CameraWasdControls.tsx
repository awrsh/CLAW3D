"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type OrbitLike = {
  target: THREE.Vector3;
  update: () => void;
  enabled: boolean;
};

type CameraWasdControlsProps = {
  /** When false (e.g. dragging an object), skip movement. */
  enabled?: boolean;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

/**
 * Pan the orbit pivot + camera on the floor plane with WASD
 * (camera-relative: W forward on screen, A/D strafe).
 */
export function CameraWasdControls({ enabled = true }: CameraWasdControlsProps) {
  const { camera } = useThree();
  const controls = useThree((state) => state.controls) as OrbitLike | null;
  const keysRef = useRef(new Set<string>());
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const delta = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const onDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (
        event.code === "KeyW" ||
        event.code === "KeyA" ||
        event.code === "KeyS" ||
        event.code === "KeyD"
      ) {
        keysRef.current.add(event.code);
        event.preventDefault();
      }
    };
    const onUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.code);
    };
    const onBlur = () => {
      keysRef.current.clear();
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  useFrame((_, rawDt) => {
    if (!enabled || !controls?.target) return;
    const keys = keysRef.current;
    if (keys.size === 0) return;

    const dt = Math.min(rawDt, 0.05);
    // Ortho scenes feel better a bit snappier.
    const speed = 14 * dt;

    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 1e-6) {
      forward.set(0, 0, -1);
    } else {
      forward.normalize();
    }
    right.crossVectors(forward, up).normalize();

    delta.set(0, 0, 0);
    if (keys.has("KeyW")) delta.addScaledVector(forward, speed);
    if (keys.has("KeyS")) delta.addScaledVector(forward, -speed);
    if (keys.has("KeyD")) delta.addScaledVector(right, speed);
    if (keys.has("KeyA")) delta.addScaledVector(right, -speed);
    if (delta.lengthSq() === 0) return;

    controls.target.add(delta);
    camera.position.add(delta);
    controls.update();
  });

  return null;
}
