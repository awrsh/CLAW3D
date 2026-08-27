"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type ObjectDragControllerProps = {
  /** Object under pointer (selected for potential drag). */
  grabId: string | null;
  /** True once movement passed the threshold. */
  dragging: boolean;
  /** World Y of the active floor slab. */
  floorY: number;
  /** Screen pixels before a grab becomes a real drag. */
  thresholdPx?: number;
  onPromote: () => void;
  onMove: (x: number, z: number) => void;
  /** `moved` is true only if the pointer crossed the drag threshold. */
  onEnd: (moved: boolean) => void;
};

/**
 * Floor-plane drag with a movement threshold so casual clicks
 * (or accidental mouse bumps) do not relocate furniture.
 */
export function ObjectDragController({
  grabId,
  dragging,
  floorY,
  thresholdPx = 10,
  onPromote,
  onMove,
  onEnd,
}: ObjectDragControllerProps) {
  const { camera, gl } = useThree();
  const onPromoteRef = useRef(onPromote);
  const onMoveRef = useRef(onMove);
  const onEndRef = useRef(onEnd);
  onPromoteRef.current = onPromote;
  onMoveRef.current = onMove;
  onEndRef.current = onEnd;

  const originRef = useRef<{ x: number; y: number } | null>(null);
  const promotedRef = useRef(false);

  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), -floorY),
    [floorY],
  );
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    promotedRef.current = dragging;
  }, [dragging]);

  useEffect(() => {
    if (!grabId) {
      originRef.current = null;
      promotedRef.current = false;
      return;
    }

    const element = gl.domElement;
    originRef.current = null;

    const project = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      return raycaster.ray.intersectPlane(plane, hit) ? hit : null;
    };

    const handleMove = (event: PointerEvent) => {
      if (!originRef.current) {
        originRef.current = { x: event.clientX, y: event.clientY };
      }
      const ox = originRef.current.x;
      const oy = originRef.current.y;
      const dist = Math.hypot(event.clientX - ox, event.clientY - oy);

      if (!promotedRef.current) {
        if (dist < thresholdPx) return;
        promotedRef.current = true;
        element.style.cursor = "grabbing";
        onPromoteRef.current();
      }

      const point = project(event);
      if (point) onMoveRef.current(point.x, point.z);
    };

    const handleUp = () => {
      const moved = promotedRef.current;
      originRef.current = null;
      promotedRef.current = false;
      element.style.cursor = "";
      onEndRef.current(moved);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);

    return () => {
      element.style.cursor = "";
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [
    camera,
    gl.domElement,
    grabId,
    hit,
    plane,
    pointer,
    raycaster,
    thresholdPx,
  ]);

  return null;
}
