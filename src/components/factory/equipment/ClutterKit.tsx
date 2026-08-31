"use client";

import { memo, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { FACTORY_COLORS } from "@/components/factory/simulation/factoryLayout";
import { STEEL } from "@/components/factory/equipment/shared";

const BOX_GEO = new THREE.BoxGeometry(0.42, 0.32, 0.38);
const BIN_GEO = new THREE.BoxGeometry(0.45, 0.35, 0.45);
const DRUM_GEO = new THREE.CylinderGeometry(0.28, 0.28, 0.75, 10);

const BOX_MAT = new THREE.MeshStandardMaterial({ color: "#d6d3d1", roughness: 0.85 });
const BIN_MAT = new THREE.MeshStandardMaterial({ color: "#cbd5e1", roughness: 0.7 });
const DRUM_MAT = new THREE.MeshStandardMaterial({
  color: "#64748b",
  metalness: 0.55,
  roughness: 0.45,
});

function InstancedClutter({
  origin,
  cols,
  rows,
  spacing = 0.65,
  type = "box",
}: {
  origin: [number, number, number];
  cols: number;
  rows: number;
  spacing?: number;
  type?: "box" | "bin" | "drum";
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = cols * rows;
  const [geo, mat, yOff] =
    type === "bin"
      ? [BIN_GEO, BIN_MAT, 0.18]
      : type === "drum"
        ? [DRUM_GEO, DRUM_MAT, 0.38]
        : [BOX_GEO, BOX_MAT, 0.22];

  useLayoutEffect(() => {
    if (!ref.current) return;
    const m = new THREE.Matrix4();
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        m.makeTranslation(
          origin[0] + c * spacing,
          origin[1] + yOff,
          origin[2] + r * spacing,
        );
        ref.current.setMatrixAt(i++, m);
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [origin, cols, rows, spacing, yOff]);

  return (
    <instancedMesh ref={ref} args={[geo, mat, count]} castShadow receiveShadow frustumCulled />
  );
}

export const MaterialBin = memo(function MaterialBin({
  position,
  color = "#cbd5e1",
}: {
  position: [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={position} geometry={BIN_GEO} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
});

export const CardboardBox = memo(function CardboardBox({
  position,
  size = [0.5, 0.4, 0.5] as [number, number, number],
}: {
  position: [number, number, number];
  size?: [number, number, number];
}) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#d6d3d1" roughness={0.85} />
    </mesh>
  );
});

export const PalletStack = memo(function PalletStack({
  position,
  layers = 2,
}: {
  position: [number, number, number];
  layers?: number;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.95, 0.12, 0.75]} />
        <meshStandardMaterial color="#a8a29e" roughness={0.88} />
      </mesh>
      {Array.from({ length: layers }).map((_, i) => (
        <mesh key={i} position={[0, 0.35 + i * 0.42, 0]} castShadow>
          <boxGeometry args={[0.8, 0.38, 0.6]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.72} />
        </mesh>
      ))}
    </group>
  );
});

export const ToolCart = memo(function ToolCart({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.7, 0.05, 0.45]} />
        <meshStandardMaterial {...STEEL.bright} />
      </mesh>
      {[
        [-0.28, 0.25, 0.16],
        [0.28, 0.25, 0.16],
        [-0.28, 0.25, -0.16],
        [0.28, 0.25, -0.16],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <MaterialBin position={[0, 0.62, 0]} color="#e2e8f0" />
    </group>
  );
});

export const StainlessTable = memo(function StainlessTable({
  position,
  w = 1.4,
}: {
  position: [number, number, number];
  w?: number;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.06, 0.65]} />
        <meshStandardMaterial {...STEEL.bright} />
      </mesh>
      {[-1, 1].map((s) =>
        [-1, 1].map((z) => (
          <mesh key={`${s}-${z}`} position={[(s * w) / 2.2, 0.42, (z * 0.25)]} castShadow>
            <boxGeometry args={[0.06, 0.84, 0.06]} />
            <meshStandardMaterial {...STEEL.dark} />
          </mesh>
        )),
      )}
    </group>
  );
});

export const DrumBarrel = memo(function DrumBarrel({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.28, 0.28, 0.75, 16]} />
      <meshStandardMaterial color="#64748b" metalness={0.55} roughness={0.45} />
    </mesh>
  );
});

export const ProcessPanel = memo(function ProcessPanel({
  position,
  active,
}: {
  position: [number, number, number];
  active?: boolean;
}) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.7, 0.12]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.1, 0.07]}>
        <planeGeometry args={[0.38, 0.28]} />
        <meshStandardMaterial
          color={active ? "#0ea5e9" : "#1e293b"}
          emissive={active ? "#0284c7" : "#000000"}
          emissiveIntensity={active ? 0.35 : 0}
        />
      </mesh>
    </group>
  );
});

export const CableTray = memo(function CableTray({
  from,
  to,
}: {
  from: [number, number, number];
  to: [number, number, number];
}) {
  const mid: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2,
  ];
  const len = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
  const isX = Math.abs(to[0] - from[0]) > Math.abs(to[2] - from[2]);
  return (
    <mesh position={mid} castShadow>
      <boxGeometry args={isX ? [len, 0.08, 0.25] : [0.25, 0.08, len]} />
      <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.55} />
    </mesh>
  );
});

export const CeilingLight = memo(function CeilingLight({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.2, 0.06, 0.35]} />
        <meshStandardMaterial color="#f8fafc" emissive="#ffffff" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
});

export const FloorArrow = memo(function FloorArrow({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <mesh rotation={[-Math.PI / 2, rotation, 0]} position={position}>
      <planeGeometry args={[0.8, 0.25]} />
      <meshStandardMaterial color="#fbbf24" roughness={0.9} />
    </mesh>
  );
});

export const ZoneSign = memo(function ZoneSign({
  position,
  color = FACTORY_COLORS.accent,
}: {
  position: [number, number, number];
  color?: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.9, 0.35, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
    </group>
  );
});

/** Instanced grid — one draw call instead of cols×rows meshes */
export function ClutterGrid({
  origin,
  cols,
  rows,
  spacing = 0.65,
  type = "box",
}: {
  origin: [number, number, number];
  cols: number;
  rows: number;
  spacing?: number;
  type?: "box" | "bin" | "drum";
}) {
  if (cols * rows >= 2) {
    return (
      <InstancedClutter
        origin={origin}
        cols={cols}
        rows={rows}
        spacing={spacing}
        type={type}
      />
    );
  }

  const items = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const pos: [number, number, number] = [
        origin[0] + c * spacing,
        origin[1] + (type === "drum" ? 0.38 : type === "bin" ? 0.18 : 0.22),
        origin[2] + r * spacing,
      ];
      const key = `${r}-${c}`;
      if (type === "bin") items.push(<MaterialBin key={key} position={pos} />);
      else if (type === "drum") items.push(<DrumBarrel key={key} position={pos} />);
      else items.push(<CardboardBox key={key} position={pos} size={[0.42, 0.32, 0.38]} />);
    }
  }
  return <group>{items}</group>;
}
