"use client";

import { memo } from "react";
import { LAB_COLORS } from "@/components/laboratory/sceneConfig";
import type { GlbProxyProps } from "@/components/laboratory/GlbEquipment";

/** Proxy — replace with fume hood GLB (e.g. Meshy CC0 Laboratory Fume Hood) */
export const FumeHoodProxy = memo(function FumeHoodProxy({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onPointerOver,
  onPointerOut,
  onClick,
}: GlbProxyProps) {
  const s = Array.isArray(scale) ? scale : ([scale, scale, scale] as const);
  return (
    <group
      position={position}
      rotation={rotation}
      scale={s}
      onPointerOver={(e) => { e.stopPropagation(); onPointerOver?.(); }}
      onPointerOut={(e) => { e.stopPropagation(); onPointerOut?.(); }}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.1, 0.85]} />
        <meshStandardMaterial color={LAB_COLORS.wall} roughness={0.5} metalness={0.08} />
      </mesh>
      <mesh position={[0, 1.35, -0.1]}>
        <boxGeometry args={[1.5, 0.08, 0.7]} />
        <meshPhysicalMaterial color={LAB_COLORS.glass} transmission={0.5} transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, 0.9, 0.38]}>
        <boxGeometry args={[1.45, 0.75, 0.04]} />
        <meshPhysicalMaterial color={LAB_COLORS.glassTint} transmission={0.62} transparent opacity={0.45} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[1.5, 0.06, 0.9]} />
        <meshStandardMaterial color={LAB_COLORS.steelBright} metalness={0.65} roughness={0.32} />
      </mesh>
    </group>
  );
});
