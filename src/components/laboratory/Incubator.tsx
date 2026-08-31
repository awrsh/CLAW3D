"use client";

import { memo } from "react";
import { LAB_COLORS } from "@/components/laboratory/sceneConfig";
import type { GlbProxyProps } from "@/components/laboratory/GlbEquipment";

export const IncubatorProxy = memo(function IncubatorProxy({
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
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 1.3, 0.75]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.45} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.65, 0.39]}>
        <boxGeometry args={[0.85, 1.1, 0.03]} />
        <meshPhysicalMaterial color={LAB_COLORS.glass} transmission={0.35} transparent opacity={0.65} />
      </mesh>
      <mesh position={[0.32, 0.85, 0.42]}>
        <planeGeometry args={[0.22, 0.12]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
    </group>
  );
});
