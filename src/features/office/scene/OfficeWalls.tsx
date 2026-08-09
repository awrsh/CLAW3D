"use client";

import { memo } from "react";
import type { FloorConfig } from "@/features/office/core/roomConfig";

type OfficeWallsProps = {
  config: Pick<
    FloorConfig,
    "width" | "depth" | "wallHeight" | "wallThickness" | "wallColor"
  >;
};

function WallFace({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  const [w, h, t] = size;
  const [x, y, z] = position;
  const skim = 0.004;

  return (
    <group position={[x, y, z]}>
      {/* Main plaster */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, t]} />
        <meshStandardMaterial
          color={color}
          roughness={0.72}
          metalness={0.04}
        />
      </mesh>
      {/* Soft highlight skim coat */}
      <mesh position={[0, 0, t / 2 + skim]} receiveShadow>
        <planeGeometry args={[Math.max(0.01, w - 0.08), Math.max(0.01, h - 0.12)]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.06}
          roughness={0.9}
          metalness={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Modern perimeter walls: cool plaster, slim aluminum skirting + crown.
 */
export const OfficeWalls = memo(function OfficeWalls({ config }: OfficeWallsProps) {
  const { width, depth, wallHeight, wallThickness, wallColor } = config;
  const halfW = width / 2;
  const halfD = depth / 2;
  const wallY = wallHeight / 2;
  const skirtH = Math.min(0.08, wallHeight * 0.1);
  const crownH = Math.min(0.05, wallHeight * 0.06);
  const trimD = Math.min(0.035, wallThickness * 0.55);
  const metal = "#9aa3ad";
  const metalDark = "#6b7380";

  return (
    <group>
      <WallFace
        position={[0, wallY, -halfD]}
        size={[width, wallHeight, wallThickness]}
        color={wallColor}
      />
      <WallFace
        position={[0, wallY, halfD]}
        size={[width, wallHeight, wallThickness]}
        color={wallColor}
      />
      <WallFace
        position={[-halfW, wallY, 0]}
        size={[wallThickness, wallHeight, depth]}
        color={wallColor}
      />
      <WallFace
        position={[halfW, wallY, 0]}
        size={[wallThickness, wallHeight, depth]}
        color={wallColor}
      />

      {/* Aluminum skirting */}
      {(
        [
          [0, skirtH / 2, -halfD + trimD, width, skirtH, trimD],
          [0, skirtH / 2, halfD - trimD, width, skirtH, trimD],
          [-halfW + trimD, skirtH / 2, 0, trimD, skirtH, depth],
          [halfW - trimD, skirtH / 2, 0, trimD, skirtH, depth],
        ] as const
      ).map((entry, index) => (
        <mesh key={`skirt-${index}`} position={[entry[0], entry[1], entry[2]]}>
          <boxGeometry args={[entry[3], entry[4], entry[5]]} />
          <meshStandardMaterial
            color={metalDark}
            metalness={0.65}
            roughness={0.35}
          />
        </mesh>
      ))}

      {/* Slim crown molding */}
      {(
        [
          [0, wallHeight - crownH / 2, -halfD + trimD, width, crownH, trimD],
          [0, wallHeight - crownH / 2, halfD - trimD, width, crownH, trimD],
          [-halfW + trimD, wallHeight - crownH / 2, 0, trimD, crownH, depth],
          [halfW - trimD, wallHeight - crownH / 2, 0, trimD, crownH, depth],
        ] as const
      ).map((entry, index) => (
        <mesh key={`crown-${index}`} position={[entry[0], entry[1], entry[2]]}>
          <boxGeometry args={[entry[3], entry[4], entry[5]]} />
          <meshStandardMaterial color={metal} metalness={0.55} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
});
