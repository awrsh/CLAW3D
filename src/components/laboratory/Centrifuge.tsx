"use client";

import { memo } from "react";
import { LAB_COLORS } from "@/components/laboratory/sceneConfig";
import type { GlbProxyProps } from "@/components/laboratory/GlbEquipment";

/** Proxy — replace with GLB from Sketchfab lab-centrifugi (CC Attribution) */
export const CentrifugeProxy = memo(function CentrifugeProxy({
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
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.48, 0.44, 24]} />
        <meshStandardMaterial color={LAB_COLORS.steelBright} metalness={0.78} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.52, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.38, 0.28, 24]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.35} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.03, 24]} />
        <meshPhysicalMaterial color={LAB_COLORS.glass} transmission={0.4} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.28, 0.45, 0]}>
        <boxGeometry args={[0.18, 0.12, 0.08]} />
        <meshStandardMaterial color={LAB_COLORS.graphite} metalness={0.4} roughness={0.45} />
      </mesh>
    </group>
  );
});
