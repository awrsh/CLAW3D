"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { WorkspaceShape } from "@/features/office/core/roomConfig";
import { WORKSPACE_LIMITS } from "@/features/office/core/roomConfig";

export type WorkspaceDraft = {
  x: number;
  z: number;
  width: number;
  depth: number;
  shape: WorkspaceShape;
};

export type DrawBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

type WorkspaceDrawControllerProps = {
  enabled: boolean;
  floorY: number;
  shape: WorkspaceShape;
  snapToGrid: boolean;
  /** Draw only inside this AABB (selected workspace or floor). */
  clipBounds: DrawBounds;
  onCommit: (draft: WorkspaceDraft) => void;
};

function snapValue(value: number, enabled: boolean): number {
  if (!enabled) return value;
  return Math.round(value * 2) / 2;
}

function pointInBounds(x: number, z: number, bounds: DrawBounds): boolean {
  return (
    x >= bounds.minX &&
    x <= bounds.maxX &&
    z >= bounds.minZ &&
    z <= bounds.maxZ
  );
}

function clampPoint(
  x: number,
  z: number,
  bounds: DrawBounds,
): { x: number; z: number } {
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, x)),
    z: Math.min(bounds.maxZ, Math.max(bounds.minZ, z)),
  };
}

function rectFromCorners(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  shape: WorkspaceShape,
): WorkspaceDraft {
  let minX = Math.min(ax, bx);
  let maxX = Math.max(ax, bx);
  let minZ = Math.min(az, bz);
  let maxZ = Math.max(az, bz);
  let width = Math.max(WORKSPACE_LIMITS.width.min, maxX - minX);
  let depth = Math.max(WORKSPACE_LIMITS.depth.min, maxZ - minZ);

  if (shape === "square") {
    const side = Math.max(width, depth);
    const signX = bx >= ax ? 1 : -1;
    const signZ = bz >= az ? 1 : -1;
    maxX = ax + signX * side;
    maxZ = az + signZ * side;
    minX = Math.min(ax, maxX);
    maxX = Math.max(ax, maxX);
    minZ = Math.min(az, maxZ);
    maxZ = Math.max(az, maxZ);
    width = side;
    depth = side;
  }

  return {
    x: (minX + maxX) / 2,
    z: (minZ + maxZ) / 2,
    width,
    depth,
    shape,
  };
}

function clampDraftToBounds(
  draft: WorkspaceDraft,
  bounds: DrawBounds,
): WorkspaceDraft | null {
  const minX = Math.max(bounds.minX, draft.x - draft.width / 2);
  const maxX = Math.min(bounds.maxX, draft.x + draft.width / 2);
  const minZ = Math.max(bounds.minZ, draft.z - draft.depth / 2);
  const maxZ = Math.min(bounds.maxZ, draft.z + draft.depth / 2);
  const width = maxX - minX;
  const depth = maxZ - minZ;
  if (
    width < WORKSPACE_LIMITS.width.min ||
    depth < WORKSPACE_LIMITS.depth.min
  ) {
    return null;
  }
  return {
    ...draft,
    x: (minX + maxX) / 2,
    z: (minZ + maxZ) / 2,
    width,
    depth,
    shape:
      draft.shape === "square" && Math.abs(width - depth) < 0.001
        ? "square"
        : "rectangle",
  };
}

/**
 * Drag on the active floor plane to draw a rectangle/square workspace unit.
 * Pointer hits are clamped to `clipBounds` (selected unit or whole floor).
 */
export function WorkspaceDrawController({
  enabled,
  floorY,
  shape,
  snapToGrid,
  clipBounds,
  onCommit,
}: WorkspaceDrawControllerProps) {
  const { camera, gl } = useThree();
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;
  const boundsRef = useRef(clipBounds);
  boundsRef.current = clipBounds;

  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), -floorY),
    [floorY],
  );
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  const startRef = useRef<{ x: number; z: number } | null>(null);
  const [preview, setPreview] = useState<WorkspaceDraft | null>(null);

  useEffect(() => {
    if (!enabled) {
      startRef.current = null;
      setPreview(null);
      return;
    }

    const element = gl.domElement;
    element.style.cursor = "crosshair";

    const project = (event: PointerEvent): { x: number; z: number } | null => {
      const rect = element.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      if (!raycaster.ray.intersectPlane(plane, hit)) return null;
      const snapped = {
        x: snapValue(hit.x, snapToGrid),
        z: snapValue(hit.z, snapToGrid),
      };
      return clampPoint(snapped.x, snapped.z, boundsRef.current);
    };

    const handleDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const point = project(event);
      if (!point) return;
      // Start only when the raw hit is inside the clip frame.
      const rect = element.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      if (!raycaster.ray.intersectPlane(plane, hit)) return;
      const rawX = snapValue(hit.x, snapToGrid);
      const rawZ = snapValue(hit.z, snapToGrid);
      if (!pointInBounds(rawX, rawZ, boundsRef.current)) return;

      event.preventDefault();
      startRef.current = point;
      const draft = clampDraftToBounds(
        rectFromCorners(point.x, point.z, point.x, point.z, shape),
        boundsRef.current,
      );
      setPreview(draft);
    };

    const handleMove = (event: PointerEvent) => {
      const start = startRef.current;
      if (!start) return;
      const point = project(event);
      if (!point) return;
      setPreview(
        clampDraftToBounds(
          rectFromCorners(start.x, start.z, point.x, point.z, shape),
          boundsRef.current,
        ),
      );
    };

    const handleUp = (event: PointerEvent) => {
      const start = startRef.current;
      if (!start) return;
      const point = project(event) ?? start;
      const dragDistance = Math.hypot(point.x - start.x, point.z - start.z);
      startRef.current = null;
      setPreview(null);
      // Ignore short clicks (used for selecting an existing unit).
      if (dragDistance < 0.4) return;
      const draft = clampDraftToBounds(
        rectFromCorners(start.x, start.z, point.x, point.z, shape),
        boundsRef.current,
      );
      if (draft) onCommitRef.current(draft);
    };

    element.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);

    return () => {
      element.style.cursor = "";
      element.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [
    camera,
    enabled,
    gl.domElement,
    hit,
    plane,
    pointer,
    raycaster,
    shape,
    snapToGrid,
  ]);

  if (!preview) return null;

  return (
    <group position={[preview.x, floorY + 0.03, preview.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[preview.width, preview.depth]} />
        <meshStandardMaterial
          color="#5b9bd5"
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry
          args={[
            Math.max(0.1, preview.width - 0.08),
            Math.max(0.1, preview.depth - 0.08),
          ]}
        />
        <meshBasicMaterial
          color="#9ec9f0"
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
