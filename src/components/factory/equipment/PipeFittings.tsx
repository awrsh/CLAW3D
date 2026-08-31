"use client";

import { memo } from "react";
import * as THREE from "three";
import { STEEL } from "@/components/factory/equipment/shared";

/** T-junction where three pipe runs meet */
export const PipeTee = memo(function PipeTee({
  position,
  radius = 0.05,
  axis = "x",
}: {
  position: [number, number, number];
  radius?: number;
  axis?: "x" | "z";
}) {
  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[radius * 1.35, 10, 10]} />
        <meshStandardMaterial {...STEEL.dark} />
      </mesh>
      {axis === "x" ? (
        <mesh position={[0, 0, radius * 1.8]} castShadow>
          <cylinderGeometry args={[radius, radius, radius * 2.2, 8]} />
          <meshStandardMaterial {...STEEL.dark} />
        </mesh>
      ) : (
        <mesh rotation={[0, 0, Math.PI / 2]} position={[radius * 1.8, 0, 0]} castShadow>
          <cylinderGeometry args={[radius, radius, radius * 2.2, 8]} />
          <meshStandardMaterial {...STEEL.dark} />
        </mesh>
      )}
    </group>
  );
});

/** 90° elbow fitting */
export const PipeElbow = memo(function PipeElbow({
  position,
  rotation = 0,
  radius = 0.05,
}: {
  position: [number, number, number];
  rotation?: number;
  radius?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow>
        <torusGeometry args={[radius * 1.6, radius, 8, 12, Math.PI / 2]} />
        <meshStandardMaterial {...STEEL.dark} />
      </mesh>
    </group>
  );
});

/** Flange ring at pipe connection point */
export const PipeFlange = memo(function PipeFlange({
  position,
  rotation = 0,
  radius = 0.05,
}: {
  position: [number, number, number];
  rotation?: number;
  radius?: number;
}) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, rotation, 0]} castShadow>
      <cylinderGeometry args={[radius * 2.2, radius * 2.2, 0.04, 12]} />
      <meshStandardMaterial {...STEEL.bright} />
    </mesh>
  );
});

/** Insulated valve + gauge cluster */
export const PipeJunctionBox = memo(function PipeJunctionBox({
  position,
  active,
}: {
  position: [number, number, number];
  active?: boolean;
}) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.28, 0.22, 0.28]} />
        <meshStandardMaterial color="#475569" metalness={0.55} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.06, 8]} />
        <meshStandardMaterial
          color={active ? "#22c55e" : "#64748b"}
          emissive={active ? "#16a34a" : "#000000"}
          emissiveIntensity={active ? 0.4 : 0}
        />
      </mesh>
    </group>
  );
});

/** Sample port stub for QA/QC lines */
export const SamplePort = memo(function SamplePort({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.18, 8]} />
        <meshStandardMaterial {...STEEL.bright} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#0ea5e9" metalness={0.3} roughness={0.4} />
      </mesh>
    </group>
  );
});

/** Utility manifold with local pipe stubs */
export function PipeManifold({
  position,
  radius = 0.04,
}: {
  position: [number, number, number];
  radius?: number;
}) {
  const stubs: Array<{ offset: [number, number, number]; rot: [number, number, number]; len: number }> = [
    { offset: [0, 0, 0.45], rot: [Math.PI / 2, 0, 0], len: 0.9 },
    { offset: [0.45, 0, 0], rot: [0, 0, Math.PI / 2], len: 0.9 },
    { offset: [0, 0.35, 0], rot: [0, 0, 0], len: 0.7 },
  ];

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.35, 0.25, 0.35]} />
        <meshStandardMaterial {...STEEL.dark} />
      </mesh>
      {stubs.map((stub, i) => (
        <mesh key={i} position={stub.offset} rotation={stub.rot} castShadow>
          <cylinderGeometry args={[radius, radius, stub.len, 8]} />
          <meshStandardMaterial {...STEEL.dark} />
        </mesh>
      ))}
    </group>
  );
}

function stubMesh(
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
  key: string,
) {
  const mid = from.clone().add(to).multiplyScalar(0.5);
  const len = from.distanceTo(to);
  const dir = to.clone().sub(from).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  return (
    <mesh key={key} position={mid.toArray() as [number, number, number]} quaternion={quat} castShadow>
      <cylinderGeometry args={[radius, radius, len, 8]} />
      <meshStandardMaterial {...STEEL.dark} />
    </mesh>
  );
}

export function connectPipes(
  segments: Array<{ from: [number, number, number]; to: [number, number, number]; radius?: number }>,
) {
  return segments.map((seg, i) => stubMesh(
    new THREE.Vector3(...seg.from),
    new THREE.Vector3(...seg.to),
    seg.radius ?? 0.04,
    `seg-${i}`,
  ));
}
