"use client";

import { memo } from "react";
import { LAB_COLORS } from "@/components/laboratory/sceneConfig";
import type { GlbProxyProps } from "@/components/laboratory/GlbEquipment";

export const LaboratoryCabinetProxy = memo(function LaboratoryCabinetProxy({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onPointerOver,
  onPointerOut,
  onClick,
}: GlbProxyProps) {
  const scaleVec = Array.isArray(scale) ? scale : ([scale, scale, scale] as const);
  const w = 1.1;
  const h = 2.05;
  const d = 0.48;

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
      {/* Carcass */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={LAB_COLORS.wall} metalness={0.08} roughness={0.55} />
      </mesh>

      {/* Glass doors */}
      {[-0.27, 0.27].map((x) => (
        <mesh key={x} position={[x, h / 2, d / 2 + 0.01]}>
          <boxGeometry args={[0.48, h * 0.88, 0.025]} />
          <meshPhysicalMaterial
            color={LAB_COLORS.glass}
            metalness={0.05}
            roughness={0.04}
            transmission={0.55}
            transparent
            opacity={0.75}
          />
        </mesh>
      ))}

      {/* Handles */}
      {[-0.27, 0.27].map((x) => (
        <mesh key={`handle-${x}`} position={[x + (x < 0 ? 0.18 : -0.18), h / 2, d / 2 + 0.04]}>
          <boxGeometry args={[0.02, 0.18, 0.03]} />
          <meshStandardMaterial color={LAB_COLORS.steel} metalness={0.85} roughness={0.2} />
        </mesh>
      ))}

      {/* Internal shelves hint */}
      {[0.55, 1.05, 1.55].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[w * 0.92, 0.015, d * 0.85]} />
          <meshStandardMaterial color={LAB_COLORS.steelBright} metalness={0.6} roughness={0.35} />
        </mesh>
      ))}

      {/* Reagent bottles silhouette */}
      {[
        [-0.2, 1.72, 0],
        [0, 1.68, 0.05],
        [0.22, 1.74, -0.02],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.035, 0.035, 0.14, 10]} />
          <meshPhysicalMaterial
            color={i === 1 ? "#dbeafe" : "#ecfdf5"}
            transmission={0.35}
            transparent
            opacity={0.85}
            roughness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
});
