"use client";

import { Billboard, Text } from "@react-three/drei";
import { memo, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  useWorkerAnimationBinding,
} from "@/components/factory/areas/WorkerAnimationSystem";
import type { AreaWorker, WorkerUniform } from "@/components/factory/simulation/ProductionState";

const UNIFORMS: Record<
  WorkerUniform,
  { body: string; legs: string; skin: string; cap?: string }
> = {
  cleanroom: { body: "#f8fafc", legs: "#e2e8f0", skin: "#e8c4a0", cap: "#ffffff" },
  lab: { body: "#f1f5f9", legs: "#334155", skin: "#e8c4a0", cap: "#e2e8f0" },
  warehouse: { body: "#64748b", legs: "#475569", skin: "#d4a574" },
  office: { body: "#1e293b", legs: "#334155", skin: "#e8c4a0" },
  security: { body: "#0f172a", legs: "#1e293b", skin: "#c9956a" },
};

const BODY_GEO = new THREE.CapsuleGeometry(0.2, 0.52, 4, 8);
const HEAD_GEO = new THREE.SphereGeometry(0.15, 10, 10);
const LIMB_GEO = new THREE.BoxGeometry(0.09, 0.28, 0.09);
const LEG_GEO = new THREE.BoxGeometry(0.12, 0.42, 0.12);

function uniformForWorker(worker: AreaWorker): WorkerUniform {
  if (worker.uniform) return worker.uniform;
  const r = worker.role.toLowerCase();
  if (r.includes("security") || r.includes("reception")) return "security";
  if (r.includes("warehouse") || r.includes("shipping") || r.includes("logistics"))
    return "warehouse";
  if (
    r.includes("supervisor") ||
    r.includes("director") ||
    r.includes("clerk") ||
    r.includes("coordinator") ||
    r.includes("assistant")
  )
    return "office";
  if (r.includes("scientist") || r.includes("analyst") || r.includes("microbiologist"))
    return "lab";
  return "cleanroom";
}

