"use client";

import { memo } from "react";
import type { GlbProxyProps } from "@/components/laboratory/GlbEquipment";
import {
  ControlScreen,
  InteractiveGroup,
  PipeSegment,
  PressureGauge,
  StatusLed,
  STEEL,
  Valve,
} from "@/components/factory/equipment/shared";
import { CentrifugalPumpProxy } from "@/components/factory/equipment/Pump";

export const FiltrationSkidProxy = memo(function FiltrationSkidProxy({
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
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.12, 1.1]} />
        <meshStandardMaterial color="#64748b" metalness={0.55} roughness={0.4} />
      </mesh>
      {[-0.55, 0, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.75, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 1.35, 14]} />
          <meshStandardMaterial {...STEEL.bright} />
        </mesh>
      ))}
      <CentrifugalPumpProxy position={[1.1, 0, 0.35]} active={active} />
      <ControlScreen position={[0, 1.35, -0.45]} active={active} />
      <PressureGauge position={[0.8, 1.1, 0.35]} />
      <Valve position={[-0.9, 0.55, 0.35]} />
      <PipeSegment from={[-1.1, 0.55, 0.35]} to={[1.1, 0.55, 0.35]} radius={0.045} />
      <StatusLed position={[0, 1.55, 0.55]} active={active} />
    </InteractiveGroup>
  );
});

export const ChromatographyColumnProxy = memo(function ChromatographyColumnProxy({
  position = [0, 0, 0],
  active = false,
  onClick,
}: GlbProxyProps & { active?: boolean }) {
  return (
    <InteractiveGroup position={position} onClick={onClick}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.16, 1.7, 12]} />
        <meshStandardMaterial {...STEEL.bright} />
      </mesh>
      <mesh position={[0, 1.75, 0]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.25} />
      </mesh>
      <StatusLed position={[0.2, 1.9, 0]} active={active} />
    </InteractiveGroup>
  );
});
