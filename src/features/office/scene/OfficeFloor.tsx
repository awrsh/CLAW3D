"use client";

import { memo } from "react";
import type { FloorConfig } from "@/features/office/core/roomConfig";

type OfficeFloorProps = {
  config: Pick<FloorConfig, "width" | "depth" | "floorColor" | "showFloorGrain">;
  grainLineCount?: number;
};

/**
 * Wood office floor centered at the origin.
 * Size comes from Tools (width × depth) — no canvas-pixel math needed.
 */
export const OfficeFloor = memo(function OfficeFloor({
  config,
  grainLineCount = 18,
}: OfficeFloorProps) {
  const { width, depth, floorColor, showFloorGrain } = config;

  return (
    <group>
      <mesh
        position={[0, -0.015, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[width * 1.08, depth * 1.08]} />
        <meshLambertMaterial color="#263238" />
      </mesh>

      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshLambertMaterial color={floorColor} />
      </mesh>

      {showFloorGrain
        ? Array.from({ length: grainLineCount }).map((_, index) => {
            const z = -depth / 2 + ((index + 1) * depth) / grainLineCount;
            return (
              <mesh
                key={`floor-line-${index}`}
                position={[0, 0.001, z]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[width, 0.008]} />
                <meshBasicMaterial color="#a07850" transparent opacity={0.25} />
              </mesh>
            );
          })
        : null}
    </group>
  );
});
