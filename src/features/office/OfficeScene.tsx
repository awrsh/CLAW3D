"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import {
  CAMERA_OFFSET,
  CAMERA_ZOOM,
  getActiveFloor,
  getFloorWorldY,
  PERFORMANCE_PROFILES,
  type BuildingConfig,
  type LightingMode,
} from "@/features/office/core/roomConfig";
import type { OfficeAgent } from "@/features/office/core/agents";
import type { DialogueTurn } from "@/features/office/core/agentDialogue";
import { FloorConnectors } from "@/features/office/scene/FloorConnectors";
import { CameraWasdControls } from "@/features/office/scene/CameraWasdControls";
import { ObjectDragController } from "@/features/office/scene/ObjectDragController";
import { OfficeLevel } from "@/features/office/scene/OfficeLevel";
import { wallDetailForPerformance } from "@/features/office/scene/FlutedWallPanel";
import type {
  AgentFocusRequest,
  ForcedChatRequest,
} from "@/features/office/scene/AgentSystem";
import {
  WorkspaceDrawController,
  type DrawBounds,
  type WorkspaceDraft,
} from "@/features/office/scene/WorkspaceDrawController";

type OfficeSceneProps = {
  building: BuildingConfig;
  onSelectObject: (objectId: string) => void;
  onMoveObject: (objectId: string, x: number, z: number) => void;
  onDragBegin?: (objectId: string) => void;
  onDragEnd?: (objectId: string) => void;
  onSelectWorkspace?: (workspaceId: string) => void;
  onAddWorkspace?: (draft: WorkspaceDraft) => void;
  onAddWallRoom?: (draft: WorkspaceDraft) => void;
  selectedAgentId?: string | null;
  focusRequest?: AgentFocusRequest | null;
  forcedChatRequest?: ForcedChatRequest | null;
  onAgentSelect?: (agent: OfficeAgent) => void;
  onAgentState?: (agentId: string, state: OfficeAgent["state"]) => void;
  onPeerChat?: (
    a: OfficeAgent,
    b: OfficeAgent,
    turns: DialogueTurn[],
  ) => void;
  onWorkSessionDone?: (leadId: string) => void;
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
    bg: "#a8b4c0",
    ambient: { intensity: 0.82, color: "#e8ecef" },
    sun: { intensity: 1.05, color: "#fff6ea" },
    fill: { intensity: 0.42, color: "#8aa0c8" },
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

/** Keep orbit pivot on the active floor height when switching levels. */
function FocusActiveFloor({ targetY }: { targetY: number }) {
  const controls = useThree((state) => state.controls) as OrbitLike | null;
  const { camera } = useThree();

  useEffect(() => {
    if (!controls?.target) return;
    const prevY = controls.target.y;
    const delta = targetY - prevY;
    controls.target.set(0, targetY, 0);
    camera.position.y += delta;
    controls.update();
  }, [camera, controls, targetY]);

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
  onSelectWorkspace,
  onAddWorkspace,
  onAddWallRoom,
  selectedAgentId = null,
  focusRequest = null,
  forcedChatRequest = null,
  onAgentSelect,
  onAgentState,
  onPeerChat,
  onWorkSessionDone,
}: OfficeSceneProps) {
  const [grabId, setGrabId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const drawMode =
    building.drawMode === "workspace" || building.drawMode === "wall";
  const editMode = building.editMode;
  const canEditScene = editMode && !drawMode;
  const isWorkspaceDraw = building.drawMode === "workspace";
  const isWallDraw = building.drawMode === "wall";

  useEffect(() => {
    if (editMode && !drawMode) return;
    setGrabId(null);
    setDragging(false);
  }, [drawMode, editMode]);
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

  const drawClipBounds = useMemo((): DrawBounds => {
    const floor = getActiveFloor(building);
    const floorBounds: DrawBounds = {
      minX: -floor.width / 2,
      maxX: floor.width / 2,
      minZ: -floor.depth / 2,
      maxZ: floor.depth / 2,
    };
    const selected = (floor.workspaces ?? []).find(
      (unit) => unit.id === building.selectedWorkspaceId,
    );
    if (!selected) return floorBounds;
    // Slight inset so new rooms sit inside the selected unit walls.
    const inset = selected.withWalls ? 0.12 : 0.02;
    return {
      minX: Math.max(floorBounds.minX, selected.x - selected.width / 2 + inset),
      maxX: Math.min(floorBounds.maxX, selected.x + selected.width / 2 - inset),
      minZ: Math.max(floorBounds.minZ, selected.z - selected.depth / 2 + inset),
      maxZ: Math.min(floorBounds.maxZ, selected.z + selected.depth / 2 - inset),
    };
  }, [building]);

  const visibleFloors = useMemo(() => {
    if (building.showAllFloors) return building.floors;
    return building.floors.filter(
      (floor) => floor.id === building.activeFloorId,
    );
  }, [building.activeFloorId, building.floors, building.showAllFloors]);

  const showConnectors =
    building.showAllFloors && building.floors.length > 1;

  const perf =
    PERFORMANCE_PROFILES[building.performanceMode] ??
    PERFORMANCE_PROFILES.balanced;
  const wallDetail = wallDetailForPerformance(building.performanceMode);

  return (
    <Canvas
      key={building.performanceMode}
      orthographic
      dpr={perf.dpr}
      camera={{
        position: cameraPosition,
        zoom: CAMERA_ZOOM,
        near: 0.1,
        far: 400,
      }}
      shadows={perf.shadows ? { type: THREE.PCFShadowMap } : false}
      gl={{
        antialias: perf.antialias,
        powerPreference: "default",
        failIfMajorPerformanceCaveat: false,
        alpha: false,
      }}
      style={{
        width: "100%",
        height: "100%",
        background: lighting.bg,
        cursor: dragging
          ? "grabbing"
          : drawMode
            ? "crosshair"
            : editMode
              ? "default"
              : "default",
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
        if (drawMode || grabId) return;
        onSelectObject("");
        onSelectWorkspace?.("");
      }}
    >
      <SceneBackground color={lighting.bg} />
      <OrbitControls
        makeDefault
        enabled={!grabId && !drawMode}
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
      <CameraWasdControls enabled={!grabId} />
      <ObjectDragController
        grabId={canEditScene ? grabId : null}
        dragging={dragging}
        floorY={activeY}
        thresholdPx={10}
        onPromote={() => {
          if (!grabId) return;
          setDragging(true);
          onDragBegin?.(grabId);
        }}
        onMove={(x, z) => {
          if (!grabId) return;
          onMoveObject(grabId, x, z);
        }}
        onEnd={(moved) => {
          if (moved && grabId) onDragEnd?.(grabId);
          setGrabId(null);
          setDragging(false);
        }}
      />
      <WorkspaceDrawController
        enabled={drawMode && editMode}
        floorY={activeY}
        shape={isWorkspaceDraw ? building.workspaceShape : "rectangle"}
        snapToGrid={building.snapToGrid}
        clipBounds={drawClipBounds}
        onCommit={(draft) => {
          if (isWallDraw) onAddWallRoom?.(draft);
          else onAddWorkspace?.(draft);
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
        castShadow={perf.shadows}
        shadow-mapSize={[perf.shadowMapSize, perf.shadowMapSize]}
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
            onSelectObject={
              isActive && canEditScene ? onSelectObject : undefined
            }
            selectedWorkspaceId={
              isActive ? building.selectedWorkspaceId : null
            }
            onSelectWorkspace={
              isActive && canEditScene ? onSelectWorkspace : undefined
            }
            workspaceInteractive={canEditScene}
            lampsOn={building.lampsOn}
            selectedAgentId={isActive ? selectedAgentId : null}
            focusRequest={isActive ? focusRequest : null}
            forcedChatRequest={isActive ? forcedChatRequest : null}
            onAgentSelect={isActive && !drawMode ? onAgentSelect : undefined}
            onAgentState={isActive ? onAgentState : undefined}
            onPeerChat={isActive ? onPeerChat : undefined}
            onWorkSessionDone={isActive ? onWorkSessionDone : undefined}
            onDragStart={
              isActive && canEditScene
                ? (objectId) => {
                    onSelectObject(objectId);
                    setDragging(false);
                    setGrabId(objectId);
                  }
                : undefined
            }
            wallDetail={wallDetail}
          />
        );
      })}

      {showConnectors ? <FloorConnectors building={building} /> : null}
    </Canvas>
  );
}
