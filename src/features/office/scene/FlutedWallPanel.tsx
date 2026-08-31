"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { PerformanceMode } from "@/features/office/core/performanceMode";

export const FLUTED_WALL_GLB = "/models/minimalist_fluted_wall_panel.glb";

export type FlutedWallVariant = "solid" | "glass" | "brick" | "partition";
export type WallDetail = "simple" | "textured";

type WallAssets = {
  map: THREE.Texture | null;
  normalMap: THREE.Texture | null;
};

let cachedAssets: WallAssets | null = null;

function extractWallAssets(scene: THREE.Object3D): WallAssets {
  let map: THREE.Texture | null = null;
  let normalMap: THREE.Texture | null = null;

  scene.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh || map) return;
    const mesh = child as THREE.Mesh;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const src of mats) {
      if (!(src instanceof THREE.MeshStandardMaterial)) continue;
      map = src.map ?? null;
      normalMap = src.normalMap ?? null;
      if (map) break;
    }
  });

  return { map, normalMap };
}

function getWallAssets(scene: THREE.Object3D): WallAssets {
  if (!cachedAssets) cachedAssets = extractWallAssets(scene);
  return cachedAssets;
}

export function wallDetailForPerformance(mode: PerformanceMode): WallDetail {
  return mode === "high" ? "textured" : "simple";
}

export type WallRunProps = {
  span: number;
  height: number;
  depth?: number;
  color?: string;
  axis?: "x" | "z";
  variant?: FlutedWallVariant;
  detail?: WallDetail;
};

const WALL_RENDER_ORDER = 2;
const FLOOR_SEAL = 0.015;

function wallMeshY(height: number) {
  return height / 2 + FLOOR_SEAL / 2;
}

function wallMeshHeight(height: number) {
  return height + FLOOR_SEAL;
}

function wallMaterialProps(
  variant: FlutedWallVariant,
  color: string | undefined,
  detail: WallDetail,
  assets: WallAssets,
): THREE.MeshStandardMaterialParameters {
  const params: THREE.MeshStandardMaterialParameters = {
    roughness: 0.72,
    metalness: 0.04,
    color: color ?? "#eef1f4",
  };

  if (detail === "textured" && assets.map) {
    params.map = assets.map;
    params.map.wrapS = THREE.RepeatWrapping;
    params.map.wrapT = THREE.RepeatWrapping;
    if (assets.normalMap) {
      params.normalMap = assets.normalMap;
      params.normalMap.wrapS = THREE.RepeatWrapping;
      params.normalMap.wrapT = THREE.RepeatWrapping;
    }
    params.roughness = 0.65;
    params.metalness = 0.06;
  }

  switch (variant) {
    case "glass":
      params.transparent = true;
      params.opacity = detail === "textured" ? 0.38 : 0.28;
      params.metalness = 0.25;
      params.roughness = 0.1;
      params.color = color ?? "#c5d8e8";
      break;
    case "brick":
      params.color = color ?? "#b7aea6";
      params.roughness = 0.88;
      params.metalness = 0.03;
      break;
    case "partition":
      params.color = color ?? "#d7dde3";
      params.metalness = 0.18;
      params.roughness = 0.45;
      break;
    default:
      break;
  }

  return params;
}

/**
 * Lightweight wall — single box mesh per run (no heavy GLB instancing).
 * Textured mode tiles the panel albedo on high performance setting only.
 */
function WallRunSimple({
  span,
  height,
  depth = 0.12,
  color,
  axis = "x",
  variant = "solid",
}: Omit<WallRunProps, "detail">) {
  const { material, args } = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial(
      wallMaterialProps(variant, color, "simple", { map: null, normalMap: null }),
    );
    const size: [number, number, number] =
      axis === "x" ? [span, height, depth] : [depth, height, span];
    return { material: mat, args: size };
  }, [axis, color, depth, height, span, variant]);

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh
      position={[0, wallMeshY(height), 0]}
      material={material}
      castShadow={false}
      receiveShadow
      renderOrder={WALL_RENDER_ORDER}
    >
      <boxGeometry args={[args[0], wallMeshHeight(height), args[2]]} />
    </mesh>
  );
}

function WallRunTextured({
  span,
  height,
  depth = 0.12,
  color,
  axis = "x",
  variant = "solid",
}: Omit<WallRunProps, "detail">) {
  const { scene } = useGLTF(FLUTED_WALL_GLB);

  const { material, args } = useMemo(() => {
    const assets = getWallAssets(scene);
    const mat = new THREE.MeshStandardMaterial(
      wallMaterialProps(variant, color, "textured", assets),
    );

    const panelW = 0.56;
    const panelH = 0.315;
    if (assets.map) {
      mat.map!.repeat.set(
        Math.max(1, span / panelW),
        Math.max(1, height / panelH),
      );
      mat.map!.needsUpdate = true;
    }
    if (assets.normalMap) {
      mat.normalMap!.repeat.set(
        Math.max(1, span / panelW),
        Math.max(1, height / panelH),
      );
      mat.normalMap!.needsUpdate = true;
    }

    const size: [number, number, number] =
      axis === "x" ? [span, height, depth] : [depth, height, span];

    return { material: mat, args: size };
  }, [axis, color, depth, height, scene, span, variant]);

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh
      position={[0, wallMeshY(height), 0]}
      material={material}
      castShadow={false}
      receiveShadow
      renderOrder={WALL_RENDER_ORDER}
    >
      <boxGeometry args={[args[0], wallMeshHeight(height), args[2]]} />
    </mesh>
  );
}

export function WallRun({ detail = "simple", ...props }: WallRunProps) {
  if (detail === "textured") {
    return <WallRunTextured {...props} />;
  }
  return <WallRunSimple {...props} />;
}

/** @deprecated Use WallRun */
export const FlutedWallRun = WallRun;

useGLTF.preload(FLUTED_WALL_GLB);
