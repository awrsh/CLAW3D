"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, type RefObject } from "react";
import * as THREE from "three";
import { FactoryAreas } from "@/components/factory/areas/FactoryAreas";
import { FactoryDensity } from "@/components/factory/areas/FactoryDensity";
import { AreaMarkers } from "@/components/factory/areas/AreaMarkers";
import { RoomTwinOverlay } from "@/components/factory/areas/RoomTwinOverlay";
import { CorridorPatrolWorkers } from "@/components/factory/areas/CorridorPatrolWorkers";
import { WorkerAnimationLoop } from "@/components/factory/areas/WorkerAnimationSystem";
import {
  FactoryCamera,
  type FactoryCameraHandle,
} from "@/components/factory/FactoryCamera";
import {
  FactoryEnvironment,
  FactoryRoomShells,
} from "@/components/factory/FactoryEnvironment";
import { FactoryPipes } from "@/components/factory/pipes/FactoryPipes";
import { FactoryPipeConnections } from "@/components/factory/pipes/FactoryPipeConnections";
import { FactoryReflections } from "@/components/factory/FactoryReflections";
import { FactoryDetails } from "@/components/factory/FactoryDetails";
import { FactoryLighting } from "@/components/factory/FactoryLighting";
import { FactoryRoomLighting } from "@/components/factory/FactoryRoomLighting";
import { useFactory } from "@/components/factory/context/FactoryContext";
import type { FactoryPerformanceProfile } from "@/components/factory/hooks/useFactoryPerformance";
import { DEFAULT_FACTORY_CAMERA } from "@/components/factory/simulation/factoryLayout";

function CameraBridge({
  controlsRef,
}: {
  controlsRef: RefObject<FactoryCameraHandle | null>;
}) {
  const { registerFlyHandler, setIntroComplete } = useFactory();

  useEffect(() => {
    registerFlyHandler((id, mode = "cinematic") => {
      controlsRef.current?.flyToArea(id, mode);
    });
  }, [registerFlyHandler, controlsRef]);

  useEffect(() => {
    controlsRef.current?.setDefaultView();
    setIntroComplete(true);
  }, [controlsRef, setIntroComplete]);

  return null;
}

function SceneContent({
  perf,
  autoRotate,
  controlsRef,
}: {
  perf: FactoryPerformanceProfile;
  autoRotate: boolean;
  controlsRef: RefObject<FactoryCameraHandle | null>;
}) {
  const { state } = useFactory();
  const inRoom = state.sceneViewMode === "room";

  return (
    <>
      <color attach="background" args={[inRoom ? "#e8edf2" : "#eef2f6"]} />
      <fog attach="fog" args={[inRoom ? "#e8edf2" : "#eef2f6", inRoom ? 14 : 40, inRoom ? 48 : 130]} />
      <PerspectiveCamera
        makeDefault
        position={DEFAULT_FACTORY_CAMERA.position}
        fov={inRoom ? 50 : 42}
        near={0.5}
        far={180}
      />
      <WorkerAnimationLoop />
      <FactoryLighting shadows={perf.shadows} shadowMapSize={perf.shadowMapSize} />
      <FactoryRoomLighting />
      <FactoryReflections />
      <FactoryEnvironment />
      <FactoryRoomShells
        sceneViewMode={state.sceneViewMode}
        roomAreaId={state.roomAreaId}
      />
      <FactoryAreas />
      <FactoryDensity />
      {!inRoom ? <AreaMarkers /> : null}
      <CorridorPatrolWorkers />
      <FactoryPipes />
      <FactoryPipeConnections />
      <FactoryDetails />
      <RoomTwinOverlay />
      <FactoryCamera ref={controlsRef} autoRotate={autoRotate} />
      <CameraBridge controlsRef={controlsRef} />
    </>
  );
}

type FactorySceneProps = {
  perf: FactoryPerformanceProfile;
  autoRotate: boolean;
  onReady?: () => void;
  controlsRef: RefObject<FactoryCameraHandle | null>;
};

export function FactoryScene({
  perf,
  autoRotate,
  onReady,
  controlsRef,
}: FactorySceneProps) {
  return (
    <Canvas
      shadows={perf.shadows ? { type: THREE.BasicShadowMap } : false}
      dpr={perf.dpr}
      gl={{
        antialias: perf.antialias,
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
      }}
      frameloop="always"
      style={{ width: "100%", height: "100%", touchAction: "none" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        onReady?.();
      }}
    >
      <Suspense fallback={null}>
        <SceneContent
          perf={perf}
          autoRotate={autoRotate}
          controlsRef={controlsRef}
        />
      </Suspense>
    </Canvas>
  );
}
