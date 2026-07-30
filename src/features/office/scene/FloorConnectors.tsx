"use client";

import { memo, useMemo } from "react";
import type {
  BuildingConfig,
  FloorConfig,
  StructureConfig,
} from "@/features/office/core/roomConfig";
import { getFloorWorldY } from "@/features/office/core/roomConfig";

type FloorConnectorsProps = {
  building: BuildingConfig;
};

function cornerSign(corner: StructureConfig["stairsCorner"]): {
  x: 1 | -1;
  z: 1 | -1;
} {
  switch (corner) {
    case "ne":
      return { x: 1, z: -1 };
    case "nw":
      return { x: -1, z: -1 };
    case "se":
      return { x: 1, z: 1 };
    case "sw":
      return { x: -1, z: 1 };
    default: {
      const _exhaustive: never = corner;
      return _exhaustive;
    }
  }
}

/**
 * Open stair flight in free floor space (not flush to walls).
 * No side stringer panels — only steps + thin handrail posts.
 */
function StairFlight({
  lowerFloor,
  lowerY,
  spacing,
  corner,
}: {
  lowerFloor: FloorConfig;
  lowerY: number;
  spacing: number;
  corner: StructureConfig["stairsCorner"];
}) {
  const stepCount = Math.max(8, Math.round(spacing * 2.5));
  const stepHeight = spacing / stepCount;
  const stepDepth = 0.38;
  const stepWidth = 1.6;
  const run = stepCount * stepDepth;
  const signs = cornerSign(corner);

  // Keep stairs clearly inside the room, away from outer walls.
  const wallClearanceX = Math.min(12, Math.max(6, lowerFloor.width * 0.18));
  const wallClearanceZ = Math.min(10, Math.max(5, lowerFloor.depth * 0.18));
  const baseX =
    signs.x * (lowerFloor.width / 2 - wallClearanceX - stepWidth / 2);
  const startZ =
    signs.z * (lowerFloor.depth / 2 - wallClearanceZ - stepDepth / 2);
  const climbDir = -signs.z;

  const steps = useMemo(
    () =>
      Array.from({ length: stepCount }, (_, index) => {
        const y = lowerY + stepHeight * (index + 0.5);
        const z = startZ + climbDir * (index + 0.5) * stepDepth;
        return { y, z, index };
      }),
    [climbDir, lowerY, startZ, stepCount, stepDepth, stepHeight],
  );

  const midZ = startZ + climbDir * (run / 2);
  const railX = baseX + stepWidth / 2 + 0.12;

  return (
    <group>
      {steps.map((step) => (
        <mesh
          key={`step-${step.index}`}
          position={[baseX, step.y, step.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry
            args={[stepWidth, Math.max(0.06, stepHeight * 0.85), stepDepth * 0.92]}
          />
          <meshStandardMaterial color="#a1887f" roughness={0.82} />
        </mesh>
      ))}

      {/* Thin open handrail (not a wall) */}
      <mesh position={[railX, lowerY + spacing * 0.55, midZ]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, spacing * 0.95, 8]} />
        <meshStandardMaterial color="#78909c" metalness={0.45} roughness={0.35} />
      </mesh>
      {[0.2, 0.5, 0.8].map((t) => (
        <mesh
          key={`post-${t}`}
          position={[
            railX,
            lowerY + spacing * t * 0.5 + 0.35,
            startZ + climbDir * run * t,
          ]}
        >
          <cylinderGeometry args={[0.025, 0.025, spacing * t + 0.2, 6]} />
          <meshStandardMaterial color="#90a4ae" metalness={0.4} roughness={0.4} />
        </mesh>
      ))}

      {/* Small landing at the top, still inward */}
      <mesh
        position={[
          baseX,
          lowerY + spacing - 0.03,
          startZ + climbDir * (run + 0.35),
        ]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[stepWidth + 0.15, 0.06, 0.7]} />
        <meshStandardMaterial color="#bcaaa4" roughness={0.78} />
      </mesh>
    </group>
  );
}

function CornerColumns({ building }: { building: BuildingConfig }) {
  const bottom = building.floors[0]!;
  const topY =
    getFloorWorldY(building, building.floors[building.floors.length - 1]!.id) +
    Math.max(...building.floors.map((floor) => floor.wallHeight));
  const height = Math.max(0.5, topY);
  const inset = Math.min(3.5, Math.max(2.2, bottom.width * 0.06));
  const radius = building.structure.columnRadius;
  const positions: [number, number][] = [
    [bottom.width / 2 - inset, bottom.depth / 2 - inset],
    [-(bottom.width / 2 - inset), bottom.depth / 2 - inset],
    [bottom.width / 2 - inset, -(bottom.depth / 2 - inset)],
    [-(bottom.width / 2 - inset), -(bottom.depth / 2 - inset)],
  ];

  return (
    <group>
      {positions.map(([x, z], index) => (
        <group key={`column-${index}`}>
          <mesh position={[x, height / 2, z]} castShadow receiveShadow>
            <cylinderGeometry args={[radius, radius * 1.05, height, 16]} />
            <meshStandardMaterial
              color="#9e9e9e"
              roughness={0.45}
              metalness={0.25}
            />
          </mesh>
          {building.floors.map((floor) => {
            const y = getFloorWorldY(building, floor.id);
            return (
              <mesh key={`${floor.id}-ring`} position={[x, y + 0.04, z]}>
                <cylinderGeometry
                  args={[radius * 1.35, radius * 1.35, 0.08, 16]}
                />
                <meshStandardMaterial
                  color="#757575"
                  roughness={0.5}
                  metalness={0.3}
                />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

export const FloorConnectors = memo(function FloorConnectors({
  building,
}: FloorConnectorsProps) {
  if (building.floors.length < 2) return null;
  if (!building.structure.showStairs && !building.structure.showColumns) {
    return null;
  }

  return (
    <group>
      {building.structure.showColumns ? (
        <CornerColumns building={building} />
      ) : null}

      {building.structure.showStairs
        ? building.floors.slice(0, -1).map((floor) => {
            const lowerY = getFloorWorldY(building, floor.id);
            return (
              <StairFlight
                key={`stairs-${floor.id}`}
                lowerFloor={floor}
                lowerY={lowerY}
                spacing={building.floorSpacing}
                corner={building.structure.stairsCorner}
              />
            );
          })
        : null}
    </group>
  );
});
