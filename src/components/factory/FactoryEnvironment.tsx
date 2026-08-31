"use client";

import { memo } from "react";
import * as THREE from "three";
import {
  FACTORY_COLORS,
  FACTORY_DIMENSIONS,
} from "@/components/factory/simulation/factoryLayout";

const { width, depth, height } = FACTORY_DIMENSIONS;

/** Which edge faces the corridor / default viewer (open side). */
type OpenSide = "south" | "north";

function RoomShell({
  center,
  size,
  openSide = "south",
  partitionHeight = 2.2,
}: {
  center: [number, number, number];
  size: [number, number];
  openSide?: OpenSide;
  partitionHeight?: number;
}) {
  const [cx, , cz] = center;
  const [w, d] = size;
  const hw = w / 2;
  const hd = d / 2;
  const wallT = 0.12;

  // Back wall sits opposite the open (corridor) side
  const backZ = openSide === "south" ? -hd : hd;

  return (
    <group position={[cx, 0, cz]}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[w - 0.3, d - 0.3]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.55} metalness={0.12} envMapIntensity={0.75} />
      </mesh>

      {/* Full-height back wall */}
      <mesh position={[0, height / 2, backZ]} castShadow receiveShadow>
        <boxGeometry args={[w, height, wallT]} />
        <meshStandardMaterial color={FACTORY_COLORS.wall} roughness={0.88} />
      </mesh>

      {/* Low side partitions — open above for dollhouse visibility */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * hw, partitionHeight / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[wallT, partitionHeight, d - 0.2]} />
          <meshStandardMaterial color={FACTORY_COLORS.wallAccent} roughness={0.9} />
        </mesh>
      ))}

      {/* Open front: only low curb + glass mullions (no solid wall) */}
      <group position={[0, 0, openSide === "south" ? hd : -hd]}>
        <mesh position={[0, 0.06, 0]} receiveShadow>
          <boxGeometry args={[w - 0.4, 0.12, wallT]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
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
              opacity={0.35}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Corner posts */}
      {[
        [-hw, backZ],
        [hw, backZ],
        [-hw, openSide === "south" ? hd : -hd],
        [hw, openSide === "south" ? hd : -hd],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, height / 2, z]} castShadow>
          <boxGeometry args={[0.14, height, 0.14]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
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

export const FactoryRoomShells = memo(function FactoryRoomShells() {
  return (
    <group>
      {/* North wing — open toward corridor (south) */}
      <RoomShell center={[0, 0, 24]} size={[22, 14]} openSide="south" />
      <RoomShell center={[-36, 0, 24]} size={[12, 12]} openSide="south" />
      <RoomShell center={[36, 0, 24]} size={[12, 12]} openSide="south" />
      <RoomShell center={[-18, 0, 18]} size={[20, 18]} openSide="south" />
      <RoomShell center={[18, 0, 18]} size={[18, 14]} openSide="south" />

      {/* Main production row — open south toward viewer */}
      <RoomShell center={[-48, 0, 0]} size={[16, 18]} openSide="south" />
      <RoomShell center={[-32, 0, 0]} size={[14, 16]} openSide="south" />
      <RoomShell center={[-16, 0, 0]} size={[14, 16]} openSide="south" />
      <RoomShell center={[0, 0, 0]} size={[16, 18]} openSide="south" />
      <RoomShell center={[16, 0, 0]} size={[14, 16]} openSide="south" />
      <RoomShell center={[32, 0, 0]} size={[16, 16]} openSide="south" />
      <RoomShell center={[48, 0, 0]} size={[14, 14]} openSide="south" />

      {/* South wing — open north toward corridor */}
      <RoomShell center={[0, 0, -16]} size={[16, 16]} openSide="north" />
      <RoomShell center={[16, 0, -16]} size={[14, 14]} openSide="north" />
      <RoomShell center={[32, 0, -16]} size={[16, 16]} openSide="north" />
      <RoomShell center={[48, 0, -16]} size={[16, 16]} openSide="north" />
      <RoomShell center={[-18, 0, -16]} size={[18, 14]} openSide="north" />
    </group>
  );
});

export { RoomShell };
