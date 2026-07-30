"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import type { ObjectType } from "@/features/office/core/objects";

export const FURNITURE_GLB: Partial<Record<ObjectType, string>> = {
  desk_cubicle: "/office-assets/models/furniture/desk.glb",
  executive_desk: "/office-assets/models/furniture/deskCorner.glb",
  chair: "/office-assets/models/furniture/chairDesk.glb",
  round_table: "/office-assets/models/furniture/tableRound.glb",
  couch: "/office-assets/models/furniture/loungeSofa.glb",
  couch_v: "/office-assets/models/furniture/loungeDesignChair.glb",
  bookshelf: "/office-assets/models/furniture/bookcaseClosed.glb",
  plant: "/office-assets/models/furniture/pottedPlant.glb",
  beanbag: "/office-assets/models/furniture/loungeDesignChair.glb",
  table_rect: "/office-assets/models/furniture/table.glb",
  coffee_machine: "/office-assets/models/furniture/kitchenCoffeeMachine.glb",
  fridge: "/office-assets/models/furniture/kitchenFridgeSmall.glb",
  water_cooler: "/office-assets/models/furniture/plantSmall1.glb",
  whiteboard: "/office-assets/models/furniture/bookcaseClosed.glb",
  kanban_board: "/office-assets/models/furniture/deskCorner.glb",
  cabinet: "/office-assets/models/furniture/kitchenCabinet.glb",
  computer: "/office-assets/models/furniture/computerScreen.glb",
  lamp: "/office-assets/models/furniture/lampRoundFloor.glb",
  printer: "/office-assets/models/furniture/kitchenCoffeeMachine.glb",
};

export const FURNITURE_SCALE: Partial<Record<ObjectType, [number, number, number]>> =
  {
    desk_cubicle: [1.5, 1.5, 1.5],
    executive_desk: [1.8, 1.8, 1.8],
    chair: [1.2, 1.2, 1.2],
    round_table: [3.2, 3.2, 3.2],
    couch: [1.8, 1.8, 1.8],
    couch_v: [1.4, 1.4, 1.4],
    bookshelf: [1.5, 2, 1.5],
    plant: [1.2, 1.8, 1.2],
    beanbag: [1, 1, 1],
    table_rect: [1.4, 1.2, 1.0],
    coffee_machine: [0.8, 0.8, 0.8],
    fridge: [1, 1.4, 1],
    water_cooler: [1, 2, 1],
    whiteboard: [0.6, 1.4, 0.3],
    kanban_board: [1.8, 1.8, 1.8],
    cabinet: [2.6, 1.2, 1],
    computer: [1.1, 1.1, 1.1],
    lamp: [1.2, 1.2, 1.2],
    printer: [1, 1.2, 0.8],
  };

export const FURNITURE_Y_OFFSET: Partial<Record<ObjectType, number>> = {
  computer: 0.61,
};

export const FURNITURE_TINT: Partial<Record<ObjectType, string | null>> = {
  desk_cubicle: "#8b5e32",
  executive_desk: "#6b3c1a",
  chair: "#4a5568",
  round_table: "#9a6332",
  couch: "#3d5575",
  couch_v: "#5a4870",
  bookshelf: "#5c3520",
  beanbag: null,
  computer: "#363c58",
  table_rect: "#7a5028",
  coffee_machine: "#2d2d38",
  fridge: "#505a60",
  water_cooler: "#3a5070",
  whiteboard: "#f4f2ee",
  kanban_board: "#8b5e32",
  cabinet: "#3c4248",
  plant: null,
  lamp: "#c8a060",
  printer: "#404858",
};

export const FURNITURE_BASE_ROTATION: Partial<Record<ObjectType, number>> = {
  couch: Math.PI,
  couch_v: Math.PI / 2,
  executive_desk: -Math.PI / 2,
  whiteboard: Math.PI / 2,
};

const SHADOW_CASTING = new Set<ObjectType>([
  "desk_cubicle",
  "executive_desk",
  "round_table",
  "table_rect",
  "couch",
  "couch_v",
  "bookshelf",
  "cabinet",
  "fridge",
]);

export function hasFurnitureGlb(type: ObjectType): boolean {
  return Boolean(FURNITURE_GLB[type]);
}

type FurnitureGlbModelProps = {
  type: ObjectType;
  color?: string;
};

/**
 * Exact old-version GLB furniture (tint + scale), centered at local origin.
 */
export function FurnitureGlbModel({ type, color }: FurnitureGlbModelProps) {
  const glbPath = FURNITURE_GLB[type] ?? FURNITURE_GLB.table_rect!;
  const { scene } = useGLTF(glbPath);
  const scale = FURNITURE_SCALE[type] ?? ([1, 1, 1] as [number, number, number]);
  const yOffset = FURNITURE_Y_OFFSET[type] ?? 0;
  const baseRot = FURNITURE_BASE_ROTATION[type] ?? 0;

  const cloned = useMemo(() => {
    const rawTint =
      type === "beanbag" ? (color ?? null) : (FURNITURE_TINT[type] ?? null);
    const tintColor = rawTint ? new THREE.Color(rawTint) : null;
    const template = scene.clone(true);
    const castShadow = SHADOW_CASTING.has(type);
    template.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const nextMats = mats.map((material) => {
        const next = material.clone() as THREE.MeshStandardMaterial;
        if (tintColor && "color" in next) next.color.lerp(tintColor, 0.8);
        if ("roughness" in next) next.roughness = 0.65;
        if ("metalness" in next) next.metalness = 0.08;
        return next;
      });
      mesh.material = Array.isArray(mesh.material) ? nextMats : nextMats[0]!;
    });
    return template;
  }, [color, scene, type]);

  return (
    <group position={[0, yOffset, 0]} rotation={[0, baseRot, 0]} scale={scale}>
      <primitive object={cloned} />
    </group>
  );
}

Object.values(FURNITURE_GLB).forEach((url) => {
  if (url) useGLTF.preload(url);
});
