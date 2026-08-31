"use client";

import { memo } from "react";
import type { GlbProxyProps } from "@/components/laboratory/GlbEquipment";
import {
  ControlScreen,
  InteractiveGroup,
  PipeSegment,
  StatusLed,
  STEEL,
  Valve,
} from "@/components/factory/equipment/shared";
import { CentrifugalPumpProxy } from "@/components/factory/equipment/Pump";
import { UtilityWaterTankProxy } from "@/components/factory/equipment/Tank";

export const WeighingStationProxy = memo(function WeighingStationProxy({
  position = [0, 0, 0],
  active = false,
  onClick,
}: GlbProxyProps & { active?: boolean }) {
  return (
    <InteractiveGroup position={position} onClick={onClick}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.9, 0.9]} />
        <meshStandardMaterial {...STEEL.bright} />
      </mesh>
      <mesh position={[0, 0.92, 0]} castShadow>
        <boxGeometry args={[0.7, 0.04, 0.7]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.6} roughness={0.25} />
      </mesh>
      <mesh position={[0.55, 0.65, 0]} castShadow>
        <boxGeometry args={[0.35, 0.25, 0.25]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
      </mesh>
      <ControlScreen position={[0.75, 1.05, -0.2]} active={active} />
      <StatusLed position={[0, 1.15, 0.45]} active={active} />
    </InteractiveGroup>
  );
});

export const UtilitiesSkidProxy = memo(function UtilitiesSkidProxy({
  position = [0, 0, 0],
  active = false,
  onClick,
}: GlbProxyProps & { active?: boolean }) {
  return (
    <InteractiveGroup position={position} onClick={onClick}>
      <UtilityWaterTankProxy position={[-2.5, 0, 0]} scale={0.85} active={active} />
      <mesh position={[1.2, 0.55, 0]} castShadow>
        <boxGeometry args={[2.4, 1.1, 0.9]} />
        <meshStandardMaterial {...STEEL.bright} />
      </mesh>
      <mesh position={[0.5, 0.95, 0.15]} castShadow>
        <boxGeometry args={[0.45, 0.55, 0.45]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.55} />
      </mesh>
      <mesh position={[1.8, 0.95, -0.1]} castShadow>
        <boxGeometry args={[0.35, 0.45, 0.35]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.15} />
      </mesh>
      <CentrifugalPumpProxy position={[2.8, 0, 0.2]} active={active} />
      <PipeSegment from={[-1.2, 1.2, 0]} to={[0.5, 1.2, 0]} />
      <Valve position={[0, 1.2, 0]} />
      <ControlScreen position={[1.2, 1.35, -0.45]} active={active} />
      <StatusLed position={[2.2, 1.5, 0.45]} active={active} />
    </InteractiveGroup>
  );
});
