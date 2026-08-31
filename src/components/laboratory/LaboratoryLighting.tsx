"use client";

import { memo } from "react";
import { LAB_DIMENSIONS } from "@/components/laboratory/sceneConfig";

type LaboratoryLightingProps = {
  shadows?: boolean;
  enableHeroGlow?: boolean;
};

export const LaboratoryLighting = memo(function LaboratoryLighting({
  shadows = true,
  enableHeroGlow = true,
}: LaboratoryLightingProps) {
  const { width, depth, height } = LAB_DIMENSIONS;

  return (
    <>
      <color attach="background" args={["#eef2f6"]} />
      <fog attach="fog" args={["#eef2f6", 28, 55]} />

      <ambientLight intensity={0.55} color="#f0f4f8" />
      <hemisphereLight args={["#ffffff", "#cbd5e1", 0.45]} />

      <directionalLight
        position={[6, height + 4, 8]}
        intensity={1.15}
        color="#ffffff"
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
      />

      <directionalLight position={[-8, 6, -4]} intensity={0.35} color="#e2e8f0" />

      <pointLight position={[5.5, 3.2, 2.5]} intensity={0.45} color="#f8fafc" distance={12} decay={2} />
      <pointLight position={[-4.5, 3.5, -1]} intensity={0.35} color="#f1f5f9" distance={14} decay={2} />

      {enableHeroGlow ? (
        <spotLight
          position={[0, 3.5, -depth / 2 + 2.5]}
          angle={0.65}
          penumbra={0.85}
          intensity={0.7}
          color="#dbeafe"
          distance={18}
          decay={2}
        />
      ) : null}

      {[
        [-3, height - 0.5, 0],
        [3, height - 0.5, 2],
        [-2, height - 0.5, -3],
      ].map((pos, i) => (
        <pointLight
          key={i}
          position={pos as [number, number, number]}
          intensity={0.28}
          color="#ffffff"
          distance={10}
          decay={2}
        />
      ))}
    </>
  );
});
