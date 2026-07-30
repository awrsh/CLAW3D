"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  isWallType,
  snapOntoNearbySurface,
} from "@/features/office/core/objects";
import {
  DEFAULT_BUILDING,
  normalizeBuilding,
  STORAGE_KEY,
  type BuildingConfig,
} from "@/features/office/core/roomConfig";
import { playBeep, type OfficeToast } from "@/features/office/core/sfx";
import { applyPlacementSnap } from "@/features/office/core/snap";
import { RoomToolsPanel } from "@/features/office/tools/RoomToolsPanel";

const OfficeScene = dynamic(
  () =>
    import("@/features/office/OfficeScene").then((mod) => mod.OfficeScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#1a1008] font-mono text-sm text-[#c8a97e]">
        در حال بارگذاری صحنه…
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
  const [ready, setReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [toasts, setToasts] = useState<OfficeToast[]>([]);

  const buildingRef = useRef(building);
  const undoStackRef = useRef<BuildingConfig[]>([]);
  const dragBaselineRef = useRef<BuildingConfig | null>(null);
  const toolsBaselineRef = useRef<BuildingConfig | null>(null);
  const lastAgentNotifyRef = useRef<Record<string, number>>({});
  buildingRef.current = building;

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
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() !== "z" || event.shiftKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        // Allow Ctrl+Z inside number fields to undo our object edit instead of
        // native text undo when there is studio history.
        if (target.tagName === "INPUT" && undoStackRef.current.length > 0) {
          event.preventDefault();
          const previous = undoStackRef.current.pop();
          if (!previous) return;
          dragBaselineRef.current = null;
          toolsBaselineRef.current = null;
          setBuilding(previous);
          syncCanUndo();
        }
        return;
      }
      if (undoStackRef.current.length === 0) return;
      event.preventDefault();
      const previous = undoStackRef.current.pop();
      if (!previous) return;
      dragBaselineRef.current = null;
      toolsBaselineRef.current = null;
      setBuilding(previous);
      syncCanUndo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#1a1008]">
      <OfficeScene
        key={sceneKey}
        building={building}
        onSelectObject={(objectId) =>
          setBuilding((current) => ({
            ...current,
            selectedObjectId: objectId || null,
          }))
        }
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
          playBeep("sit", buildingRef.current.muteSfx);
          pushToast(
            state === "sitting" ? "کاراکتر نشست" : "کاراکتر پشت میز مشغول شد",
          );
        }}
      />

      {contextLost ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#1a1008]/85 p-6 backdrop-blur-sm">
          <div className="max-w-md rounded-xl border border-[#5d4037] bg-[#24160c] p-5 text-sm text-[#f5f0e8] shadow-2xl">
            <div className="font-semibold text-[#c8a97e]">
              WebGL context از دست رفت
            </div>
            <p className="mt-2 opacity-90">
              معمولاً وقتی تب دیگری با صحنهٔ سه‌بعدی باز است (مثلاً old-version روی
              پورت ۳۰۰۰) یا GPU تحت فشار است این اتفاق می‌افتد. آن تب را ببندید و
              صحنه را دوباره بسازید.
            </p>
            <button
              type="button"
              className="mt-4 rounded-lg bg-[#c8a97e] px-4 py-2 font-medium text-[#1a1008]"
              onClick={() => {
                setContextLost(false);
                setSceneKey((key) => key + 1);
              }}
            >
              بازسازی صحنه
            </button>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-between p-4 text-xs text-[#d8d0c0]/opacity-90">
        <div className="rounded border border-[#5d4037]/60 bg-[#1a1008]/70 px-3 py-2 backdrop-blur-sm">
          <div className="font-semibold tracking-wide text-[#c8a97e]">
            سمپل آفیس — کاراکتر · دیوار · پریست
          </div>
          <div className="mt-1 opacity-80">
            جابه‌جایی ابجکت · Ctrl+Z برگشت
            {canUndo ? " · Undo آماده" : ""}
          </div>
        </div>
        <div className="flex items-start gap-2">
          <button
            type="button"
            disabled={!canUndo}
            onClick={undo}
            className="pointer-events-auto rounded border border-[#5d4037]/60 bg-[#1a1008]/70 px-3 py-2 text-[#d8d0c0] backdrop-blur-sm transition enabled:hover:border-[#c8a97e] enabled:hover:text-[#c8a97e] disabled:opacity-40"
            title="Ctrl+Z"
          >
            Undo
          </button>
          <div className="rounded border border-[#5d4037]/60 bg-[#1a1008]/70 px-3 py-2 backdrop-blur-sm">
            Claw3D Sample
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 right-4 z-20 flex max-w-xs flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-lg border border-[#5d4037]/70 bg-[#1a1008]/92 px-3 py-2 text-xs text-[#f5f0e8] shadow-lg backdrop-blur-sm"
          >
            {toast.message}
          </div>
        ))}
      </div>

      <RoomToolsPanel
        building={building}
        onBeforeObjectEdit={() => {
          toolsBaselineRef.current = cloneBuilding(buildingRef.current);
        }}
        onChange={(next) => {
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
    </main>
  );
}
