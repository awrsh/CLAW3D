"use client";

import { memo } from "react";
import { LAB_COLORS } from "@/components/laboratory/sceneConfig";
import type { GlbProxyProps } from "@/components/laboratory/GlbEquipment";

export const MicroscopeProxy = memo(function MicroscopeProxy({
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
      {/* Base */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.32, 0.12, 0.38]} />
        <meshStandardMaterial color={LAB_COLORS.graphite} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Arm */}
      <mesh position={[0, 0.28, -0.08]} rotation={[0.25, 0, 0]} castShadow>
        <boxGeometry args={[0.08, 0.38, 0.08]} />
        <meshStandardMaterial color={LAB_COLORS.steel} metalness={0.75} roughness={0.28} />
      </mesh>

      {/* Stage */}
      <mesh position={[0, 0.18, 0.06]} castShadow>
        <boxGeometry args={[0.22, 0.02, 0.22]} />
        <meshStandardMaterial color={LAB_COLORS.steelBright} metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Body tube */}
      <mesh position={[0, 0.48, 0.02]} castShadow>
        <cylinderGeometry args={[0.055, 0.07, 0.32, 16]} />
        <meshStandardMaterial color={LAB_COLORS.graphiteDark} metalness={0.55} roughness={0.35} />
      </mesh>

      {/* Trinocular head — three eyepieces */}
      <group position={[0, 0.72, -0.02]}>
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.1, 0.14]} />
          <meshStandardMaterial color={LAB_COLORS.graphite} metalness={0.5} roughness={0.38} />
        </mesh>
        {[-0.09, 0, 0.09].map((x) => (
          <mesh key={x} position={[x, 0.1, -0.02]} rotation={[0.35, 0, 0]} castShadow>
            <cylinderGeometry args={[0.028, 0.032, 0.12, 12]} />
            <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.45} />
          </mesh>
        ))}
      </group>

      {/* Objective lens */}
      <mesh position={[0, 0.34, 0.06]}>
        <cylinderGeometry args={[0.025, 0.035, 0.08, 12]} />
        <meshStandardMaterial color={LAB_COLORS.steelBright} metalness={0.9} roughness={0.15} />
      </mesh>
    </group>
  );
});
