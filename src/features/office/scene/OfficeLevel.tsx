"use client";

import { memo } from "react";
import type { FloorConfig } from "@/features/office/core/roomConfig";
import type { OfficeAgent } from "@/features/office/core/agents";
import { AgentSystem } from "@/features/office/scene/AgentSystem";
import { OfficeFloor } from "@/features/office/scene/OfficeFloor";
import { OfficeObjects } from "@/features/office/scene/OfficeObjects";
import { OfficeWalls } from "@/features/office/scene/OfficeWalls";

type OfficeLevelProps = {
  config: FloorConfig;
  y: number;
  dimmed?: boolean;
  selectedObjectId?: string | null;
  onSelectObject?: (objectId: string) => void;
  onDragStart?: (objectId: string) => void;
  agentsEnabled?: boolean;
  lampsOn?: boolean;
  onAgentState?: (agentId: string, state: OfficeAgent["state"]) => void;
};

export const OfficeLevel = memo(function OfficeLevel({
  config,
  y,
  dimmed = false,
  selectedObjectId = null,
  onSelectObject,
  onDragStart,
  agentsEnabled = true,
  lampsOn = true,
  onAgentState,
}: OfficeLevelProps) {
  return (
    <group position={[0, y, 0]}>
      <OfficeFloor config={config} />
      <OfficeWalls config={config} />
      <OfficeObjects
        objects={config.objects}
        selectedObjectId={selectedObjectId}
        onSelect={onSelectObject}
        onDragStart={onDragStart}
        lampsOn={lampsOn}
      />
      <AgentSystem
        agents={config.agents ?? []}
        objects={config.objects}
        floorHalfW={config.width / 2}
        floorHalfD={config.depth / 2}
        enabled={agentsEnabled && !dimmed}
        onAgentState={onAgentState}
      />
      {dimmed ? (
        <mesh position={[0, config.wallHeight / 2, 0]}>
          <boxGeometry
            args={[
              config.width * 1.02,
              config.wallHeight * 1.05,
              config.depth * 1.02,
            ]}
          />
          <meshBasicMaterial
            color="#1a1008"
            transparent
            opacity={0.28}
            depthWrite={false}
          />
        </mesh>
      ) : null}
    </group>
  );
});
