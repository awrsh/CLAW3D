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

export type TankVariant =
  | "preparation"
  | "industrial"
  | "chemical"
  | "stainless"
  | "ibc"
  | "iso"
  | "utility-water";

type TankProps = GlbProxyProps & {
  variant?: TankVariant;
  active?: boolean;
  label?: string;
};

const VARIANTS: Record<
  TankVariant,
  { r: number; h: number; legH: number; hasMotor?: boolean; cage?: boolean }
> = {
  preparation: { r: 0.75, h: 2.2, legH: 0.5, hasMotor: true },
  industrial: { r: 0.85, h: 2.5, legH: 0.45, hasMotor: true },
  chemical: { r: 0.7, h: 2.0, legH: 0.4 },
  stainless: { r: 0.65, h: 1.9, legH: 0.45, hasMotor: true },
  ibc: { r: 0.55, h: 1.15, legH: 0.15, cage: true },
  iso: { r: 0.6, h: 1.35, legH: 0.2, cage: true },
  "utility-water": { r: 0.9, h: 2.8, legH: 0.35 },
};

export const TankProxy = memo(function TankProxy({
  variant = "industrial",
  active = false,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onClick,
}: TankProps) {
  const v = VARIANTS[variant];
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
      {v.cage ? (
        <mesh position={[0, v.legH + v.h / 2, 0]} castShadow>
          <boxGeometry args={[v.r * 2.1, v.h, v.r * 2.1]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.45} roughness={0.5} wireframe={false} />
        </mesh>
      ) : null}

      <mesh position={[0, v.legH + v.h / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[v.r, v.r * 0.94, v.h, 24]} />
        <meshStandardMaterial {...STEEL.bright} />
      </mesh>

      {v.hasMotor ? (
        <mesh position={[0, v.legH + v.h + 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.28, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.35} />
        </mesh>
      ) : null}

      <PipeSegment from={[v.r, v.legH + v.h * 0.5, 0]} to={[v.r + 0.5, v.legH + v.h * 0.5, 0]} />
      <Valve position={[v.r + 0.25, v.legH + v.h * 0.5, 0]} />
      <PressureGauge position={[v.r + 0.08, v.legH + v.h * 0.72, 0]} />
      <StatusLed position={[0, v.legH + v.h + 0.45, v.r * 0.5]} active={active} />
    </InteractiveGroup>
  );
});

export const PrepTankProxy = (props: Omit<TankProps, "variant">) => (
  <TankProxy variant="preparation" {...props} />
);
export const IndustrialTankProxy = (props: Omit<TankProps, "variant">) => (
  <TankProxy variant="industrial" {...props} />
);
export const ChemicalTankProxy = (props: Omit<TankProps, "variant">) => (
  <TankProxy variant="chemical" {...props} />
);
export const StainlessTankProxy = (props: Omit<TankProps, "variant">) => (
  <TankProxy variant="stainless" {...props} />
);
export const IbcTankProxy = (props: Omit<TankProps, "variant">) => (
  <TankProxy variant="ibc" {...props} />
);
export const IsoTankProxy = (props: Omit<TankProps, "variant">) => (
  <TankProxy variant="iso" {...props} />
);
export const UtilityWaterTankProxy = (props: Omit<TankProps, "variant">) => (
  <TankProxy variant="utility-water" {...props} />
);
