"use client";

import { memo } from "react";
import { LAB_COLORS } from "@/components/laboratory/sceneConfig";
import type { GlbProxyProps } from "@/components/laboratory/GlbEquipment";

export const AutoclaveProxy = memo(function AutoclaveProxy({
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
        <cylinderGeometry args={[0.45, 0.5, 1.1, 20]} />
        <meshStandardMaterial color={LAB_COLORS.steel} metalness={0.82} roughness={0.24} />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.48, 0.45, 0.18, 20]} />
        <meshStandardMaterial color={LAB_COLORS.graphite} metalness={0.5} roughness={0.38} />
      </mesh>
      <mesh position={[0.35, 0.7, 0]}>
        <boxGeometry args={[0.12, 0.18, 0.06]} />
        <meshStandardMaterial color="#22c55e" emissive="#14532d" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
});
