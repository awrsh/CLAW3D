"use client";

import { useFrame } from "@react-three/fiber";
import { memo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { FACTORY_COLORS } from "@/components/factory/simulation/factoryLayout";

export const STEEL = {
  dark: { color: FACTORY_COLORS.steel, metalness: 0.92, roughness: 0.18, envMapIntensity: 1.2 },
  bright: { color: FACTORY_COLORS.steelBright, metalness: 0.9, roughness: 0.16, envMapIntensity: 1.25 },
} as const;

export function InteractiveGroup({
  children,
  onClick,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: {
  children: ReactNode;
  onClick?: () => void;
  position?: [number, number, number] | readonly [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number] | readonly [number, number, number];
}) {
  const s: [number, number, number] =
    typeof scale === "number"
      ? [scale, scale, scale]
      : Array.isArray(scale)
        ? [scale[0], scale[1], scale[2]]
        : [1, 1, 1];
  return (
    <group
      position={position}
      rotation={rotation}
      scale={s}
      onClick={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {children}
    </group>
  );
}

export const StatusLed = memo(function StatusLed({
  position,
  active,
  warning,
}: {
  position: [number, number, number];
  active?: boolean;
  warning?: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current || !active) return;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.4 + Math.sin(clock.elapsedTime * 4) * 0.25;
  });
  const color = warning ? "#f59e0b" : active ? "#22c55e" : "#64748b";
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={active || warning ? color : "#000000"}
        emissiveIntensity={active || warning ? 0.55 : 0}
      />
    </mesh>
  );
});

export const ControlScreen = memo(function ControlScreen({
  position,
  active,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  active?: boolean;
  rotation?: [number, number, number];
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = active ? 0.35 + Math.sin(clock.elapsedTime * 2) * 0.12 : 0.06;
  });
  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <boxGeometry args={[0.55, 0.38, 0.04]} />
      <meshStandardMaterial
        color={active ? "#0ea5e9" : "#1e293b"}
        emissive={active ? "#0284c7" : "#0f172a"}
        emissiveIntensity={0.12}
      />
    </mesh>
  );
});

export const Conveyor = memo(function Conveyor({
  position,
  length,
  animated,
}: {
  position: [number, number, number];
  length: number;
  animated?: boolean;
}) {
  const beltRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!beltRef.current || !animated) return;
    beltRef.current.position.x = Math.sin(clock.elapsedTime * 3) * 0.12;
  });
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[length, 0.1, 0.85]} />
        <meshStandardMaterial color="#475569" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh ref={beltRef} position={[0, 0.07, 0]}>
        <boxGeometry args={[length - 0.3, 0.03, 0.7]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} />
      </mesh>
    </group>
  );
});

export function PipeSegment({
  from,
  to,
  radius = 0.05,
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
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  return (
    <mesh position={mid} quaternion={quat} castShadow>
      <cylinderGeometry args={[radius, radius, len, 8]} />
      <meshStandardMaterial {...STEEL.dark} />
    </mesh>
  );
}

export function Valve({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.14, 0.1, 0.14]} />
        <meshStandardMaterial {...STEEL.bright} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.12, 6]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  );
}

export function PressureGauge({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.07, 0.07, 0.03, 12]} />
      <meshStandardMaterial color="#f8fafc" metalness={0.4} roughness={0.3} />
    </mesh>
  );
}
