"use client";

import { useFrame } from "@react-three/fiber";
import { memo, useRef } from "react";
import * as THREE from "three";
import type { OfficeAgent } from "@/features/office/core/agents";

type OfficeAgentModelProps = {
  agentId: string;
  agentsRef: React.MutableRefObject<OfficeAgent[]>;
};

/**
 * Procedural character (same spirit as old-version AgentModel, simplified).
 */
export const OfficeAgentModel = memo(function OfficeAgentModel({
  agentId,
  agentsRef,
}: OfficeAgentModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const target = useRef(new THREE.Vector3());
  const colorRef = useRef("#4fc3f7");
  const nameRef = useRef("Agent");

  useFrame(({ clock }) => {
    const agent = agentsRef.current.find((entry) => entry.id === agentId);
    if (!agent || !groupRef.current) return;

    colorRef.current = agent.color;
    nameRef.current = agent.name;
    target.current.set(agent.x, 0, agent.z);
    groupRef.current.position.lerp(target.current, 0.18);

    let rotDelta = agent.facing - groupRef.current.rotation.y;
    while (rotDelta > Math.PI) rotDelta -= Math.PI * 2;
    while (rotDelta < -Math.PI) rotDelta += Math.PI * 2;
    groupRef.current.rotation.y += rotDelta * 0.15;

    const t = clock.elapsedTime * 8;
    const swing =
      agent.state === "walking" ? Math.sin(t) * 0.55 : Math.sin(t * 0.4) * 0.05;
    if (leftArmRef.current) leftArmRef.current.rotation.x = swing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -swing;
    if (leftLegRef.current) leftLegRef.current.rotation.x = -swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = swing;
  });

  const agent = agentsRef.current.find((entry) => entry.id === agentId);
  const color = agent?.color ?? "#4fc3f7";
  const name = agent?.name ?? "Agent";

  return (
    <group ref={groupRef} scale={1.35}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.28, 0.38, 0.18]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.88, 0]} castShadow>
        <boxGeometry args={[0.22, 0.22, 0.22]} />
        <meshLambertMaterial color="#ffe0bd" />
      </mesh>
      <mesh position={[-0.05, 0.92, 0.12]}>
        <boxGeometry args={[0.04, 0.04, 0.02]} />
        <meshBasicMaterial color="#222" />
      </mesh>
      <mesh position={[0.05, 0.92, 0.12]}>
        <boxGeometry args={[0.04, 0.04, 0.02]} />
        <meshBasicMaterial color="#222" />
      </mesh>

      <group ref={leftArmRef} position={[-0.2, 0.62, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.08, 0.28, 0.08]} />
          <meshLambertMaterial color={color} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.2, 0.62, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.08, 0.28, 0.08]} />
          <meshLambertMaterial color={color} />
        </mesh>
      </group>
      <group ref={leftLegRef} position={[-0.08, 0.28, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.09, 0.28, 0.09]} />
          <meshLambertMaterial color="#37474f" />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.08, 0.28, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.09, 0.28, 0.09]} />
          <meshLambertMaterial color="#37474f" />
        </mesh>
      </group>

      {/* Lightweight name marker (avoids drei Text / font fetch failures). */}
      <mesh position={[0, 1.22, 0]}>
        <boxGeometry args={[Math.min(0.55, 0.12 + name.length * 0.045), 0.1, 0.02]} />
        <meshBasicMaterial color="#1a1008" transparent opacity={0.75} />
      </mesh>
      <mesh position={[0, 1.22, 0.02]}>
        <boxGeometry args={[Math.min(0.48, 0.08 + name.length * 0.04), 0.04, 0.01]} />
        <meshBasicMaterial color="#f5f0e8" />
      </mesh>
    </group>
  );
});
