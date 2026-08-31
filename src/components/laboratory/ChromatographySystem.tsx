"use client";

import { memo } from "react";
import { LAB_COLORS } from "@/components/laboratory/sceneConfig";
import type { GlbProxyProps } from "@/components/laboratory/GlbEquipment";

/** Proxy — HPLC / chromatography rack */
export const ChromatographyProxy = memo(function ChromatographyProxy({
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
        <boxGeometry args={[1.1, 1.1, 0.55]} />
        <meshStandardMaterial color={LAB_COLORS.steelBright} metalness={0.7} roughness={0.28} />
      </mesh>
      <mesh position={[-0.25, 0.95, 0.2]}>
        <boxGeometry args={[0.35, 0.25, 0.08]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
      {[-0.3, 0, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.35, 0.22]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.35, 10]} />
          <meshStandardMaterial color={LAB_COLORS.steel} metalness={0.85} roughness={0.22} />
        </mesh>
      ))}
    </group>
  );
});
