"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { DOCTOR_WALKING_GLB } from "@/components/factory/assets/factorySceneConfig";

const TARGET_HEIGHT = 1.78;

function pickWalkAction(actions: Record<string, THREE.AnimationAction | null>) {
  const names = Object.keys(actions);
  const preferred = [
    "Walk",
    "walk",
    "Walking",
    "walking",
    "RtWalk",
    "Run",
    "run",
  ];
  for (const name of preferred) {
    if (actions[name]) return actions[name];
  }
  return names.length > 0 ? actions[names[0]!] : null;
}

/** 3DTree "Doctor Walking" — Sketchfab GLB (static walk pose or rigged walk clip). */
export function DoctorWalkingCharacter({ walking }: { walking: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(DOCTOR_WALKING_GLB);
  const { actions } = useAnimations(animations, groupRef);

  const { clone, scale, yOffset, faceYaw } = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mat of mats) {
            if ("envMapIntensity" in mat) {
              (mat as THREE.MeshStandardMaterial).envMapIntensity = 0.85;
            }
          }
        }
      }
    });

    const box = new THREE.Box3().setFromObject(c);
    const size = box.getSize(new THREE.Vector3());
    const h = size.y > 0.01 ? size.y : 1;
    const s = TARGET_HEIGHT / h;
    const footY = box.min.y * s;

    return {
      clone: c,
      scale: s,
      yOffset: -footY,
      faceYaw: Math.PI,
    };
  }, [scene]);

  useEffect(() => {
    const walkAction = pickWalkAction(actions);
    if (!walkAction) return;

    if (walking) {
      walkAction.reset().setEffectiveWeight(1).fadeIn(0.15).play();
    } else {
      walkAction.fadeOut(0.15);
    }

    return () => {
      walkAction.stop();
    };
  }, [actions, walking]);

  return (
    <group ref={groupRef} scale={scale} position={[0, yOffset, 0]} rotation={[0, faceYaw, 0]}>
      <primitive object={clone} />
    </group>
  );
}

useGLTF.preload(DOCTOR_WALKING_GLB);
