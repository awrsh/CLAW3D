"use client";

import { memo } from "react";
import type { FloorConfig } from "@/features/office/core/roomConfig";
import type { OfficeAgent } from "@/features/office/core/agents";
import type { DialogueTurn } from "@/features/office/core/agentDialogue";
import {
  AgentSystem,
  type AgentFocusRequest,
  type ForcedChatRequest,
} from "@/features/office/scene/AgentSystem";
import { OfficeFloor } from "@/features/office/scene/OfficeFloor";
import { OfficeObjects } from "@/features/office/scene/OfficeObjects";
import { OfficeWalls } from "@/features/office/scene/OfficeWalls";
import type { WallDetail } from "@/features/office/scene/FlutedWallPanel";

type OfficeLevelProps = {
  config: FloorConfig;
  y: number;
  dimmed?: boolean;
  selectedObjectId?: string | null;
  onSelectObject?: (objectId: string) => void;
  onDragStart?: (objectId: string) => void;
  selectedWorkspaceId?: string | null;
  onSelectWorkspace?: (workspaceId: string) => void;
  workspaceInteractive?: boolean;
  agentsEnabled?: boolean;
  lampsOn?: boolean;
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
  wallDetail?: WallDetail;
};

export const OfficeLevel = memo(function OfficeLevel({
  config,
  y,
  dimmed = false,
  selectedObjectId = null,
  onSelectObject,
  onDragStart,
  selectedWorkspaceId = null,
  onSelectWorkspace,
  workspaceInteractive = true,
  agentsEnabled = true,
  lampsOn = true,
  selectedAgentId = null,
  focusRequest = null,
  forcedChatRequest = null,
  onAgentSelect,
  onAgentState,
  onPeerChat,
  onWorkSessionDone,
  wallDetail = "simple",
}: OfficeLevelProps) {
  return (
    <group position={[0, y, 0]}>
      <OfficeFloor
        config={config}
        selectedWorkspaceId={selectedWorkspaceId}
        onSelectWorkspace={onSelectWorkspace}
        interactive={workspaceInteractive && !dimmed}
        wallDetail={wallDetail}
      />
      <OfficeWalls config={config} wallDetail={wallDetail} />
      <OfficeObjects
        objects={config.objects}
        selectedObjectId={selectedObjectId}
        onSelect={onSelectObject}
        onDragStart={onDragStart}
        lampsOn={lampsOn}
        wallDetail={wallDetail}
      />
      <AgentSystem
        agents={config.agents ?? []}
        objects={config.objects}
        workspaces={config.workspaces ?? []}
        floorHalfW={config.width / 2}
        floorHalfD={config.depth / 2}
        worldY={y}
        enabled={agentsEnabled && !dimmed}
        selectedAgentId={selectedAgentId}
        focusRequest={!dimmed ? focusRequest : null}
        forcedChatRequest={!dimmed ? forcedChatRequest : null}
        onAgentSelect={onAgentSelect}
        onAgentState={onAgentState}
        onPeerChat={onPeerChat}
        onWorkSessionDone={onWorkSessionDone}
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
