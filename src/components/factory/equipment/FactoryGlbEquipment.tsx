"use client";

import { Suspense, type ComponentType } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { FACTORY_USE_PROXY_MODELS } from "@/components/factory/assets/factorySceneConfig";
import type { GlbProxyProps } from "@/components/laboratory/GlbEquipment";

type FactoryProxyProps = GlbProxyProps & { active?: boolean };

type FactoryGlbProps = FactoryProxyProps & {
  modelPath: string | null;
  proxy: ComponentType<FactoryProxyProps>;
  proxyProps?: Record<string, unknown>;
};

function LoadedModel({
  modelPath,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onClick,
  onPointerOver,
  onPointerOut,
}: Omit<FactoryGlbProps, "proxy" | "proxyProps" | "active">) {
  const { scene } = useGLTF(modelPath!);
  const clone = scene.clone(true);
  clone.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });
  const s = Array.isArray(scale) ? scale : ([scale, scale, scale] as const);
  return (
    <group
      position={position}
      rotation={rotation}
      scale={s}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onPointerOver?.();
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onPointerOut?.();
      }}
    >
      <primitive object={clone} />
    </group>
  );
}

export function FactoryGlbEquipment({
  modelPath,
  proxy: Proxy,
  proxyProps,
  active,
  ...rest
}: FactoryGlbProps) {
  if (FACTORY_USE_PROXY_MODELS || !modelPath) {
    return <Proxy {...rest} {...proxyProps} active={active} />;
  }
  return (
    <Suspense fallback={<Proxy {...rest} {...proxyProps} active={active} />}>
      <LoadedModel modelPath={modelPath} {...rest} />
    </Suspense>
  );
}
