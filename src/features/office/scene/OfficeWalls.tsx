"use client";

import { memo } from "react";
import type { FloorConfig } from "@/features/office/core/roomConfig";
import { WallRun, wallDetailForPerformance } from "@/features/office/scene/FlutedWallPanel";

type OfficeWallsProps = {
  config: Pick<
    FloorConfig,
    "width" | "depth" | "wallHeight" | "wallThickness" | "wallColor"
  >;
  wallDetail?: ReturnType<typeof wallDetailForPerformance>;
};

/**
 * Perimeter walls — minimalist fluted panel tiles (GLB).
 */
export const OfficeWalls = memo(function OfficeWalls({
  config,
  wallDetail = "simple",
}: OfficeWallsProps) {
  const { width, depth, wallHeight, wallThickness, wallColor } = config;
  const halfW = width / 2;
  const halfD = depth / 2;
  const skirtH = Math.min(0.08, wallHeight * 0.1);
  const crownH = Math.min(0.05, wallHeight * 0.06);
  const trimD = Math.min(0.035, wallThickness * 0.55);
  const metal = "#9aa3ad";
  const metalDark = "#6b7380";

  return (
    <group>
      <group position={[0, 0, -halfD]}>
        <WallRun
          span={width}
          height={wallHeight}
          depth={wallThickness}
          color={wallColor}
          axis="x"
          detail={wallDetail}
        />
      </group>
      <group position={[0, 0, halfD]}>
        <WallRun
          span={width}
          height={wallHeight}
          depth={wallThickness}
          color={wallColor}
          axis="x"
          detail={wallDetail}
        />
      </group>
      <group position={[-halfW, 0, 0]}>
        <WallRun
          span={depth}
          height={wallHeight}
          depth={wallThickness}
          color={wallColor}
          axis="z"
          detail={wallDetail}
        />
      </group>
      <group position={[halfW, 0, 0]}>
        <WallRun
          span={depth}
          height={wallHeight}
          depth={wallThickness}
          color={wallColor}
          axis="z"
          detail={wallDetail}
        />
      </group>

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
