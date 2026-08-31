"use client";

import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { memo, useRef } from "react";
import * as THREE from "three";
import { useInspectorReporter } from "@/components/laboratory/context/LaboratoryInspectorContext";
import {
  createInspectorState,
  tickInspector,
  type InspectorState,
} from "@/components/laboratory/inspectorPatrol";

type LabInspectorProps = {
  enabled?: boolean;
};

export const LabInspector = memo(function LabInspector({
  enabled = true,
}: LabInspectorProps) {
  const stateRef = useRef<InspectorState>(createInspectorState());
  const bodyRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const report = useInspectorReporter();
  const uiThrottle = useRef(0);

  useFrame((_, delta) => {
    if (!enabled) return;

    stateRef.current = tickInspector(stateRef.current, delta);
    const s = stateRef.current;

    if (bodyRef.current) {
      bodyRef.current.visible = s.visible;
      bodyRef.current.position.copy(s.position);
      bodyRef.current.rotation.y = s.rotationY;
    }

    const checking = s.phase === "checking";
    const walking = s.phase === "patrol";
    const t = performance.now() * 0.001;

    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = checking
        ? -0.45 + Math.sin(t * 2) * 0.05
        : walking
          ? Math.sin(t * 8) * 0.25
          : 0;
    }

    uiThrottle.current += delta;
    if (uiThrottle.current >= 0.2) {
      uiThrottle.current = 0;
      report({
        visible: s.visible,
        phase: s.phase,
        activityLabel: s.activityLabel,
      });
    }
  });

  return (
    <group ref={bodyRef} visible={false} name="lab-inspector">
      <mesh position={[0, 0.95, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.55, 6, 12]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.65} metalness={0.05} />
      </mesh>
      <mesh position={[0, 1.48, 0]} castShadow>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#f5d0a8" roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.58, 0]}>
        <sphereGeometry args={[0.145, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>
      <mesh position={[-0.08, 0.38, 0]} castShadow>
        <boxGeometry args={[0.1, 0.45, 0.1]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      <mesh position={[0.08, 0.38, 0]} castShadow>
        <boxGeometry args={[0.1, 0.45, 0.1]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      <group position={[0.22, 1.05, 0.05]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <boxGeometry args={[0.07, 0.24, 0.07]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.65} />
        </mesh>
        <mesh position={[0.06, -0.02, 0.06]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.14, 0.2, 0.02]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
        </mesh>
      </group>
      <group ref={leftArmRef} position={[-0.22, 1.05, 0]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <boxGeometry args={[0.07, 0.24, 0.07]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.65} />
        </mesh>
      </group>
      <Billboard position={[0, 1.85, 0]}>
        <Text
          fontSize={0.11}
          color="#0f172a"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor="#ffffff"
        >
          QA Inspector
        </Text>
      </Billboard>
    </group>
  );
});
