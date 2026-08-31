"use client";

import { memo } from "react";

/** Single sun + fill — no point lights (each point light is a full shadow pass). */
export const FactoryLighting = memo(function FactoryLighting({
  shadows = true,
  shadowMapSize = 1024,
}: {
  shadows?: boolean;
  shadowMapSize?: number;
}) {
  return (
    <>
      <ambientLight intensity={0.72} color="#f0f4f8" />
      <hemisphereLight args={["#ffffff", "#c8d0d8", 0.55]} />
      <directionalLight
        position={[30, 42, 20]}
        intensity={1.05}
        color="#ffffff"
        castShadow={shadows}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-far={120}
        shadow-camera-left={-64}
        shadow-camera-right={64}
        shadow-camera-top={32}
        shadow-camera-bottom={-32}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-24, 18, -12]} intensity={0.28} color="#dbeafe" />
    </>
  );
});