function hashId(id: string): number {
  return id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function defaultPatrol(worker: AreaWorker): { to: [number, number, number]; speed: number } {
  const h = hashId(worker.id);
  const dist = 1.8 + (h % 4) * 0.55;
  const axis = h % 2 === 0 ? "x" : "z";
  const sign = h % 3 === 0 ? -1 : 1;
  return {
    to: axis === "x" ? [sign * dist, 0, 0] : [0, 0, sign * dist],
    speed: 0.35 + (h % 6) * 0.08,
  };
}

const UNIFORM_MATS: Record<WorkerUniform, { body: THREE.MeshStandardMaterial; legs: THREE.MeshStandardMaterial; skin: THREE.MeshStandardMaterial }> = {
  cleanroom: {
    body: new THREE.MeshStandardMaterial({ color: UNIFORMS.cleanroom.body, roughness: 0.68 }),
    legs: new THREE.MeshStandardMaterial({ color: UNIFORMS.cleanroom.legs, roughness: 0.75 }),
    skin: new THREE.MeshStandardMaterial({ color: UNIFORMS.cleanroom.skin, roughness: 0.78 }),
  },
  lab: {
    body: new THREE.MeshStandardMaterial({ color: UNIFORMS.lab.body, roughness: 0.68 }),
    legs: new THREE.MeshStandardMaterial({ color: UNIFORMS.lab.legs, roughness: 0.75 }),
    skin: new THREE.MeshStandardMaterial({ color: UNIFORMS.lab.skin, roughness: 0.78 }),
  },
  warehouse: {
    body: new THREE.MeshStandardMaterial({ color: UNIFORMS.warehouse.body, roughness: 0.68 }),
    legs: new THREE.MeshStandardMaterial({ color: UNIFORMS.warehouse.legs, roughness: 0.75 }),
    skin: new THREE.MeshStandardMaterial({ color: UNIFORMS.warehouse.skin, roughness: 0.78 }),
  },
  office: {
    body: new THREE.MeshStandardMaterial({ color: UNIFORMS.office.body, roughness: 0.68 }),
    legs: new THREE.MeshStandardMaterial({ color: UNIFORMS.office.legs, roughness: 0.75 }),
    skin: new THREE.MeshStandardMaterial({ color: UNIFORMS.office.skin, roughness: 0.78 }),
  },
  security: {
    body: new THREE.MeshStandardMaterial({ color: UNIFORMS.security.body, roughness: 0.68 }),
    legs: new THREE.MeshStandardMaterial({ color: UNIFORMS.security.legs, roughness: 0.75 }),
    skin: new THREE.MeshStandardMaterial({ color: UNIFORMS.security.skin, roughness: 0.78 }),
  },
};

export const FactoryWorker = memo(function FactoryWorker({
  worker,
  showActivity = true,
  areaSize,
}: {
  worker: AreaWorker;
  showActivity?: boolean;
  areaSize?: [number, number];
}) {
  const uniformKey = uniformForWorker(worker);
  const mats = UNIFORM_MATS[uniformKey];
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  const patrol = useMemo(() => {
    if (worker.static) return null;
    const p = worker.patrol ?? defaultPatrol(worker);
    const [w = 14, d = 14] = areaSize ?? [];
    const maxDist = Math.min(w, d) * 0.28;
    const len = Math.hypot(p.to[0], p.to[2]);
    const scale = len > maxDist ? maxDist / len : 1;
    return {
      to: [p.to[0] * scale, 0, p.to[2] * scale] as [number, number, number],
      speed: p.speed ?? 0.5,
    };
  }, [worker, areaSize]);

  const startPos = useMemo(
    () => new THREE.Vector3(...worker.position),
    [worker.position],
  );
  const endPos = useMemo(() => {
    const p = patrol?.to ?? [0, 0, 0];
    return startPos.clone().add(new THREE.Vector3(p[0], p[1], p[2]));
  }, [startPos, patrol]);

  const walking = patrol !== null;

  useWorkerAnimationBinding({
    id: worker.id,
    rootRef,
    bodyRef,
    leftArmRef,
    rightArmRef,
    leftLegRef,
    rightLegRef,
    startPos,
    endPos,
    speed: patrol?.speed ?? 0,
    baseYaw: worker.rotation ?? 0,
    walking,
  });

  const bodyMat = mats.body;
  const legsMat = mats.legs;
  const skinMat = mats.skin;

  const initialYaw = worker.rotation ?? 0;

  return (
    <group ref={rootRef} position={worker.position} rotation={[0, initialYaw, 0]}>
      <group ref={bodyRef}>
        <group ref={leftLegRef} position={[-0.1, 0.38, 0]}>
          <mesh geometry={LEG_GEO} material={legsMat} castShadow={false} />
        </group>
        <group ref={rightLegRef} position={[0.1, 0.38, 0]}>
          <mesh geometry={LEG_GEO} material={legsMat} castShadow={false} />
        </group>

        <mesh geometry={BODY_GEO} material={bodyMat} position={[0, 0.95, 0]} castShadow={false} />
        <mesh geometry={HEAD_GEO} material={skinMat} position={[0, 1.48, 0]} castShadow={false} />

        {UNIFORMS[uniformKey].cap ? (
          <mesh position={[0, 1.58, 0]}>
            <sphereGeometry args={[0.155, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
            <meshStandardMaterial color={UNIFORMS[uniformKey].cap} roughness={0.85} />
          </mesh>
        ) : (
          <mesh position={[0, 1.56, -0.02]}>
            <boxGeometry args={[0.16, 0.06, 0.14]} />
            <meshStandardMaterial color="#3d3028" roughness={0.9} />
          </mesh>
        )}

        <group ref={leftArmRef} position={[-0.24, 1.12, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh geometry={LIMB_GEO} material={bodyMat} position={[0, -0.14, 0]} castShadow={false} />
        </group>
        <group ref={rightArmRef} position={[0.24, 1.12, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <mesh geometry={LIMB_GEO} material={bodyMat} position={[0, -0.14, 0]} castShadow={false} />
        </group>
      </group>

      {showActivity ? (
        <Billboard position={[0, 1.95, 0]}>
          <Text
            fontSize={0.085}
            color="#0f172a"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.012}
            outlineColor="#ffffff"
            maxWidth={2.6}
            textAlign="center"
          >
            {worker.activity}
          </Text>
        </Billboard>
      ) : null}
    </group>
  );
});
