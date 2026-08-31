"use client";

import { memo } from "react";
import { LAB_COLORS } from "@/components/laboratory/sceneConfig";
import { LAYOUT } from "@/components/laboratory/labLayout";

export const LaboratoryAirlock = memo(function LaboratoryAirlock() {
  const [x, , z] = LAYOUT.airlockEntry;
  return (
    <group position={[x - 1.2, 0, z - 1.0]} name="airlock-entry">
      <mesh position={[0, 1.15, 0.45]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 2.3, 1.2]} />
        <meshStandardMaterial color={LAB_COLORS.wallAccent} roughness={0.48} metalness={0.06} />
      </mesh>
      <mesh position={[0, 1.15, 1.02]}>
        <boxGeometry args={[1.45, 2.05, 0.04]} />
        <meshPhysicalMaterial
          color={LAB_COLORS.glass}
          transmission={0.55}
          transparent
          opacity={0.4}
          roughness={0.05}
        />
      </mesh>
      <mesh position={[0.72, 1.15, 0.45]}>
        <boxGeometry args={[0.04, 2.05, 1.0]} />
        <meshPhysicalMaterial
          color={LAB_COLORS.glass}
          transmission={0.55}
          transparent
          opacity={0.4}
        />
      </mesh>
      <mesh position={[-0.65, 1.9, 1.02]}>
        <boxGeometry args={[0.14, 0.06, 0.02]} />
        <meshStandardMaterial color="#22c55e" emissive="#14532d" emissiveIntensity={0.55} />
      </mesh>
    </group>
  );
});
