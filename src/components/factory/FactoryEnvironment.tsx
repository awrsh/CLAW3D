"use client";

import { memo } from "react";
import * as THREE from "three";
import {
  FACTORY_AREAS,
  FACTORY_COLORS,
  FACTORY_DIMENSIONS,
  getAreaOpenSide,
} from "@/components/factory/simulation/factoryLayout";
import type { FactoryAreaId, SceneViewMode } from "@/components/factory/simulation/ProductionState";

const { width, depth, height } = FACTORY_DIMENSIONS;

/** Which edge faces the corridor / default viewer (open side). */
type OpenSide = "south" | "north";

export type RoomShellVariant = "cutaway" | "full" | "ghost";

function RoomShell({
  center,
  size,
  openSide = "south",
  partitionHeight = 2.2,
  variant = "cutaway",
}: {
  center: [number, number, number];
  size: [number, number];
  openSide?: OpenSide;
  partitionHeight?: number;
  variant?: RoomShellVariant;
}) {
  const [cx, , cz] = center;
  const [w, d] = size;
  const hw = w / 2;
  const hd = d / 2;
  const wallT = 0.12;
  const isFull = variant === "full";
  const isGhost = variant === "ghost";
  const wallOpacity = isGhost ? 0.18 : 1;
  const wallTransparent = isGhost;

  const backZ = openSide === "south" ? -hd : hd;
  const frontZ = openSide === "south" ? hd : -hd;
  const sideWallH = isFull ? height : partitionHeight;

  const wallMat = (
    <meshStandardMaterial
      color={isFull ? FACTORY_COLORS.wall : FACTORY_COLORS.wallAccent}
      roughness={0.88}
      transparent={wallTransparent}
      opacity={wallOpacity}
      depthWrite={!wallTransparent}
    />
  );

  return (
    <group position={[cx, 0, cz]}>
      {/* Floor — twin grid in full room mode */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[w - 0.3, d - 0.3]} />
        <meshStandardMaterial
          color={isFull ? "#f1f5f9" : "#f8fafc"}
          roughness={isFull ? 0.42 : 0.55}
          metalness={isFull ? 0.14 : 0.12}
          envMapIntensity={0.75}
        />
      </mesh>

      {isFull ? (
        <group>
          {Array.from({ length: Math.floor(w / 1.2) + 1 }).map((_, i) => (
            <mesh
              key={`gx-${i}`}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[-hw + i * 1.2, 0.015, 0]}
            >
              <planeGeometry args={[0.02, d - 0.5]} />
              <meshBasicMaterial color="#cbd5e1" transparent opacity={0.35} />
            </mesh>
          ))}
          {Array.from({ length: Math.floor(d / 1.2) + 1 }).map((_, i) => (
            <mesh
              key={`gz-${i}`}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0.015, -hd + i * 1.2]}
            >
              <planeGeometry args={[w - 0.5, 0.02]} />
              <meshBasicMaterial color="#cbd5e1" transparent opacity={0.35} />
            </mesh>
          ))}
        </group>
      ) : null}

      {/* Back wall */}
      <mesh position={[0, height / 2, backZ]} castShadow={!isGhost} receiveShadow>
        <boxGeometry args={[w, height, wallT]} />
        {wallMat}
      </mesh>

      {/* Side walls */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * hw, sideWallH / 2, 0]}
          castShadow={!isGhost}
          receiveShadow
        >
          <boxGeometry args={[wallT, sideWallH, d - 0.2]} />
          {wallMat}
        </mesh>
      ))}

      {/* Front — cutaway mullions OR full wall with door */}
      {isFull ? (
        <group position={[0, 0, frontZ]}>
          {/* Left wall segment */}
          <mesh position={[-hw / 2 - 0.5, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[hw - 1.2, height, wallT]} />
            {wallMat}
          </mesh>
          {/* Right wall segment */}
          <mesh position={[hw / 2 + 0.5, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[hw - 1.2, height, wallT]} />
            {wallMat}
          </mesh>
          {/* Door header */}
          <mesh position={[0, height - 0.35, 0]} castShadow>
            <boxGeometry args={[2.2, 0.7, wallT]} />
            {wallMat}
          </mesh>
          {/* Glass door panels */}
          {[-0.55, 0.55].map((xOff) => (
            <mesh key={xOff} position={[xOff, 1.05, 0]}>
              <boxGeometry args={[0.9, 2.1, wallT * 0.5]} />
              <meshPhysicalMaterial
                color={FACTORY_COLORS.glass}
                metalness={0.08}
                roughness={0.06}
                transmission={0.65}
                transparent
                opacity={0.45}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      ) : (
        <group position={[0, 0, frontZ]}>
          <mesh position={[0, 0.06, 0]} receiveShadow>
            <boxGeometry args={[w - 0.4, 0.12, wallT]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.7} transparent={wallTransparent} opacity={wallOpacity} />
          </mesh>
          {[-0.35, 0, 0.35].map((xOff) => (
            <mesh key={xOff} position={[xOff * w, partitionHeight / 2, 0]}>
              <boxGeometry args={[0.06, partitionHeight, wallT * 0.6]} />
              <meshPhysicalMaterial
                color={FACTORY_COLORS.glass}
                metalness={0.05}
                roughness={0.08}
                transmission={0.72}
                transparent
                opacity={isGhost ? 0.12 : 0.35}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Ceiling — full room only */}
      {isFull ? (
        <mesh position={[0, height - 0.06, 0]} receiveShadow>
          <boxGeometry args={[w - 0.2, 0.12, d - 0.2]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.92} emissive="#ffffff" emissiveIntensity={0.06} />
        </mesh>
      ) : null}

      {/* Corner posts */}
      {[
        [-hw, backZ],
        [hw, backZ],
        [-hw, frontZ],
        [hw, frontZ],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, height / 2, z]} castShadow={!isGhost}>
          <boxGeometry args={[0.14, height, 0.14]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.85} transparent={wallTransparent} opacity={wallOpacity} />
        </mesh>
      ))}
    </group>
  );
}

function CorridorMarkings() {
  return (
    <group>
      {Array.from({ length: 28 }).map((_, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.02, -26 + i * 2]}
        >
          <planeGeometry args={[0.12, 0.8]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      ))}
    </group>
  );
}

function HvacDuct({ position, length }: { position: [number, number, number]; length: number }) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[0.5, 0.35, length]} />
      <meshStandardMaterial color="#cbd5e1" metalness={0.35} roughness={0.55} />
    </mesh>
  );
}

