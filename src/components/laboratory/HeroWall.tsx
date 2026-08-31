"use client";

import { memo, useMemo } from "react";
import * as THREE from "three";
import { LAB_COLORS, LAB_DIMENSIONS } from "@/components/laboratory/sceneConfig";

type HeroWallProps = {
  enableGlow?: boolean;
};

function DnaHelix({ offsetX }: { offsetX: number }) {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      const y = t * 2.8 + 0.5;
      const angle = t * Math.PI * 4;
      points.push(
        new THREE.Vector3(offsetX + Math.cos(angle) * 0.18, y, Math.sin(angle) * 0.08),
      );
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 64, 0.012, 8, false);
  }, [offsetX]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={LAB_COLORS.accentTeal}
        emissive="#0f766e"
        emissiveIntensity={0.15}
        metalness={0.35}
        roughness={0.45}
      />
    </mesh>
  );
}

export const HeroWall = memo(function HeroWall({ enableGlow = true }: HeroWallProps) {
  const halfW = LAB_DIMENSIONS.width / 2;
  const halfD = LAB_DIMENSIONS.depth / 2;

  return (
    <group position={[0, 0, -halfD + 0.06]}>
      <mesh position={[0, LAB_DIMENSIONS.height / 2, 0]} receiveShadow>
        <boxGeometry args={[LAB_DIMENSIONS.width * 0.72, LAB_DIMENSIONS.height, 0.14]} />
        <meshStandardMaterial color={LAB_COLORS.wall} metalness={0.06} roughness={0.48} />
      </mesh>

      {Array.from({ length: 9 }).map((_, i) => {
        const x = -halfW * 0.68 + i * ((halfW * 1.36) / 8);
        return (
          <mesh key={i} position={[x, LAB_DIMENSIONS.height / 2, 0.08]}>
            <boxGeometry args={[0.04, LAB_DIMENSIONS.height * 0.92, 0.02]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? LAB_COLORS.wallAccent : "#eef1f4"}
              metalness={0.1}
              roughness={0.42}
            />
          </mesh>
        );
      })}

      <group position={[0, 2.1, 0.1]}>
        <mesh>
          <boxGeometry args={[3.2, 1.35, 0.04]} />
          <meshStandardMaterial color="#ffffff" metalness={0.05} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[2.4, 0.75, 0.01]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.08} roughness={0.5} />
        </mesh>
        {enableGlow ? (
          <pointLight
            position={[0, 0, 0.45]}
            intensity={0.55}
            color={LAB_COLORS.heroGlow}
            distance={4}
            decay={2}
          />
        ) : null}
      </group>

      {[
        [-3.2, 1.2],
        [-2.4, 2.6],
        [2.5, 1.4],
        [3.1, 2.8],
        [-1.2, 3.2],
        [1.4, 3.0],
      ].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.09]} rotation={[0, 0, i * 0.2]}>
          <ringGeometry args={[0.08, 0.12, 6]} />
          <meshStandardMaterial
            color={LAB_COLORS.accentBlue}
            transparent
            opacity={0.22}
            metalness={0.2}
            roughness={0.5}
          />
        </mesh>
      ))}

      <DnaHelix offsetX={-4.2} />
      <DnaHelix offsetX={4.2} />

      {enableGlow ? (
        <spotLight
          position={[0, 1.2, 0.8]}
          angle={0.85}
          penumbra={0.9}
          intensity={0.45}
          color="#dbeafe"
          distance={8}
          decay={2}
        />
      ) : null}
    </group>
  );
});
