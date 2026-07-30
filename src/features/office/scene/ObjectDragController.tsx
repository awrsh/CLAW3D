"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type ObjectDragControllerProps = {
  draggingId: string | null;
  /** World Y of the active floor slab. */
  floorY: number;
  onMove: (x: number, z: number) => void;
  onEnd: () => void;
};

/**
 * Raycasts the active floor plane while the pointer is dragged,
 * so objects can be moved freely with the mouse.
 */
export function ObjectDragController({
  draggingId,
  floorY,
  onMove,
  onEnd,
}: ObjectDragControllerProps) {
  const { camera, gl } = useThree();
  const onMoveRef = useRef(onMove);
  const onEndRef = useRef(onEnd);
  onMoveRef.current = onMove;
  onEndRef.current = onEnd;

  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), -floorY),
    [floorY],
  );
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (!draggingId) return;

    const element = gl.domElement;
    element.style.cursor = "grabbing";

    const handleMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(plane, hit)) {
        onMoveRef.current(hit.x, hit.z);
      }
    };

    const handleUp = () => {
      onEndRef.current();
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
  }, [camera, draggingId, gl.domElement, hit, plane, pointer, raycaster]);

  return null;
}
