"use client";

import { memo } from "react";
import type { FloorConfig } from "@/features/office/core/roomConfig";

type OfficeWallsProps = {
  config: Pick<
    FloorConfig,
    "width" | "depth" | "wallHeight" | "wallThickness" | "wallColor"
  >;
};

/**
 * Four walls + dark baseboards around the floor.
 * Dimensions come from Tools — change length / width / height in the UI.
 */
export const OfficeWalls = memo(function OfficeWalls({ config }: OfficeWallsProps) {
  const { width, depth, wallHeight, wallThickness, wallColor } = config;
  const halfW = width / 2;
  const halfD = depth / 2;
  const wallY = wallHeight / 2;
  const wallEmissive = "#4e342e";
  const baseboardHeight = Math.min(0.06, wallHeight * 0.12);
  const baseboardDepth = Math.min(0.04, wallThickness * 0.5);

  return (
    <group>
      {/* North (−Z) */}
      <mesh position={[0, wallY, -halfD]} receiveShadow castShadow>
        <boxGeometry args={[width, wallHeight, wallThickness]} />
        <meshStandardMaterial
          color={wallColor}
          emissive={wallEmissive}
          emissiveIntensity={0.35}
          roughness={0.9}
        />
      </mesh>

      {/* South (+Z) */}
      <mesh position={[0, wallY, halfD]} receiveShadow castShadow>
        <boxGeometry args={[width, wallHeight, wallThickness]} />
        <meshStandardMaterial
          color={wallColor}
          emissive={wallEmissive}
          emissiveIntensity={0.35}
          roughness={0.9}
        />
      </mesh>

      {/* West (−X) */}
      <mesh position={[-halfW, wallY, 0]} receiveShadow castShadow>
        <boxGeometry args={[wallThickness, wallHeight, depth]} />
        <meshStandardMaterial
          color={wallColor}
          emissive={wallEmissive}
          emissiveIntensity={0.35}
          roughness={0.9}
        />
      </mesh>

      {/* East (+X) */}
      <mesh position={[halfW, wallY, 0]} receiveShadow castShadow>
        <boxGeometry args={[wallThickness, wallHeight, depth]} />
        <meshStandardMaterial
          color={wallColor}
          emissive={wallEmissive}
          emissiveIntensity={0.35}
          roughness={0.9}
        />
      </mesh>

      {/* Baseboards */}
      <mesh position={[0, baseboardHeight / 2, -halfD + baseboardDepth]}>
        <boxGeometry args={[width, baseboardHeight, baseboardDepth]} />
        <meshLambertMaterial color="#0c0c10" />
      </mesh>
      <mesh position={[0, baseboardHeight / 2, halfD - baseboardDepth]}>
        <boxGeometry args={[width, baseboardHeight, baseboardDepth]} />
        <meshLambertMaterial color="#0c0c10" />
      </mesh>
      <mesh position={[-halfW + baseboardDepth, baseboardHeight / 2, 0]}>
        <boxGeometry args={[baseboardDepth, baseboardHeight, depth]} />
        <meshLambertMaterial color="#0c0c10" />
      </mesh>
      <mesh position={[halfW - baseboardDepth, baseboardHeight / 2, 0]}>
        <boxGeometry args={[baseboardDepth, baseboardHeight, depth]} />
        <meshLambertMaterial color="#0c0c10" />
      </mesh>
    </group>
  );
});
