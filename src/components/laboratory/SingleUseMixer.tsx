"use client";

import { memo } from "react";
import { LAB_COLORS } from "@/components/laboratory/sceneConfig";
import type { GlbProxyProps } from "@/components/laboratory/GlbEquipment";

export const SingleUseMixerProxy = memo(function SingleUseMixerProxy({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onPointerOver,
  onPointerOut,
  onClick,
}: GlbProxyProps) {
  const scaleVec = Array.isArray(scale) ? scale : ([scale, scale, scale] as const);

  return (
    <group
      position={position}
      rotation={rotation}
      scale={scaleVec}
      onPointerOver={(e) => {
        e.stopPropagation();
        onPointerOver?.();
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onPointerOut?.();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* Cart frame */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.9, 0.65]} />
        <meshStandardMaterial color={LAB_COLORS.steelBright} metalness={0.75} roughness={0.28} />
      </mesh>

      {/* Single-use bag */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.42, 0.95, 24]} />
        <meshPhysicalMaterial
          color="#f8fafc"
          metalness={0}
          roughness={0.35}
          transmission={0.12}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Mixer motor head */}
      <mesh position={[0, 1.62, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.35, 20]} />
        <meshStandardMaterial color={LAB_COLORS.graphite} metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <boxGeometry args={[0.42, 0.12, 0.42]} />
        <meshStandardMaterial color={LAB_COLORS.steel} metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Impeller shaft hint */}
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.55, 8]} />
        <meshStandardMaterial color={LAB_COLORS.steelBright} metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Wheels */}
      {[
        [-0.32, 0.08, 0.22],
        [0.32, 0.08, 0.22],
        [-0.32, 0.08, -0.22],
        [0.32, 0.08, -0.22],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
});
