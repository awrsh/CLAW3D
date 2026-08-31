"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, type RefObject } from "react";
import * as THREE from "three";
import {
  BioprocessingZone,
  ResearchZone,
  StorageZone,
} from "@/components/laboratory/BioprocessingZone";
import {
  BioprocessingMonitors,
  ZoneMonitors,
} from "@/components/laboratory/BioprocessingMonitors";
import {
  CameraControls,
  type CameraControlsHandle,
} from "@/components/laboratory/CameraControls";
import { HeroWall } from "@/components/laboratory/HeroWall";
import { LabInspector } from "@/components/laboratory/LabInspector";
import { LaboratoryAirlock } from "@/components/laboratory/LaboratoryAirlock";
import { LaboratoryEnvironment } from "@/components/laboratory/LaboratoryEnvironment";
import { LaboratoryLighting } from "@/components/laboratory/LaboratoryLighting";
import { LaboratoryWorkstation } from "@/components/laboratory/LaboratoryWorkstation";
import { DEFAULT_CAMERA } from "@/components/laboratory/sceneConfig";
import type { LabPerformanceProfile } from "@/components/laboratory/types";

function SceneContent({
  perf,
  autoRotate,
  controlsRef,
  inspectorEnabled,
}: {
  perf: LabPerformanceProfile;
  autoRotate: boolean;
  controlsRef: RefObject<CameraControlsHandle | null>;
  inspectorEnabled: boolean;
}) {
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={DEFAULT_CAMERA.position}
        fov={DEFAULT_CAMERA.fov}
        near={0.1}
        far={120}
      />
      <LaboratoryLighting
        shadows={perf.shadows}
        enableHeroGlow={perf.enableHeroGlow}
      />
      <LaboratoryEnvironment pipeDetail={perf.pipeDetail} />
      <LaboratoryAirlock />
      <HeroWall enableGlow={perf.enableHeroGlow} />
      <BioprocessingZone pipeDetail={perf.pipeDetail} />
      <BioprocessingMonitors />
      <LaboratoryWorkstation />
      <ResearchZone />
      <ZoneMonitors />
      <StorageZone />
      {inspectorEnabled ? <LabInspector /> : null}
      <CameraControls ref={controlsRef} autoRotate={autoRotate} />
    </>
  );
}

type LaboratorySceneProps = {
  perf: LabPerformanceProfile;
  autoRotate: boolean;
  onReady?: () => void;
  controlsRef: RefObject<CameraControlsHandle | null>;
  inspectorEnabled?: boolean;
};

export function LaboratoryScene({
  perf,
  autoRotate,
  onReady,
  controlsRef,
  inspectorEnabled = true,
}: LaboratorySceneProps) {
  return (
    <Canvas
      shadows={perf.shadows ? { type: THREE.PCFSoftShadowMap } : false}
      dpr={perf.dpr}
      gl={{
        antialias: perf.antialias,
        powerPreference: "high-performance",
        alpha: false,
      }}
      style={{ width: "100%", height: "100%", touchAction: "none" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        onReady?.();
      }}
    >
      <Suspense fallback={null}>
        <SceneContent
          perf={perf}
          autoRotate={autoRotate}
          controlsRef={controlsRef}
          inspectorEnabled={inspectorEnabled}
        />
      </Suspense>
    </Canvas>
  );
}
