"use client";

import { memo } from "react";
import type { GlbProxyProps } from "@/components/laboratory/GlbEquipment";
import {
  ControlScreen,
  Conveyor,
  InteractiveGroup,
  StatusLed,
  STEEL,
} from "@/components/factory/equipment/shared";

export const FillingMachineProxy = memo(function FillingMachineProxy({
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
      <Conveyor position={[0, 0.55, 0.6]} length={9} animated={active} />
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 2.2, 1.5]} />
        <meshStandardMaterial {...STEEL.bright} />
      </mesh>
      {[-0.9, -0.3, 0.3, 0.9].map((x) => (
        <mesh key={x} position={[x, 1.55, 0.35]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.35, 8]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.35} />
        </mesh>
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[-3 + i * 0.85, 0.72, 0.85]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.14, 8]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
        </mesh>
      ))}
      <ControlScreen position={[1.35, 1.55, -0.55]} active={active} />
      <StatusLed position={[-1.35, 2.35, 0.6]} active={active} />
    </InteractiveGroup>
  );
});
