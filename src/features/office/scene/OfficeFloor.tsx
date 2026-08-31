"use client";

import { memo } from "react";
import type {
  FloorConfig,
  WorkspaceUnit,
} from "@/features/office/core/roomConfig";
import { WallRun, type WallDetail } from "@/features/office/scene/FlutedWallPanel";

type OfficeFloorProps = {
  config: Pick<
    FloorConfig,
    | "width"
    | "depth"
    | "floorColor"
    | "showFloorGrain"
    | "wallHeight"
    | "wallThickness"
    | "workspaces"
  >;
  grainLineCount?: number;
  selectedWorkspaceId?: string | null;
  onSelectWorkspace?: (workspaceId: string) => void;
  interactive?: boolean;
  wallDetail?: WallDetail;
};

function WorkspaceSlab({
  unit,
  wallHeight,
  wallThickness,
  selected,
  interactive,
  onSelect,
  wallDetail = "simple",
}: {
  unit: WorkspaceUnit;
  wallHeight: number;
  wallThickness: number;
  selected: boolean;
  interactive: boolean;
  onSelect?: (workspaceId: string) => void;
  wallDetail?: WallDetail;
}) {
  const halfW = unit.width / 2;
  const halfD = unit.depth / 2;
  const t = Math.min(wallThickness, 0.1);

  return (
    <group position={[unit.x, 0, unit.z]}>
      <mesh
        position={[0, 0.004, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onPointerDown={
          interactive && onSelect
            ? (event) => {
                event.stopPropagation();
                onSelect(unit.id);
              }
            : undefined
        }
      >
        <planeGeometry args={[unit.width, unit.depth]} />
        <meshStandardMaterial
          color={unit.floorColor}
          roughness={0.42}
          metalness={0.08}
        />
      </mesh>

      {selected ? (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry
            args={[unit.width + 0.12, unit.depth + 0.12]}
          />
          <meshBasicMaterial
            color="#f0b429"
            transparent
            opacity={0.22}
            depthWrite={false}
          />
        </mesh>
      ) : null}

      {unit.withWalls ? (
        <group>
          <group position={[0, 0, -halfD]}>
            <WallRun
              span={unit.width}
              height={wallHeight}
              depth={t}
              color={unit.wallColor}
              axis="x"
              detail={wallDetail}
            />
          </group>
          <group position={[0, 0, halfD]}>
            <WallRun
              span={unit.width}
              height={wallHeight}
              depth={t}
              color={unit.wallColor}
              axis="x"
              detail={wallDetail}
            />
          </group>
          <group position={[-halfW, 0, 0]}>
            <WallRun
              span={unit.depth}
              height={wallHeight}
              depth={t}
              color={unit.wallColor}
              axis="z"
              detail={wallDetail}
            />
          </group>
          <group position={[halfW, 0, 0]}>
            <WallRun
              span={unit.depth}
              height={wallHeight}
              depth={t}
              color={unit.wallColor}
              axis="z"
              detail={wallDetail}
            />
          </group>
        </group>
      ) : null}
    </group>
  );
}

/**
 * Modern large-format floor (polished concrete / porcelain tile feel).
 * When workspaces exist, the full slab becomes a dim canvas and units render on top.
 */
export const OfficeFloor = memo(function OfficeFloor({
  config,
  grainLineCount = 10,
  selectedWorkspaceId = null,
  onSelectWorkspace,
  interactive = true,
  wallDetail = "simple",
}: OfficeFloorProps) {
  const {
    width,
    depth,
    floorColor,
    showFloorGrain,
    wallHeight,
    wallThickness,
    workspaces = [],
  } = config;
  const hasUnits = workspaces.length > 0;
  const canvasColor = hasUnits ? "#9aa3ad" : floorColor;
  const canvasOpacity = hasUnits ? 0.55 : 1;

  return (
    <group>
      {/* Subtle underlay / shadow skirt */}
      <mesh
        position={[0, -0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[width * 1.06, depth * 1.06]} />
        <meshStandardMaterial color="#1c2228" roughness={1} metalness={0} />
      </mesh>

      {/* Main slab / draw canvas */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color={canvasColor}
          roughness={0.45}
          metalness={0.08}
          transparent={hasUnits}
          opacity={canvasOpacity}
        />
      </mesh>

      {/* Soft specular sheen strip */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * 0.92, depth * 0.92]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={hasUnits ? 0.02 : 0.04}
          roughness={0.2}
          metalness={0.1}
          depthWrite={false}
        />
      </mesh>

      {showFloorGrain
        ? Array.from({ length: grainLineCount }).map((_, index) => {
            const z = -depth / 2 + ((index + 1) * depth) / (grainLineCount + 1);
            return (
              <mesh
                key={`tile-z-${index}`}
                position={[0, 0.002, z]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[width * 0.98, 0.012]} />
                <meshBasicMaterial color="#2a3038" transparent opacity={0.12} />
              </mesh>
            );
          })
        : null}
      {showFloorGrain
        ? Array.from({
            length: Math.max(6, Math.round(grainLineCount * 1.4)),
          }).map((_, index) => {
            const count = Math.max(6, Math.round(grainLineCount * 1.4));
            const x = -width / 2 + ((index + 1) * width) / (count + 1);
            return (
              <mesh
                key={`tile-x-${index}`}
                position={[x, 0.002, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[0.012, depth * 0.98]} />
                <meshBasicMaterial color="#2a3038" transparent opacity={0.1} />
              </mesh>
            );
          })
        : null}

      {workspaces.map((unit) => (
        <WorkspaceSlab
          key={unit.id}
          unit={unit}
          wallHeight={wallHeight}
          wallThickness={wallThickness}
          selected={unit.id === selectedWorkspaceId}
          interactive={interactive}
          onSelect={onSelectWorkspace}
          wallDetail={wallDetail}
        />
      ))}
    </group>
  );
});
