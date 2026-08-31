"use client";

import { useGLTF } from "@react-three/drei";
import { Suspense, useEffect, type ComponentType, type ReactNode } from "react";
import * as THREE from "three";
import { LAB_USE_PROXY_MODELS } from "@/components/laboratory/sceneConfig";

type GlbEquipmentProps = {
  modelPath: string;
  proxy: ComponentType<GlbProxyProps>;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  onClick?: () => void;
};

export type GlbProxyProps = Omit<
  GlbEquipmentProps,
  "modelPath" | "proxy"
>;

function LoadedGltf({
  modelPath,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onPointerOver,
  onPointerOut,
  onClick,
}: Omit<GlbEquipmentProps, "proxy">) {
  const { scene } = useGLTF(modelPath);
  const clone = scene.clone(true);

  useEffect(() => {
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [clone]);

  const scaleVec = Array.isArray(scale) ? scale : ([scale, scale, scale] as const);

  return (
    <group
      position={position}
      rotation={rotation}
      scale={scaleVec}
      onPointerOver={(event) => {
        event.stopPropagation();
        onPointerOver?.();
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        onPointerOut?.();
      }}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
    >
      <primitive object={clone} />
    </group>
  );
}

function GlbInner(props: GlbEquipmentProps) {
  const Proxy = props.proxy;
  if (LAB_USE_PROXY_MODELS) {
    return <Proxy {...props} />;
  }
  return (
    <Suspense fallback={<Proxy {...props} />}>
      <LoadedGltf {...props} />
    </Suspense>
  );
}

export function GlbEquipment(props: GlbEquipmentProps) {
  return <GlbInner {...props} />;
}

export function preloadLabModels(paths: string[]) {
  if (LAB_USE_PROXY_MODELS) return;
  paths.forEach((path) => useGLTF.preload(path));
}

export function EquipmentGroup({
  children,
  highlighted,
}: {
  children: ReactNode;
  highlighted?: boolean;
}) {
  return (
    <group>
      {children}
      {highlighted ? (
        <mesh renderOrder={10}>
          <boxGeometry args={[0.01, 0.01, 0.01]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      ) : null}
    </group>
  );
}
