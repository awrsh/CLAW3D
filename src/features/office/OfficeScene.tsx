"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import {
  CAMERA_OFFSET,
  CAMERA_ZOOM,
  getFloorWorldY,
  type BuildingConfig,
  type LightingMode,
} from "@/features/office/core/roomConfig";
import type { OfficeAgent } from "@/features/office/core/agents";
import { FloorConnectors } from "@/features/office/scene/FloorConnectors";
import { ObjectDragController } from "@/features/office/scene/ObjectDragController";
import { OfficeLevel } from "@/features/office/scene/OfficeLevel";

type OfficeSceneProps = {
  building: BuildingConfig;
  onSelectObject: (objectId: string) => void;
  onMoveObject: (objectId: string, x: number, z: number) => void;
  onDragBegin?: (objectId: string) => void;
  onDragEnd?: (objectId: string) => void;
  onAgentState?: (agentId: string, state: OfficeAgent["state"]) => void;
};

type OrbitLike = {
  target: THREE.Vector3;
  update: () => void;
};

const LIGHTING: Record<
  LightingMode,
  {
    bg: string;
    ambient: { intensity: number; color: string };
    sun: { intensity: number; color: string };
    fill: { intensity: number; color: string };
  }
> = {
  day: {
    bg: "#87a0b8",
    ambient: { intensity: 0.78, color: "#d8d4c8" },
    sun: { intensity: 1.15, color: "#f6f1e6" },
    fill: { intensity: 0.35, color: "#7090ff" },
  },
  evening: {
    bg: "#3a2a38",
    ambient: { intensity: 0.45, color: "#c9a88a" },
    sun: { intensity: 0.7, color: "#ffb074" },
    fill: { intensity: 0.25, color: "#6a5acd" },
  },
  night: {
    bg: "#0c1018",
    ambient: { intensity: 0.22, color: "#6a7a98" },
    sun: { intensity: 0.15, color: "#a0b0d0" },
    fill: { intensity: 0.35, color: "#4050a0" },
  },
};

function FocusActiveFloor({ targetY }: { targetY: number }) {
  const controls = useThree((state) => state.controls) as OrbitLike | null;

  useEffect(() => {
    if (!controls?.target) return;
    controls.target.set(0, targetY, 0);
    controls.update();
  }, [controls, targetY]);

  return null;
}

function SceneBackground({ color }: { color: string }) {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color(color);
  }, [color, scene]);
  return null;
}

export function OfficeScene({
  building,
  onSelectObject,
  onMoveObject,
  onDragBegin,
  onDragEnd,
  onAgentState,
}: OfficeSceneProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const activeY = getFloorWorldY(building, building.activeFloorId);
  const lighting = LIGHTING[building.lightingMode] ?? LIGHTING.day;
  const cameraTarget = useMemo<[number, number, number]>(
    () => [0, activeY, 0],
    [activeY],
  );
  const cameraPosition = useMemo<[number, number, number]>(
    () => [
      CAMERA_OFFSET[0],
      CAMERA_OFFSET[1] + activeY,
      CAMERA_OFFSET[2],
    ],
    [activeY],
  );

  const visibleFloors = useMemo(() => {
    if (building.showAllFloors) return building.floors;
    return building.floors.filter(
      (floor) => floor.id === building.activeFloorId,
    );
  }, [building.activeFloorId, building.floors, building.showAllFloors]);

  const showConnectors =
    building.showAllFloors && building.floors.length > 1;

  return (
    <Canvas
      orthographic
      dpr={[1, 1.25]}
      camera={{
        position: cameraPosition,
        zoom: CAMERA_ZOOM,
        near: 0.1,
        far: 400,
      }}
      shadows={{ type: THREE.PCFShadowMap }}
      gl={{
        antialias: true,
        powerPreference: "default",
        failIfMajorPerformanceCaveat: false,
        alpha: false,
      }}
      style={{
        width: "100%",
        height: "100%",
        background: lighting.bg,
        cursor: draggingId ? "grabbing" : "default",
      }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(...cameraTarget);
        const canvas = gl.domElement;
        canvas.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          console.warn(
            "[OfficeScene] WebGL context lost — close other 3D tabs and reload.",
          );
        });
      }}
      onPointerMissed={() => {
        if (!draggingId) onSelectObject("");
      }}
    >
      <SceneBackground color={lighting.bg} />
      <OrbitControls
        makeDefault
        enabled={!draggingId}
        target={cameraTarget}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
        panSpeed={0.6}
        minZoom={6}
        maxZoom={140}
        maxPolarAngle={Math.PI / 2.05}
      />
      <FocusActiveFloor targetY={activeY} />
      <ObjectDragController
        draggingId={draggingId}
        floorY={activeY}
        onMove={(x, z) => {
          if (!draggingId) return;
          onMoveObject(draggingId, x, z);
        }}
        onEnd={() => {
          if (draggingId) onDragEnd?.(draggingId);
          setDraggingId(null);
        }}
      />

      <ambientLight
        intensity={lighting.ambient.intensity}
        color={lighting.ambient.color}
      />
      <directionalLight
        position={[8, 14 + activeY, 6]}
        intensity={lighting.sun.intensity}
        color={lighting.sun.color}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
      />
      <directionalLight
        position={[-5, 8 + activeY, -4]}
        intensity={lighting.fill.intensity}
        color={lighting.fill.color}
      />

      {visibleFloors.map((floor) => {
        const y = getFloorWorldY(building, floor.id);
        const isActive = floor.id === building.activeFloorId;
        return (
          <OfficeLevel
            key={floor.id}
            config={floor}
            y={y}
            dimmed={building.showAllFloors && !isActive}
            selectedObjectId={isActive ? building.selectedObjectId : null}
            onSelectObject={isActive ? onSelectObject : undefined}
            lampsOn={building.lampsOn}
            onAgentState={isActive ? onAgentState : undefined}
            onDragStart={
              isActive
                ? (objectId) => {
                    onDragBegin?.(objectId);
                    onSelectObject(objectId);
                    setDraggingId(objectId);
                  }
                : undefined
            }
          />
        );
      })}

      {showConnectors ? <FloorConnectors building={building} /> : null}
    </Canvas>
  );
}
