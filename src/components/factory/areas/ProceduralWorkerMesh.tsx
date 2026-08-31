"use client";

import { useRef, type RefObject } from "react";
import * as THREE from "three";
import type { WorkerUniform } from "@/components/factory/simulation/ProductionState";

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

const UNIFORM_MATS: Record<
  WorkerUniform,
  { body: THREE.MeshStandardMaterial; legs: THREE.MeshStandardMaterial; skin: THREE.MeshStandardMaterial }
> = {
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

/** Fallback capsule worker when GLB is unavailable. */
export function ProceduralWorkerMesh({
  uniformKey,
  bodyRef,
  leftArmRef,
  rightArmRef,
  leftLegRef,
  rightLegRef,
}: {
  uniformKey: WorkerUniform;
  bodyRef: RefObject<THREE.Group | null>;
  leftArmRef: RefObject<THREE.Group | null>;
  rightArmRef: RefObject<THREE.Group | null>;
  leftLegRef: RefObject<THREE.Group | null>;
  rightLegRef: RefObject<THREE.Group | null>;
}) {
  const mats = UNIFORM_MATS[uniformKey];

  return (
    <group ref={bodyRef}>
      <group ref={leftLegRef} position={[-0.1, 0.38, 0]}>
        <mesh geometry={LEG_GEO} material={mats.legs} castShadow={false} />
      </group>
      <group ref={rightLegRef} position={[0.1, 0.38, 0]}>
        <mesh geometry={LEG_GEO} material={mats.legs} castShadow={false} />
      </group>

      <mesh geometry={BODY_GEO} material={mats.body} position={[0, 0.95, 0]} castShadow={false} />
      <mesh geometry={HEAD_GEO} material={mats.skin} position={[0, 1.48, 0]} castShadow={false} />

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
        <mesh geometry={LIMB_GEO} material={mats.body} position={[0, -0.14, 0]} castShadow={false} />
      </group>
      <group ref={rightArmRef} position={[0.24, 1.12, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <mesh geometry={LIMB_GEO} material={mats.body} position={[0, -0.14, 0]} castShadow={false} />
      </group>
    </group>
  );
}

export function uniformForWorkerRole(role: string, uniform?: WorkerUniform): WorkerUniform {
  if (uniform) return uniform;
  const r = role.toLowerCase();
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
