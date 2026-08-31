"use client";

import { memo } from "react";
import type { GlbProxyProps } from "@/components/laboratory/GlbEquipment";
import {
  InteractiveGroup,
  PipeSegment,
  StatusLed,
  STEEL,
} from "@/components/factory/equipment/shared";

export const CentrifugalPumpProxy = memo(function CentrifugalPumpProxy({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  active = false,
  onClick,
}: GlbProxyProps & { active?: boolean }) {
  const s = (Array.isArray(scale) ? scale : [scale, scale, scale]) as [
    number,
    number,
    number,
  ];
  return (
    <InteractiveGroup
      position={position as [number, number, number]}
      rotation={rotation as [number, number, number]}
      scale={s}
      onClick={onClick}
    >
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.28, 16]} />
        <meshStandardMaterial {...STEEL.bright} />
      </mesh>
      <mesh position={[0.28, 0.22, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.35, 10]} />
        <meshStandardMaterial {...STEEL.dark} />
      </mesh>
      <mesh position={[-0.28, 0.22, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.35, 10]} />
        <meshStandardMaterial {...STEEL.dark} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.24, 0.22, 0.24]} />
        <meshStandardMaterial color="#334155" metalness={0.65} roughness={0.35} />
      </mesh>
      <StatusLed position={[0, 0.58, 0.15]} active={active} />
    </InteractiveGroup>
  );
});

export function PumpPair({
  positions,
  active,
  onClick,
}: {
  positions: [[number, number, number], [number, number, number]];
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <group>
      {positions.map((pos, i) => (
        <CentrifugalPumpProxy key={i} position={pos} active={active} onClick={onClick} />
      ))}
      <PipeSegment from={positions[0]} to={positions[1]} radius={0.04} />
    </group>
  );
}
