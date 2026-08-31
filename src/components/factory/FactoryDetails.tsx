"use client";

import { memo } from "react";
import { FACTORY_COLORS } from "@/components/factory/simulation/factoryLayout";

function FireExtinguisher({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.12, 0.45, 0.12]} />
        <meshStandardMaterial color="#dc2626" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.12, 6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function SafetySign({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh>
        <planeGeometry args={[0.5, 0.5]} />
        <meshStandardMaterial color="#16a34a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[0.15, 0.35]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function CctvCamera({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.18, 0.12, 0.22]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

function FloorMarking({ position, width, depth = 0.15 }: { position: [number, number, number]; width: number; depth?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position}>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color="#fbbf24" roughness={0.9} />
    </mesh>
  );
}

function HandSanitizer({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.15, 0.5, 0.12]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.32, 0.04]}>
        <boxGeometry args={[0.08, 0.12, 0.06]} />
        <meshStandardMaterial color={FACTORY_COLORS.accent} roughness={0.4} />
      </mesh>
    </group>
  );
}

function GmpSign({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh>
        <boxGeometry args={[0.7, 0.28, 0.03]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.65} />
      </mesh>
    </group>
  );
}

function AirlockFrame({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[-0.55, 1.35, 0]} castShadow>
        <boxGeometry args={[0.08, 2.7, 0.08]} />
        <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.45} />
      </mesh>
      <mesh position={[0.55, 1.35, 0]} castShadow>
        <boxGeometry args={[0.08, 2.7, 0.08]} />
        <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.45} />
      </mesh>
      <mesh position={[0, 2.7, 0]} castShadow>
        <boxGeometry args={[1.18, 0.08, 0.08]} />
        <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.45} />
      </mesh>
    </group>
  );
}

export const FactoryDetails = memo(function FactoryDetails() {
  const extinguishers: [number, number, number][] = [
    [-58, 0, 24], [58, 0, 24], [-58, 0, -24], [58, 0, -24],
    [-8, 0, 8], [24, 0, 8], [40, 0, -8],
    [-48, 0, 6], [-32, 0, 6], [-16, 0, 6], [0, 0, 6],
    [16, 0, 6], [32, 0, 6], [48, 0, 6],
    [0, 0, -8], [16, 0, -8], [32, 0, -8], [48, 0, -8],
    [-18, 0, -8], [-18, 0, 16], [18, 0, 16],
  ];
  const cameras: [number, number, number][] = [
    [0, 4.8, 26], [-20, 4.5, 10], [20, 4.5, 10], [0, 4.5, -10],
    [-48, 4.6, 0], [-16, 4.6, 0], [16, 4.6, 0], [48, 4.6, 0],
    [0, 4.6, -16], [32, 4.6, -16], [-18, 4.6, -16],
  ];

  const corridorMarks: [number, number, number][] = [
    [-40, 0.02, 0], [-24, 0.02, 0], [-8, 0.02, 0], [8, 0.02, 0],
    [24, 0.02, 0], [40, 0.02, 0],
    [-32, 0.02, -16], [0, 0.02, -16], [16, 0.02, -16], [32, 0.02, -16],
  ];

  const airlocks: [number, number, number][] = [
    [-24, 0, 7], [8, 0, 7], [24, 0, 7],
    [8, 0, -10], [24, 0, -10],
  ];

  return (
    <group>
      {extinguishers.map((pos, i) => (
        <FireExtinguisher key={`fe-${i}`} position={pos} />
      ))}
      <SafetySign position={[-62, 2.2, 0]} rotation={Math.PI / 2} />
      <SafetySign position={[62, 2.2, 0]} rotation={-Math.PI / 2} />
      <SafetySign position={[0, 2.2, 26]} />
      <SafetySign position={[-48, 2.2, 8]} rotation={Math.PI} />
      <SafetySign position={[48, 2.2, 8]} rotation={Math.PI} />
      <GmpSign position={[-32, 2.5, 7]} />
      <GmpSign position={[0, 2.5, 7]} />
      <GmpSign position={[32, 2.5, 7]} />
      <GmpSign position={[16, 2.5, -9]} rotation={Math.PI} />
      {cameras.map((pos, i) => (
        <CctvCamera key={`cctv-${i}`} position={pos} />
      ))}
      <FloorMarking position={[-24, 0.02, 0]} width={6} />
      <FloorMarking position={[24, 0.02, 0]} width={6} />
      {corridorMarks.map((pos, i) => (
        <FloorMarking key={`cm-${i}`} position={pos} width={3.5} depth={0.12} />
      ))}
      <FloorMarking position={[0, 0.02, 4.5]} width={110} depth={0.08} />
      {airlocks.map((pos, i) => (
        <AirlockFrame key={`al-${i}`} position={pos} />
      ))}
      <HandSanitizer position={[0, 0, 20]} />
      <HandSanitizer position={[-14, 0, 0]} />
      <HandSanitizer position={[14, 0, -14]} />
      <HandSanitizer position={[-32, 0, 5]} />
      <HandSanitizer position={[32, 0, 5]} />
      <HandSanitizer position={[0, 0, -12]} />
      <HandSanitizer position={[16, 0, -12]} />
    </group>
  );
});
