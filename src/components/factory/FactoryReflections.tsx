"use client";

import { Environment } from "@react-three/drei";
import { memo } from "react";
import { FACTORY_DIMENSIONS } from "@/components/factory/simulation/factoryLayout";

const { width, depth } = FACTORY_DIMENSIONS;

/**
 * IBL glossy floor — same visual as reflections without MeshReflectorMaterial's extra render pass.
 */
export const FactoryReflections = memo(function FactoryReflections() {
  return (
    <group name="factory-reflections">
      <Environment preset="warehouse" background={false} environmentIntensity={0.5} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color="#dce3ea"
          roughness={0.38}
          metalness={0.16}
          envMapIntensity={0.85}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, 0]} receiveShadow>
        <planeGeometry args={[12, depth - 4]} />
        <meshStandardMaterial
          color="#c8ddf5"
          roughness={0.26}
          metalness={0.22}
          envMapIntensity={1.05}
        />
      </mesh>
    </group>
  );
});
