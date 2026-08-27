"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  getObjectLabel,
  isWallType,
  snapOntoNearbySurface,
} from "@/features/office/core/objects";
import type { OfficeAgent } from "@/features/office/core/agents";
import {
  createWorkspaceUnit,
  DEFAULT_BUILDING,
  normalizeBuilding,
  STORAGE_KEY,
  type BuildingConfig,
} from "@/features/office/core/roomConfig";
import { wallsFromDraft } from "@/features/office/core/wallDraw";
import { playBeep, type OfficeToast } from "@/features/office/core/sfx";
import { applyPlacementSnap } from "@/features/office/core/snap";
import {
  advanceWorkPipeline,
  agentIdForTodo,
  agentsForPipeline,
  COLLABORATOR_AGENT_ID,
  COLLABORATOR_NAME,
  createSampleFullStackPipeline,
  createPipelineFromGoal,
  dialogueForWorkTodo,
  estimateWorkDialogueMs,
  workAgentDisplayName,
  workAgentGivenName,
  type WorkPipeline,
  type WorkTodo,
} from "@/features/office/core/workTodos";
import { agentGivenName } from "@/features/office/core/agents";
import {
  AgentChatPanel,
  type AgentChatMessage,
} from "@/features/office/ui/AgentChatPanel";
import { WorkTodosPanel } from "@/features/office/ui/WorkTodosPanel";
import { RoomToolsPanel } from "@/features/office/tools/RoomToolsPanel";
import {
  GhostButton,
  SegmentedControl,
  studioPanelClass,
} from "@/features/office/ui/studioControls";
import type {
  AgentFocusRequest,
  ForcedChatRequest,
} from "@/features/office/scene/AgentSystem";

const OfficeScene = dynamic(
  () =>
    import("@/features/office/OfficeScene").then((mod) => mod.OfficeScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#1a1008] font-mono text-[10px] uppercase tracking-[0.22em] text-amber-500/65">
        Loading scene…
      </div>
    ),
  },
);

const MAX_UNDO = 40;

function loadSavedBuilding(): BuildingConfig {
  if (typeof window === "undefined") return DEFAULT_BUILDING;
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem("claw3d-sample-building-v8") ??
      window.localStorage.getItem("claw3d-sample-building-v7") ??
      window.localStorage.getItem("claw3d-sample-building-v6") ??
      window.localStorage.getItem("claw3d-sample-building-v5") ??
      window.localStorage.getItem("claw3d-sample-building-v4") ??
      window.localStorage.getItem("claw3d-sample-building-v3") ??
      window.localStorage.getItem("claw3d-sample-building-v2") ??
      window.localStorage.getItem("claw3d-sample-room-v1");
    if (!raw) return DEFAULT_BUILDING;
    return normalizeBuilding(JSON.parse(raw));
  } catch {
    return DEFAULT_BUILDING;
  }
}

function cloneBuilding(building: BuildingConfig): BuildingConfig {
  return structuredClone(building);
}

function findObjectPose(building: BuildingConfig, objectId: string) {
  for (const floor of building.floors) {
    const object = floor.objects.find((entry) => entry.id === objectId);
    if (object) {
      return {
        x: object.x,
        z: object.z,
        elevation: object.elevation,
        rotationY: object.rotationY,
        scale: object.scale,
        length: object.length,
      };
    }
  }
  return null;
}

function objectPoseChanged(
  before: BuildingConfig,
  after: BuildingConfig,
  objectId: string,
): boolean {
  const a = findObjectPose(before, objectId);
  const b = findObjectPose(after, objectId);
  if (!a || !b) return a !== b;
  return (
    a.x !== b.x ||
    a.z !== b.z ||
    a.elevation !== b.elevation ||
    a.rotationY !== b.rotationY ||
    a.scale !== b.scale ||
    a.length !== b.length
  );
}

