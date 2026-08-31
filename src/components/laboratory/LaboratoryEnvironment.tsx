"use client";

import { memo } from "react";
import { LAB_COLORS, LAB_DIMENSIONS } from "@/components/laboratory/sceneConfig";
import { WALKWAY_STRIPS } from "@/components/laboratory/labLayout";

type LaboratoryEnvironmentProps = {
  pipeDetail?: "full" | "simple";
};

function GlassPartition({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshPhysicalMaterial
        color={LAB_COLORS.glassTint}
        metalness={0.05}
        roughness={0.06}
        transmission={0.62}
        transparent
        opacity={0.35}
        thickness={0.08}
      />
    </mesh>
  );
}

export const LaboratoryEnvironment = memo(function LaboratoryEnvironment({
  pipeDetail = "full",
}: LaboratoryEnvironmentProps) {
  const { width, depth, height, glassPartitionHeight } = LAB_DIMENSIONS;
  const halfW = width / 2;
  const halfD = depth / 2;

  return (
    <group>
      {/* Epoxy floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width + 2, depth + 2]} />
        <meshStandardMaterial color={LAB_COLORS.floor} roughness={0.28} metalness={0.08} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[width * 0.96, depth * 0.96]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.18} metalness={0.12} transparent opacity={0.35} />
      </mesh>

      {/* Perimeter walls */}
      {(
        [
          [0, height / 2, -halfD, width, height, 0.18],
          [0, height / 2, halfD, width, height, 0.18],
          [-halfW, height / 2, 0, 0.18, height, depth],
          [halfW, height / 2, 0, 0.18, height, depth],
        ] as const
      ).map((wall, i) => (
        <mesh key={i} position={[wall[0], wall[1], wall[2]]} receiveShadow castShadow={i === 0}>
          <boxGeometry args={[wall[3], wall[4], wall[5]]} />
          <meshStandardMaterial color={LAB_COLORS.wall} roughness={0.52} metalness={0.04} />
        </mesh>
      ))}

      {/* Large glass facade — front */}
      <mesh position={[0, height * 0.45, halfD - 0.04]}>
        <boxGeometry args={[width * 0.55, height * 0.75, 0.04]} />
        <meshPhysicalMaterial
          color={LAB_COLORS.glass}
          metalness={0.1}
          roughness={0.03}
          transmission={0.72}
          transparent
          opacity={0.45}
          thickness={0.1}
        />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={LAB_COLORS.ceiling} roughness={0.65} metalness={0.02} />
      </mesh>

      {/* Ceiling LED panels */}
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 6 }).map((__, col) => {
          const x = -halfW * 0.72 + col * (halfW * 0.26);
          const z = -halfD * 0.62 + row * (halfD * 0.18);
          return (
            <mesh key={`${row}-${col}`} position={[x, height - 0.03, z]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.8, 0.85]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#f8fafc"
                emissiveIntensity={0.35}
                roughness={0.4}
              />
            </mesh>
          );
        }),
      )}

      <GlassPartition
        position={[2, glassPartitionHeight / 2, 1]}
        size={[0.05, glassPartitionHeight, depth * 0.62]}
      />
      <GlassPartition
        position={[-5, glassPartitionHeight / 2, -3]}
        size={[14, glassPartitionHeight, 0.05]}
      />

      {/* Walkway strips — inspector corridor */}
      {WALKWAY_STRIPS.map((strip, i) => (
        <mesh
          key={`walk-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[strip.position[0], strip.position[1], strip.position[2]]}
        >
          <planeGeometry args={strip.size} />
          <meshStandardMaterial
            color={LAB_COLORS.walkway}
            roughness={0.32}
            transparent
            opacity={0.35}
          />
        </mesh>
      ))}

      {/* Zone floor markings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-11, 0.003, -2]}>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.35} transparent opacity={0.45} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.003, 6]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.35} transparent opacity={0.4} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, 0.003, -6]}>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.35} transparent opacity={0.4} />
      </mesh>
      {pipeDetail === "full" ? (
        <group position={[-12, 0, -1]}>
          <mesh position={[0, 0.85, 0.8]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 5.5, 12]} />
            <meshStandardMaterial color={LAB_COLORS.steel} metalness={0.88} roughness={0.22} />
          </mesh>
          <mesh position={[2, 1.45, 0.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 2.4, 12]} />
            <meshStandardMaterial color={LAB_COLORS.steelBright} metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[-1.1, 0.45, 1.2]} castShadow>
            <boxGeometry args={[0.35, 0.55, 0.25]} />
            <meshStandardMaterial color={LAB_COLORS.graphite} metalness={0.45} roughness={0.4} />
          </mesh>
        </group>
      ) : null}

      {/* Wall scientific graphic — molecular */}
      <mesh position={[-halfW + 0.12, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.5, 1.2]} />
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.35} roughness={0.6} />
      </mesh>
    </group>
  );
});
