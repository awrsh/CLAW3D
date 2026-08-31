"use client";

import { memo } from "react";
import { STEEL } from "@/components/factory/equipment/shared";

export const WarehouseRackingProxy = memo(function WarehouseRackingProxy({
  position = [0, 0, 0],
  bays = 3,
  withPallets = true,
}: {
  position?: [number, number, number];
  bays?: number;
  withPallets?: boolean;
}) {
  return (
    <group position={position}>
      {Array.from({ length: bays }).map((_, i) => (
        <group key={i} position={[-2 + i * 2.2, 0, 0]}>
          <mesh position={[0, 1.85, 0]} castShadow>
            <boxGeometry args={[1.7, 3.7, 0.75]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.45} roughness={0.48} />
          </mesh>
          {[0.55, 1.35, 2.15, 2.95].map((y) => (
            <mesh key={y} position={[0, y, 0]} castShadow>
              <boxGeometry args={[1.55, 0.08, 0.68]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.65} />
            </mesh>
          ))}
          {withPallets ? (
            <mesh position={[0, 0.18, 0.1]} castShadow>
              <boxGeometry args={[0.9, 0.12, 0.7]} />
              <meshStandardMaterial color="#a8a29e" roughness={0.85} />
            </mesh>
          ) : null}
          {withPallets ? (
            <mesh position={[0, 0.55, 0.1]} castShadow>
              <boxGeometry args={[0.75, 0.45, 0.55]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.7} />
            </mesh>
          ) : null}
        </group>
      ))}
    </group>
  );
});

export const VialRackProxy = memo(function VialRackProxy({
  position = [0, 0, 0],
  count = 12,
}: {
  position?: [number, number, number];
  count?: number;
}) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.06, 0.35]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
      </mesh>
      {Array.from({ length: count }).map((_, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        return (
          <mesh
            key={i}
            position={[-0.18 + col * 0.12, 0.12, -0.1 + row * 0.1]}
            castShadow
          >
            <cylinderGeometry args={[0.015, 0.015, 0.1, 6]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.35} />
          </mesh>
        );
      })}
    </group>
  );
});

export const GlasswareSetProxy = memo(function GlasswareSetProxy({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.07, 0.35, 10]} />
        <meshPhysicalMaterial
          color="#dbeafe"
          transmission={0.5}
          transparent
          opacity={0.85}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[0.18, 0.35, 0.08]} castShadow>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshPhysicalMaterial
          color="#e0f2fe"
          transmission={0.45}
          transparent
          opacity={0.8}
          roughness={0.12}
        />
      </mesh>
      <mesh position={[-0.16, 0.25, -0.05]} rotation={[0.2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.28, 8]} />
        <meshPhysicalMaterial
          color="#cffafe"
          transmission={0.4}
          transparent
          opacity={0.82}
          roughness={0.15}
        />
      </mesh>
    </group>
  );
});

export const PackagingLineProxy = memo(function PackagingLineProxy({
  active = false,
  onClick,
}: {
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[7, 0.1, 0.85]} />
        <meshStandardMaterial {...STEEL.dark} />
      </mesh>
      <mesh position={[-1.5, 0.85, 0]} castShadow>
        <boxGeometry args={[1.4, 1.5, 1.1]} />
        <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.4} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[-2.5 + i * 1.1, 0.7, 0.15]} castShadow>
          <boxGeometry args={[0.35, 0.25, 0.22]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.65} />
        </mesh>
      ))}
      <mesh position={[2, 0.95, 0]} castShadow>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.45} />
      </mesh>
    </group>
  );
});
