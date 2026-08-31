"use client";

import { memo } from "react";
import { LAB_COLORS } from "@/components/laboratory/sceneConfig";
import type { GlbProxyProps } from "@/components/laboratory/GlbEquipment";

type BioreactorProxyProps = GlbProxyProps & {
  variant?: "main" | "secondary";
};

function steelMaterial(bright = false) {
  return {
    color: bright ? LAB_COLORS.steelBright : LAB_COLORS.steel,
    metalness: 0.88,
    roughness: 0.22,
  } as const;
}

export const BioreactorProxy = memo(function BioreactorProxy({
  variant = "main",
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onPointerOver,
  onPointerOut,
  onClick,
}: BioreactorProxyProps) {
  const isMain = variant === "main";
  const tankR = isMain ? 0.95 : 0.72;
  const tankH = isMain ? 2.35 : 1.85;
  const legH = isMain ? 0.55 : 0.45;
  const scaleVec = Array.isArray(scale) ? scale : ([scale, scale, scale] as const);

  return (
    <group
      position={position}
      rotation={rotation}
      scale={scaleVec}
      onPointerOver={(e) => {
        e.stopPropagation();
        onPointerOver?.();
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onPointerOut?.();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* Support frame */}
      {[0, 120, 240].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <mesh
            key={deg}
            position={[Math.cos(rad) * (tankR + 0.08), legH / 2, Math.sin(rad) * (tankR + 0.08)]}
            castShadow
          >
            <boxGeometry args={[0.08, legH, 0.08]} />
            <meshStandardMaterial {...steelMaterial()} />
          </mesh>
        );
      })}

      {/* Main vessel */}
      <mesh position={[0, legH + tankH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[tankR, tankR * 0.92, tankH, 32]} />
        <meshStandardMaterial {...steelMaterial(true)} />
      </mesh>

      {/* Glass viewport */}
      <mesh position={[tankR + 0.02, legH + tankH * 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.04, 24, 1, false, 0, Math.PI]} />
        <meshPhysicalMaterial
          color={LAB_COLORS.glass}
          metalness={0.05}
          roughness={0.05}
          transmission={0.65}
          thickness={0.15}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Dome head */}
      <mesh position={[0, legH + tankH + 0.18, 0]} castShadow>
        <sphereGeometry args={[tankR * 0.72, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial {...steelMaterial()} />
      </mesh>

      {/* Top ports */}
      {[-0.28, 0, 0.28].map((ox) => (
        <mesh key={ox} position={[ox, legH + tankH + 0.42, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.22, 12]} />
          <meshStandardMaterial {...steelMaterial(true)} />
        </mesh>
      ))}

      {/* Control panel */}
      <group position={[tankR + 0.35, legH + 0.95, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.75, 0.08]} />
          <meshStandardMaterial color={LAB_COLORS.graphite} metalness={0.4} roughness={0.45} />
        </mesh>
        {[0.22, 0, -0.22].map((y, i) => (
          <mesh key={i} position={[-0.12, y, 0.05]}>
            <circleGeometry args={[0.035, 16]} />
            <meshStandardMaterial
              color={i === 0 ? "#22c55e" : i === 1 ? "#38bdf8" : "#64748b"}
              emissive={i === 0 ? "#14532d" : "#0c4a6e"}
              emissiveIntensity={0.4}
            />
          </mesh>
        ))}
      </group>

      {/* Piping */}
      <mesh position={[tankR + 0.15, legH + 0.35, 0.45]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.9, 12]} />
        <meshStandardMaterial {...steelMaterial()} />
      </mesh>
      <mesh position={[-0.55, legH + 1.2, -0.35]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.028, 0.65, 12]} />
        <meshStandardMaterial {...steelMaterial()} />
      </mesh>
    </group>
  );
});