export function OfficeStudio() {
  const [building, setBuilding] = useState<BuildingConfig>(DEFAULT_BUILDING);
  const [toolsOpen, setToolsOpen] = useState(true);
  const [ready, setReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [toasts, setToasts] = useState<OfficeToast[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<OfficeAgent | null>(null);
  const [chatByAgent, setChatByAgent] = useState<
    Record<string, AgentChatMessage[]>
  >({});
  const [todosOpen, setTodosOpen] = useState(true);
  const [pipeline, setPipeline] = useState<WorkPipeline>(() =>
    createSampleFullStackPipeline(),
  );
  const [focusRequest, setFocusRequest] = useState<AgentFocusRequest | null>(
    null,
  );
  const [forcedChatRequest, setForcedChatRequest] =
    useState<ForcedChatRequest | null>(null);
  const [focusAgentId, setFocusAgentId] = useState<string | null>(null);

  const buildingRef = useRef(building);
  const pipelineRef = useRef(pipeline);
  const undoStackRef = useRef<BuildingConfig[]>([]);
  const dragBaselineRef = useRef<BuildingConfig | null>(null);
  const toolsBaselineRef = useRef<BuildingConfig | null>(null);
  const lastAgentNotifyRef = useRef<Record<string, number>>({});
  const workCompleteTimerRef = useRef<number | null>(null);
  const workSessionStartTimerRef = useRef<number | null>(null);
  const awaitingWorkDoneRef = useRef(false);
  buildingRef.current = building;
  pipelineRef.current = pipeline;

  const pushToast = (message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((current) => [...current.slice(-4), { id, message, createdAt: Date.now() }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  };

  const syncCanUndo = () => {
    setCanUndo(undoStackRef.current.length > 0);
  };

  const pushUndo = (snapshot: BuildingConfig) => {
    undoStackRef.current = [
      ...undoStackRef.current.slice(-(MAX_UNDO - 1)),
      snapshot,
    ];
    syncCanUndo();
  };

  const clearUndo = () => {
    undoStackRef.current = [];
    dragBaselineRef.current = null;
    toolsBaselineRef.current = null;
    syncCanUndo();
  };

  const undo = () => {
    const previous = undoStackRef.current.pop();
    if (!previous) return;
    dragBaselineRef.current = null;
    toolsBaselineRef.current = null;
    setBuilding(previous);
    syncCanUndo();
    playBeep("undo", buildingRef.current.muteSfx);
    pushToast("برگشت به حالت قبل");
  };
  const undoRef = useRef(undo);
  undoRef.current = undo;

  useEffect(() => {
    setBuilding(loadSavedBuilding());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(building));
  }, [building, ready]);

  useEffect(() => {
    const onLost = (event: Event) => {
      event.preventDefault();
      setContextLost(true);
    };
    window.addEventListener("webglcontextlost", onLost, true);
    return () => window.removeEventListener("webglcontextlost", onLost, true);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isUndo =
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        !event.shiftKey &&
        (event.code === "KeyZ" || event.key.toLowerCase() === "z");
      if (!isUndo) return;

      const target = event.target as HTMLElement | null;
      const inEditable =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      // Prefer studio history over native text undo when we have snapshots.
      if (inEditable && undoStackRef.current.length === 0) return;

      event.preventDefault();
      event.stopPropagation();
      undoRef.current();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  const applyPipelineAgents = (nextPipeline: WorkPipeline) => {
    setBuilding((current) => {
      const floor = current.floors.find(
        (entry) => entry.id === current.activeFloorId,
      );
      if (!floor) return current;
      const agents = agentsForPipeline(
        nextPipeline,
        floor.agents ?? [],
        floor.objects ?? [],
      );
      return {
        ...current,
        floors: current.floors.map((entry) =>
          entry.id !== floor.id ? entry : { ...entry, agents },
        ),
      };
    });
  };

  const focusAgent = (agentId: string) => {
    setFocusAgentId(agentId);
    setFocusRequest((current) => ({
      agentId,
      nonce: (current?.nonce ?? 0) + 1,
    }));
  };

  const beginWorkSession = (todo: WorkTodo) => {
    const leadId = agentIdForTodo(todo);
    const leadName = workAgentGivenName(todo.agentKey);
    const turns = dialogueForWorkTodo(
      todo,
      leadName,
      agentGivenName(COLLABORATOR_NAME),
    );
    focusAgent(leadId);
    awaitingWorkDoneRef.current = true;
    if (workCompleteTimerRef.current != null) {
      window.clearTimeout(workCompleteTimerRef.current);
    }
    if (workSessionStartTimerRef.current != null) {
      window.clearTimeout(workSessionStartTimerRef.current);
    }
    // Let the assignee type at their desk first, then bring the collaborator.
    workSessionStartTimerRef.current = window.setTimeout(() => {
      if (!awaitingWorkDoneRef.current) return;
      if (
        pipelineRef.current.todos.find(
          (entry) =>
            entry.id === todo.id && entry.status === "in_progress",
        ) == null
      ) {
        return;
      }
      setForcedChatRequest((current) => ({
        leadId,
        partnerId: COLLABORATOR_AGENT_ID,
        turns,
        nonce: (current?.nonce ?? 0) + 1,
      }));
    }, 3200);
    // Fallback if speech callback misses: complete after desk work + dialogue.
    workCompleteTimerRef.current = window.setTimeout(() => {
      if (!awaitingWorkDoneRef.current) return;
      awaitingWorkDoneRef.current = false;
      completeActiveWorkTodo();
    }, estimateWorkDialogueMs(turns) + 18000);
  };

  const applyPipelineStep = (
    nextTodos: WorkPipeline["todos"],
    running: boolean,
  ) => {
    const nextPipeline: WorkPipeline = {
      ...pipelineRef.current,
      todos: nextTodos,
      running,
    };
    setPipeline(nextPipeline);
    applyPipelineAgents(nextPipeline);
    return nextPipeline;
  };

  const completeActiveWorkTodo = () => {
    if (workSessionStartTimerRef.current != null) {
      window.clearTimeout(workSessionStartTimerRef.current);
      workSessionStartTimerRef.current = null;
    }
    const active = pipelineRef.current.todos.find(
      (todo) => todo.status === "in_progress",
    );
    if (!active) return;
    const { todos, event } = advanceWorkPipeline(pipelineRef.current.todos);
    const stillRunning =
      pipelineRef.current.running && event.type !== "idle";
    applyPipelineStep(todos, stillRunning);
    if (event.type === "completed") {
      playBeep("place", buildingRef.current.muteSfx);
      pushToast(`تمام شد · ${event.todo.title}`);
      if (stillRunning) {
        // Kick the next pending todo shortly after completion.
        window.setTimeout(() => {
          if (!pipelineRef.current.running) return;
          startNextWorkTodo();
        }, 900);
      } else {
        pushToast("همهٔ تسک‌ها انجام شد");
      }
    }
  };

  const startNextWorkTodo = () => {
    if (pipelineRef.current.todos.some((todo) => todo.status === "in_progress")) {
      return;
    }
    const { todos, event } = advanceWorkPipeline(pipelineRef.current.todos);
    const stillRunning =
      pipelineRef.current.running && event.type !== "idle";
    applyPipelineStep(todos, stillRunning);

    if (event.type === "started") {
      playBeep("sit", buildingRef.current.muteSfx);
      pushToast(`${event.todo.agentLabel}: ${event.todo.title}`);
      beginWorkSession(event.todo);
    } else if (event.type === "idle") {
      setPipeline((current) => ({ ...current, running: false }));
      pushToast("همهٔ تسک‌ها انجام شد");
    }
  };

  const stepWorkPipeline = () => {
    const active = pipelineRef.current.todos.find(
      (todo) => todo.status === "in_progress",
    );
    if (active) {
      awaitingWorkDoneRef.current = false;
      if (workCompleteTimerRef.current != null) {
        window.clearTimeout(workCompleteTimerRef.current);
        workCompleteTimerRef.current = null;
      }
      if (workSessionStartTimerRef.current != null) {
        window.clearTimeout(workSessionStartTimerRef.current);
        workSessionStartTimerRef.current = null;
      }
      completeActiveWorkTodo();
      return;
    }
    startNextWorkTodo();
  };

  const resetWorkPipeline = () => {
    awaitingWorkDoneRef.current = false;
    if (workCompleteTimerRef.current != null) {
      window.clearTimeout(workCompleteTimerRef.current);
      workCompleteTimerRef.current = null;
    }
    if (workSessionStartTimerRef.current != null) {
      window.clearTimeout(workSessionStartTimerRef.current);
      workSessionStartTimerRef.current = null;
    }
    setForcedChatRequest(null);
    const next = createSampleFullStackPipeline();
    setPipeline(next);
    applyPipelineAgents(next);
    pushToast("پایپلاین ریست شد");
  };

  const toggleWorkPipelineRun = () => {
    const current = pipelineRef.current;
    const next = { ...current, running: !current.running };
    if (!next.running) {
      awaitingWorkDoneRef.current = false;
      if (workCompleteTimerRef.current != null) {
        window.clearTimeout(workCompleteTimerRef.current);
        workCompleteTimerRef.current = null;
      }
      if (workSessionStartTimerRef.current != null) {
        window.clearTimeout(workSessionStartTimerRef.current);
        workSessionStartTimerRef.current = null;
      }
    }
    setPipeline(next);
    applyPipelineAgents(next);
  };

  const onTodoCardClick = (todo: WorkTodo) => {
    const agentId = agentIdForTodo(todo);
    focusAgent(agentId);
    const floor = buildingRef.current.floors.find(
      (entry) => entry.id === buildingRef.current.activeFloorId,
    );
    const agent = (floor?.agents ?? []).find((entry) => entry.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      pushToast(`دوربین → ${agent.name}`);
    } else {
      pushToast(`دوربین → ${workAgentDisplayName(todo.agentKey)}`);
    }
  };

  const submitOrchestratorGoal = (goal: string) => {
    awaitingWorkDoneRef.current = false;
    if (workCompleteTimerRef.current != null) {
      window.clearTimeout(workCompleteTimerRef.current);
      workCompleteTimerRef.current = null;
    }
    if (workSessionStartTimerRef.current != null) {
      window.clearTimeout(workSessionStartTimerRef.current);
      workSessionStartTimerRef.current = null;
    }
    setForcedChatRequest(null);

    const next = { ...createPipelineFromGoal(goal), running: true };
    setPipeline(next);
    applyPipelineAgents(next);
    playBeep("place", buildingRef.current.muteSfx);
    pushToast(`هدف جدید · ${next.todos.length} تسک`);
  };

  useEffect(() => {
    if (!pipeline.running) return;
    // Start first/next ready todo; completion is driven by work-session done.
    startNextWorkTodo();
    return () => {
      // Keep session timers; only stop auto-start chain when unmounting run.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipeline.running]);

  // Seed floor agents from the sample pipeline once the saved building is ready.
  useEffect(() => {
    if (!ready) return;
    applyPipelineAgents(pipelineRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const openAgentChat = (agent: OfficeAgent) => {
    setSelectedAgent(agent);
    setChatOpen(true);
    setBuilding((current) => ({ ...current, selectedObjectId: null }));
    playBeep("sit", buildingRef.current.muteSfx);
    setChatByAgent((current) => {
      if (current[agent.id]?.length) return current;
      return {
        ...current,
        [agent.id]: [
          {
            id: `sys-${agent.id}`,
            role: "system",
            text: `گفتگو با ${agent.name} شروع شد. (نمونه محلی — بدون Gateway)`,
            timestampMs: Date.now(),
          },
        ],
      };
    });
  };

  const sendAgentChat = (text: string) => {
    if (!selectedAgent) return;
    const agentId = selectedAgent.id;
    const userMsg: AgentChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      timestampMs: Date.now(),
    };
    setChatByAgent((current) => ({
      ...current,
      [agentId]: [...(current[agentId] ?? []), userMsg],
    }));
  };

  const commitAssistantChat = (text: string) => {
    if (!selectedAgent) return;
    const agentId = selectedAgent.id;
    const reply: AgentChatMessage = {
      id: `a-${Date.now()}`,
      role: "assistant",
      text,
      timestampMs: Date.now(),
    };
    setChatByAgent((current) => ({
      ...current,
      [agentId]: [...(current[agentId] ?? []), reply],
    }));
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#1a1008]">
      <OfficeScene
        key={sceneKey}
        building={building}
        selectedAgentId={
          focusAgentId ?? (chatOpen ? selectedAgent?.id ?? null : null)
        }
        focusRequest={focusRequest}
        forcedChatRequest={forcedChatRequest}
        onAgentSelect={openAgentChat}
        onWorkSessionDone={(leadId) => {
          if (!awaitingWorkDoneRef.current) return;
          if (
            pipelineRef.current.todos.find(
              (todo) =>
                todo.status === "in_progress" &&
                agentIdForTodo(todo) === leadId,
            ) == null
          ) {
            return;
          }
          awaitingWorkDoneRef.current = false;
          if (workCompleteTimerRef.current != null) {
            window.clearTimeout(workCompleteTimerRef.current);
            workCompleteTimerRef.current = null;
          }
          completeActiveWorkTodo();
        }}
        onSelectObject={(objectId) =>
          setBuilding((current) => ({
            ...current,
            selectedObjectId: objectId || null,
            selectedWorkspaceId: objectId ? null : current.selectedWorkspaceId,
          }))
        }
        onSelectWorkspace={(workspaceId) =>
          setBuilding((current) => ({
            ...current,
            selectedWorkspaceId: workspaceId || null,
            selectedObjectId: workspaceId ? null : current.selectedObjectId,
          }))
        }
        onAddWorkspace={(draft) => {
          const baseline = cloneBuilding(buildingRef.current);
          pushUndo(baseline);
          setBuilding((current) => {
            const floor = current.floors.find(
              (entry) => entry.id === current.activeFloorId,
            );
            if (!floor) return current;
            const parentId = current.selectedWorkspaceId;
            const unit = createWorkspaceUnit(floor.workspaces?.length ?? 0, {
              ...draft,
              withWalls: current.workspaceWithWalls,
            });
            return {
              ...current,
              // Keep parent selected so the next room stays in the same frame.
              selectedWorkspaceId: parentId ?? unit.id,
              selectedObjectId: null,
              floors: current.floors.map((entry) =>
                entry.id !== current.activeFloorId
                  ? entry
                  : {
                      ...entry,
                      workspaces: [...(entry.workspaces ?? []), unit],
                    },
              ),
            };
          });
          playBeep("place", buildingRef.current.muteSfx);
          pushToast("واحد کاری اضافه شد");
        }}
        onAddWallRoom={(draft) => {
          const baseline = cloneBuilding(buildingRef.current);
          pushUndo(baseline);
          setBuilding((current) => {
            const floor = current.floors.find(
              (entry) => entry.id === current.activeFloorId,
            );
            if (!floor) return current;
            const walls = wallsFromDraft(
              draft,
              current.drawWallType,
              floor.objects.length,
            );
            return {
              ...current,
              selectedObjectId: walls[0]?.id ?? null,
              floors: current.floors.map((entry) =>
                entry.id !== current.activeFloorId
                  ? entry
                  : {
                      ...entry,
                      objects: [...entry.objects, ...walls],
                    },
              ),
            };
          });
          playBeep("place", buildingRef.current.muteSfx);
          pushToast(
            `اتاق با ${getObjectLabel(buildingRef.current.drawWallType)} رسم شد`,
          );
        }}
        onDragBegin={() => {
          toolsBaselineRef.current = null;
          dragBaselineRef.current = cloneBuilding(buildingRef.current);
        }}
        onMoveObject={(objectId, x, z) =>
          setBuilding((current) => {
            const floor = current.floors.find(
              (entry) => entry.id === current.activeFloorId,
            );
            const walls = (floor?.objects ?? [])
              .filter((object) => isWallType(object.type))
              .map((object) => ({
                x: object.x,
                z: object.z,
                length: object.length,
                rotationY: object.rotationY,
              }));
            const snapped = applyPlacementSnap(x, z, {
              snapToGrid: current.snapToGrid,
              snapToWall: current.snapToWall,
              walls,
            });
            return {
              ...current,
              selectedObjectId: objectId,
              floors: current.floors.map((entry) =>
                entry.id !== current.activeFloorId
                  ? entry
                  : {
                      ...entry,
                      objects: entry.objects.map((object) =>
                        object.id === objectId
                          ? {
                              ...object,
                              x: snapped.x,
                              z: snapped.z,
                              rotationY:
                                snapped.rotationY !== undefined &&
                                isWallType(object.type)
                                  ? snapped.rotationY
                                  : object.rotationY,
                            }
                          : object,
                      ),
                    },
              ),
            };
          })
        }
        onDragEnd={(objectId) => {
          const baseline = dragBaselineRef.current;
          dragBaselineRef.current = null;
          const current = buildingRef.current;
          const floor = current.floors.find(
            (entry) => entry.id === current.activeFloorId,
          );
          if (!floor) {
            if (baseline && objectPoseChanged(baseline, current, objectId)) {
              pushUndo(baseline);
            }
            return;
          }
          const moving = floor.objects.find((object) => object.id === objectId);
          if (!moving) {
            if (baseline && objectPoseChanged(baseline, current, objectId)) {
              pushUndo(baseline);
            }
            return;
          }
          const snapped = snapOntoNearbySurface(moving, floor.objects);
          const next =
            snapped.elevation === moving.elevation
              ? current
              : {
                  ...current,
                  floors: current.floors.map((entry) =>
                    entry.id !== floor.id
                      ? entry
                      : {
                          ...entry,
                          objects: entry.objects.map((object) =>
                            object.id === objectId ? snapped : object,
                          ),
                        },
                  ),
                };
          if (baseline && objectPoseChanged(baseline, next, objectId)) {
            pushUndo(baseline);
            playBeep("place", current.muteSfx);
            pushToast("ابجکت جابه‌جا شد");
          }
          if (next !== current) setBuilding(next);
        }}
        onAgentState={(agentId, state) => {
          if (state !== "sitting" && state !== "working") return;
          const now = Date.now();
          const last = lastAgentNotifyRef.current[agentId] ?? 0;
          if (now - last < 4000) return;
          lastAgentNotifyRef.current[agentId] = now;

          const floor = buildingRef.current.floors.find(
            (entry) => entry.id === buildingRef.current.activeFloorId,
          );
          const agent = (floor?.agents ?? []).find(
            (entry) => entry.id === agentId,
          );
          const name = agent?.name ?? "کاراکتر";

          playBeep("sit", buildingRef.current.muteSfx);
          pushToast(
            state === "sitting"
              ? `${name} نشست`
              : `${name} پشت میز مشغول شد`,
          );
        }}
        onPeerChat={(a, b, turns) => {
          const now = Date.now();
          const key = [a.id, b.id].sort().join(":");
          const last = lastAgentNotifyRef.current[`chat:${key}`] ?? 0;
          if (now - last < 5000) return;
          lastAgentNotifyRef.current[`chat:${key}`] = now;
          playBeep("sit", buildingRef.current.muteSfx);
          pushToast(`${a.name} ↔ ${b.name} گفتگوی تخصصی`);

          const stamp = Date.now();
          setChatByAgent((current) => {
            const toMessages = (
              agentId: string,
              peerName: string,
              mySide: "a" | "b",
            ): AgentChatMessage[] => {
              const prev = current[agentId] ?? [];
              const header: AgentChatMessage = {
                id: `peer-${stamp}-${agentId}-sys`,
                role: "system",
                text: `گفتگوی تخصصی با ${peerName}`,
                timestampMs: stamp,
              };
              const body = turns.map((turn, index) => {
                const mine = turn.speaker === mySide;
                return {
                  id: `peer-${stamp}-${agentId}-${index}`,
                  role: (mine ? "assistant" : "user") as "assistant" | "user",
                  text: turn.text,
                  timestampMs: stamp + 1 + index,
                };
              });
              return [...prev, header, ...body];
            };
            return {
              ...current,
              [a.id]: toMessages(a.id, b.name, "a"),
              [b.id]: toMessages(b.id, a.name, "b"),
            };
          });
        }}
      />

      {contextLost ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#120e08]/90 p-6 backdrop-blur-sm">
          <div className="max-w-md rounded-lg border border-amber-800/30 bg-[#120e08]/95 p-5 font-mono text-sm text-amber-100 shadow-xl">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300/85">
              WebGL context lost
            </div>
            <p className="mt-2 text-xs leading-5 text-amber-200/80">
              معمولاً وقتی تب دیگری با صحنهٔ سه‌بعدی باز است (مثلاً old-version روی
              پورت ۳۰۰۰) یا GPU تحت فشار است این اتفاق می‌افتد. آن تب را ببندید و
              صحنه را دوباره بسازید.
            </p>
            <button
              type="button"
              className="mt-4 rounded-md border border-amber-500/50 bg-amber-500/90 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#1a1008]"
              onClick={() => {
                setContextLost(false);
                setSceneKey((key) => key + 1);
              }}
            >
              Rebuild scene
            </button>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-between gap-3 p-4">
        <div
          className={`${studioPanelClass} px-3.5 py-2.5`}
        >
          <div className="text-[12px] font-semibold tracking-wide text-amber-100">
            Claw3D Office
          </div>
          <div className="mt-0.5 text-[10px] text-amber-500/55">
            {building.editMode
              ? "حالت ویرایش · درگ بعد از حرکت موس"
              : "فقط مشاهده · برای جابه‌جایی «ویرایش» را بزن"}
            {canUndo ? " · Undo ready" : ""}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div
            className={`${studioPanelClass} pointer-events-auto flex items-center gap-1 p-1`}
          >
            <GhostButton
              active={building.editMode}
              onClick={() => {
                setBuilding((current) => {
                  const enabling = !current.editMode;
                  if (enabling) setToolsOpen(true);
                  return {
                    ...current,
                    editMode: enabling,
                    drawMode: enabling ? current.drawMode : "none",
                  };
                });
              }}
              title={
                building.editMode
                  ? "خروج از ویرایش — صحنه فقط مشاهده"
                  : "ورود به ویرایش — جابه‌جایی و تغییر فیچرها"
              }
            >
              ویرایش
            </GhostButton>
            <GhostButton
              active={toolsOpen}
              onClick={() => {
                setToolsOpen((open) => {
                  const next = !open;
                  if (next) {
                    setBuilding((current) => ({
                      ...current,
                      editMode: true,
                    }));
                  }
                  return next;
                });
              }}
              title={toolsOpen ? "بستن Tools" : "باز کردن Tools"}
            >
              Tools
            </GhostButton>
            <GhostButton
              active={todosOpen}
              onClick={() => setTodosOpen((open) => !open)}
              title={todosOpen ? "بستن Todos" : "باز کردن Todos"}
              className={
                todosOpen
                  ? "border-sky-500/45 bg-sky-500/25 text-sky-100"
                  : undefined
              }
            >
              Todos
            </GhostButton>
            <GhostButton
              active={building.drawMode === "workspace"}
              onClick={() => {
                const enabling = building.drawMode !== "workspace";
                if (enabling) setToolsOpen(false);
                setBuilding((current) => ({
                  ...current,
                  editMode: enabling ? true : current.editMode,
                  drawMode: enabling ? "workspace" : "none",
                }));
              }}
              title="رسم محیط کاری روی زمین"
            >
              محیط کاری
            </GhostButton>
            <GhostButton
              disabled={!canUndo}
              onClick={undo}
              title="Ctrl+Z"
            >
              Undo
            </GhostButton>
            <span className="mx-1 h-4 w-px bg-amber-900/30" />
            <span className="px-2 text-[9px] font-semibold tracking-wider text-amber-500/50">
              Sample
            </span>
          </div>

          {building.drawMode === "workspace" ? (
            <div
              className={`${studioPanelClass} pointer-events-auto flex items-center gap-2 px-2.5 py-1.5`}
            >
              <SegmentedControl
                size="sm"
                value={building.workspaceShape}
                onChange={(shape) =>
                  setBuilding((current) => ({
                    ...current,
                    workspaceShape: shape,
                  }))
                }
                options={[
                  { value: "rectangle", label: "مستطیل" },
                  { value: "square", label: "مربع" },
                ]}
                className="min-w-40"
              />
              <label className="flex cursor-pointer items-center gap-1.5 border-r border-amber-900/25 pr-2 text-[10px] text-amber-200/80">
                <input
                  type="checkbox"
                  checked={building.workspaceWithWalls}
                  onChange={(event) =>
                    setBuilding((current) => ({
                      ...current,
                      workspaceWithWalls: event.target.checked,
                    }))
                  }
                  className="h-3.5 w-3.5 accent-amber-500"
                />
                با دیوار
              </label>
            </div>
          ) : null}

          {building.drawMode === "wall" ? (
            <div
              className={`${studioPanelClass} pointer-events-auto flex items-center gap-2 px-2.5 py-1.5`}
            >
              <span className="text-[10px] text-amber-200/80">
                رسم اتاق · {getObjectLabel(building.drawWallType)}
              </span>
              <GhostButton
                onClick={() =>
                  setBuilding((current) => ({
                    ...current,
                    drawMode: "none",
                  }))
                }
              >
                لغو
              </GhostButton>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={`pointer-events-none absolute z-20 flex max-w-xs flex-col gap-1.5 ${
          todosOpen ? "bottom-4 left-4" : "bottom-4 right-4"
        }`}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-full border border-amber-800/25 bg-[#120e08]/90 px-3.5 py-1.5 text-[11px] text-amber-100 shadow-lg backdrop-blur-md"
          >
            {toast.message}
          </div>
        ))}
      </div>

      {chatOpen && selectedAgent ? (
        <div className="pointer-events-none absolute bottom-4 left-4 z-30 flex flex-col items-start gap-2">
          <AgentChatPanel
            agent={selectedAgent}
            messages={chatByAgent[selectedAgent.id] ?? []}
            onSend={sendAgentChat}
            onAssistantMessage={commitAssistantChat}
            onClose={() => {
              setChatOpen(false);
              setSelectedAgent(null);
            }}
          />
        </div>
      ) : null}

      <WorkTodosPanel
        pipeline={pipeline}
        open={todosOpen}
        onClose={() => setTodosOpen(false)}
        onToggleRun={toggleWorkPipelineRun}
        onStep={stepWorkPipeline}
        onReset={resetWorkPipeline}
        onTodoClick={onTodoCardClick}
        onSubmitGoal={submitOrchestratorGoal}
      />

      <RoomToolsPanel
        building={building}
        open={toolsOpen}
        onClose={() => setToolsOpen(false)}
        onBeforeObjectEdit={() => {
          toolsBaselineRef.current = cloneBuilding(buildingRef.current);
        }}
        onChange={(next) => {
          if (
            next.drawMode === "wall" &&
            buildingRef.current.drawMode !== "wall"
          ) {
            setToolsOpen(false);
          }
          const baseline = toolsBaselineRef.current;
          const selectedId = buildingRef.current.selectedObjectId;
          if (
            baseline &&
            selectedId &&
            objectPoseChanged(baseline, next, selectedId)
          ) {
            pushUndo(baseline);
          }
          toolsBaselineRef.current = null;
          const presetChanged =
            buildingRef.current.floors.find(
              (floor) => floor.id === buildingRef.current.activeFloorId,
            )?.objects.length !==
            next.floors.find((floor) => floor.id === next.activeFloorId)
              ?.objects.length;
          setBuilding(next);
          if (presetChanged) {
            playBeep("preset", next.muteSfx);
            pushToast("چیدمان طبقه به‌روز شد");
          }
        }}
        onReset={() => {
          clearUndo();
          setBuilding(DEFAULT_BUILDING);
          playBeep("preset", false);
          pushToast("بازنشانی به پیش‌فرض");
        }}
      />

      {!toolsOpen ? (
        <button
          type="button"
          onClick={() => setToolsOpen(true)}
          className="pointer-events-auto absolute bottom-4 left-4 z-20 rounded-md border border-amber-800/30 bg-[#120e08]/95 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300/85 shadow-xl backdrop-blur-sm transition hover:border-amber-500/40 hover:bg-amber-500/20"
        >
          Tools
        </button>
      ) : null}
    </main>
  );
}
