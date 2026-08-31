"use client";

import { Billboard, Text } from "@react-three/drei";
import { Component, memo, Suspense, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { DoctorWalkingCharacter } from "@/components/factory/areas/DoctorWalkingCharacter";
import {
  ProceduralWorkerMesh,
  uniformForWorkerRole,
} from "@/components/factory/areas/ProceduralWorkerMesh";
import {
  useWorkerAnimationBinding,
} from "@/components/factory/areas/WorkerAnimationSystem";
import { FACTORY_USE_DOCTOR_GLB } from "@/components/factory/assets/factorySceneConfig";
import { buildWorkerPatrolPath } from "@/components/factory/simulation/workerNavMesh";
import type { AreaWorker, FactoryAreaId } from "@/components/factory/simulation/ProductionState";

const CLICK_GEO = new THREE.CapsuleGeometry(0.32, 1.1, 4, 8);

class WorkerGlbErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
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
    speed: 1.05 + (h % 5) * 0.14,
  };
}

export const FactoryWorker = memo(function FactoryWorker({
  worker,
  showActivity = true,
  areaSize,
  areaId,
  clickable = false,
  onSelect,
  selected = false,
}: {
  worker: AreaWorker;
  showActivity?: boolean;
  areaSize?: [number, number];
  areaId?: FactoryAreaId;
  clickable?: boolean;
  onSelect?: () => void;
  selected?: boolean;
}) {
  const uniformKey = uniformForWorkerRole(worker.role, worker.uniform);
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

  const waypoints = useMemo(() => {
    if (!patrol || !areaSize || !areaId) return [];
    return buildWorkerPatrolPath(worker.position, patrol.to, areaSize, areaId);
  }, [patrol, worker.position, areaSize, areaId]);

  const areaOffset = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const walking = waypoints.length >= 2;
  const useGltfCharacter = FACTORY_USE_DOCTOR_GLB;

  const binding = useMemo(
    () => ({
      id: worker.id,
      rootRef,
      bodyRef,
      leftArmRef,
      rightArmRef,
      leftLegRef,
      rightLegRef,
      waypoints,
      speed: patrol?.speed ?? 1.1,
      baseYaw: worker.rotation ?? 0,
      walking,
      areaOffset,
      useGltfCharacter,
    }),
    [
      worker.id,
      worker.rotation,
      waypoints,
      patrol?.speed,
      walking,
      areaOffset,
      useGltfCharacter,
    ],
  );

  useWorkerAnimationBinding(binding);

  const initialYaw = worker.rotation ?? 0;

  const proceduralFallback = (
    <ProceduralWorkerMesh
      uniformKey={uniformKey}
      bodyRef={bodyRef}
      leftArmRef={leftArmRef}
      rightArmRef={rightArmRef}
      leftLegRef={leftLegRef}
      rightLegRef={rightLegRef}
    />
  );

  const characterVisual = useGltfCharacter ? (
    <WorkerGlbErrorBoundary fallback={proceduralFallback}>
      <Suspense fallback={proceduralFallback}>
        <DoctorWalkingCharacter walking={walking} />
      </Suspense>
    </WorkerGlbErrorBoundary>
  ) : (
    proceduralFallback
  );

  return (
    <group ref={rootRef} position={worker.position} rotation={[0, initialYaw, 0]}>
      {clickable ? (
        <mesh
          geometry={CLICK_GEO}
          position={[0, 0.95, 0]}
          visible={false}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "auto";
          }}
        >
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}

      {characterVisual}

      {selected ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.55, 24]} />
          <meshBasicMaterial color="#0d9488" transparent opacity={0.75} depthWrite={false} />
        </mesh>
      ) : null}

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