function PipeRun({
  from,
  to,
  radius = 0.06,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius?: number;
}) {
  const mid: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2,
  ];
  const len = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
  const dir = new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir,
  );
  return (
    <mesh position={mid} quaternion={quat} castShadow>
      <cylinderGeometry args={[radius, radius, len, 10]} />
      <meshStandardMaterial color={FACTORY_COLORS.steel} metalness={0.85} roughness={0.25} />
    </mesh>
  );
}

export const FactoryEnvironment = memo(function FactoryEnvironment() {
  return (
    <group>
      {/* Ground reflection handled by FactoryReflections */}
      {[
        [0, 1.2, -depth / 2, width, 2.4, 0.2],
        [0, 1.2, depth / 2, width, 2.4, 0.2],
        [-width / 2, 1.2, 0, 0.2, 2.4, depth],
        [width / 2, 1.2, 0, 0.2, 2.4, depth],
      ].map(([x, y, z, sx, sy, sz], i) => (
        <mesh key={i} position={[x, y, z]} receiveShadow>
          <boxGeometry args={[sx, sy, sz]} />
          <meshStandardMaterial color={FACTORY_COLORS.wallAccent} roughness={0.9} />
        </mesh>
      ))}

      <CorridorMarkings />
      <HvacDuct position={[5, height - 0.3, 0]} length={depth - 8} />
      <HvacDuct position={[-5, height - 0.3, 0]} length={depth - 8} />
      <PipeRun from={[-40, 2.2, 2]} to={[40, 2.2, 2]} />
      <PipeRun from={[-40, 1.8, -2]} to={[40, 1.8, -2]} radius={0.05} />
    </group>
  );
});

export const FactoryRoomShells = memo(function FactoryRoomShells({
  sceneViewMode = "facility",
  roomAreaId = null,
}: {
  sceneViewMode?: SceneViewMode;
  roomAreaId?: FactoryAreaId | null;
}) {
  return (
    <group>
      {FACTORY_AREAS.map((area) => {
        let variant: RoomShellVariant = "cutaway";
        if (sceneViewMode === "room") {
          variant = area.id === roomAreaId ? "full" : "ghost";
        }
        return (
          <RoomShell
            key={area.id}
            center={area.center}
            size={area.size}
            openSide={getAreaOpenSide(area)}
            variant={variant}
          />
        );
      })}
    </group>
  );
});

export { RoomShell };
