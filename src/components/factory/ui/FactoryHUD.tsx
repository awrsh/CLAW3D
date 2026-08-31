"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFactory, STAGE_LABELS } from "@/components/factory/context/FactoryContext";
import {
  FACTORY_AREA_MAP,
  FACTORY_AREAS,
  GUIDED_TOUR_ORDER,
  getEquipment,
} from "@/components/factory/simulation/factoryLayout";
import { getFactoryAsset } from "@/components/factory/assets/factoryAssets";
import {
  machineStatusLabel,
  resolveMachineStatus,
} from "@/components/factory/simulation/EquipmentState";
import { getBioreactorLiveReadings } from "@/components/factory/simulation/bioreactorLiveData";
import type { EquipmentReading } from "@/components/factory/simulation/ProductionState";

export function FactoryHeader() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-5 pt-5">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">
          Interactive Digital Twin
        </p>
        <h1 className="mt-1 text-lg font-light tracking-wide text-slate-800 sm:text-xl">
          Biopharmaceutical Manufacturing Facility
        </h1>
        <p className="mt-1 hidden text-xs text-slate-500 sm:block">
          Research → Development → Manufacturing → Quality → Packaging
        </p>
        <div className="pointer-events-auto mt-2 flex justify-center gap-4 text-[10px]">
          <Link href="/laboratory" className="font-medium text-teal-700 hover:text-teal-900">
            ← R&amp;D Laboratory
          </Link>
          <Link href="/" className="font-medium text-slate-400 hover:text-slate-600">
            Office Studio
          </Link>
        </div>
      </div>
    </div>
  );
}

export function SceneViewToggle() {
  const { state, setSceneViewMode, enterRoomView } = useFactory();
  const inRoom = state.sceneViewMode === "room";

  return (
    <div className="pointer-events-auto flex rounded-lg border border-white/60 bg-white/80 p-0.5 shadow-sm backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setSceneViewMode("facility")}
        className={`rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${
          !inRoom ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        Facility
      </button>
      <button
        type="button"
        onClick={() => enterRoomView(state.selectedAreaId ?? "bioreactor")}
        className={`rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${
          inRoom ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        3D Room
      </button>
    </div>
  );
}

export function RoomModeBanner() {
  const { state, exitRoomView } = useFactory();
  if (state.sceneViewMode !== "room" || !state.roomAreaId) return null;

  const area = FACTORY_AREA_MAP[state.roomAreaId];

  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-teal-500/30 bg-teal-950/85 px-3 py-2 font-mono text-[10px] text-emerald-400 shadow-lg backdrop-blur-sm">
      <span className="text-emerald-600">DIGITAL TWIN</span>
      <span className="text-emerald-300">/</span>
      <span>{area.shortName.toUpperCase()}</span>
      <button
        type="button"
        onClick={exitRoomView}
        className="ml-2 rounded border border-emerald-700/50 px-2 py-0.5 text-[9px] uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-900/50"
      >
        Exit Room
      </button>
    </div>
  );
}

/** Bottom-center simulation controls — Simulate Production + pause/prev/next when active. */
export function SimulationControls() {
  const {
    state,
    startProduction,
    stopProduction,
    pauseProduction,
    resumeProduction,
    nextProductionStage,
    prevProductionStage,
  } = useFactory();

  const simActive = state.isSimulating || state.productionStage === "finished";

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-2">
      {!simActive ? (
        <button
          type="button"
          onClick={startProduction}
          className="rounded-full border border-teal-700/30 bg-teal-700 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white shadow-md transition hover:bg-teal-800"
        >
          Simulate Production
        </button>
      ) : (
        <>
          <div className="rounded-full border border-white/60 bg-white/85 px-4 py-1.5 text-[10px] text-slate-600 shadow-sm backdrop-blur-sm">
            <span className="font-medium text-teal-700">
              {STAGE_LABELS[state.productionStage]}
            </span>
            <span className="mx-2 text-slate-300">·</span>
            <span>{state.overallProgress}%</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevProductionStage}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm transition hover:bg-white"
              aria-label="Previous stage"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={state.productionPaused ? resumeProduction : pauseProduction}
              className="flex h-11 min-w-[88px] items-center justify-center rounded-full border border-teal-700/30 bg-teal-700 px-4 text-[10px] font-semibold uppercase tracking-wider text-white shadow-md transition hover:bg-teal-800"
            >
              {state.productionPaused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={nextProductionStage}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm transition hover:bg-white"
              aria-label="Next stage"
            >
              ›
            </button>
            <button
              type="button"
              onClick={stopProduction}
              className="ml-1 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-[9px] font-medium uppercase tracking-wider text-slate-500 shadow-sm transition hover:bg-white"
            >
              Stop
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function findWorker(workerId: string) {
  for (const area of FACTORY_AREAS) {
    const worker = area.workers.find((w) => w.id === workerId);
    if (worker) return { worker, area };
  }
  return null;
}

export function WorkerInfoPanel() {
  const { state, selectWorker } = useFactory();
  if (!state.selectedWorkerId) return null;

  const match = findWorker(state.selectedWorkerId);
  if (!match) return null;

  const { worker, area } = match;

  return (
    <div className="pointer-events-auto w-[min(100%,300px)] rounded-lg border border-white/60 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
      <button
        type="button"
        onClick={() => selectWorker(null)}
        className="float-right text-slate-400 hover:text-slate-600"
        aria-label="Close"
      >
        ×
      </button>
      <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-teal-700">
        Personnel
      </div>
      <h2 className="mt-1 text-base font-medium text-slate-800">{worker.role}</h2>
      <p className="mt-1 text-[11px] text-slate-500">{area.name}</p>
      <dl className="mt-3 space-y-2 text-xs">
        <div className="rounded-md bg-slate-50 px-3 py-2">
          <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
            Assigned task
          </dt>
          <dd className="mt-1 font-medium text-slate-800">{worker.role}</dd>
        </div>
        <div className="rounded-md bg-teal-50/80 px-3 py-2">
          <dt className="text-[9px] font-semibold uppercase tracking-wider text-teal-600">
            Current activity
          </dt>
          <dd className="mt-1 text-slate-700">{worker.activity}</dd>
        </div>
        {worker.pose ? (
          <div className="flex justify-between border-t border-slate-100 pt-2">
            <dt className="text-slate-500">Pose</dt>
            <dd className="uppercase text-slate-700">{worker.pose}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function useLiveBioreactorReadings(
  equipmentId: string | null,
  isSimulating: boolean,
): EquipmentReading[] | null {
  const [readings, setReadings] = useState<EquipmentReading[] | null>(null);

  useEffect(() => {
    if (!equipmentId?.startsWith("bioreactor")) {
      setReadings(null);
      return;
    }
    const tick = () => {
      setReadings(getBioreactorLiveReadings(equipmentId, isSimulating, Date.now()));
    };
    tick();
    const id = window.setInterval(tick, 750);
    return () => window.clearInterval(id);
  }, [equipmentId, isSimulating]);

  return readings;
}

export function EquipmentInfoPanel() {
  const { state, selectEquipment } = useFactory();
  const eq = state.selectedEquipmentId
    ? getEquipment(state.selectedEquipmentId)
    : null;
  const liveReadings = useLiveBioreactorReadings(
    state.selectedEquipmentId,
    state.isSimulating,
  );

  if (!eq) return null;

  const area = FACTORY_AREA_MAP[eq.areaId];
  const asset = getFactoryAsset(eq.id);
  const machineStatus = resolveMachineStatus(
    eq.areaId,
    state.productionStage,
    state.isSimulating,
  );
  const isBioreactor = eq.id.startsWith("bioreactor");
  const readings = isBioreactor && liveReadings ? liveReadings : eq.readings;

  return (
    <div
      className={`pointer-events-auto w-[min(100%,320px)] rounded-lg border p-4 shadow-lg backdrop-blur-sm ${
        isBioreactor
          ? "border-teal-500/30 bg-slate-900/92 font-mono text-[10px] text-emerald-400"
          : "border-white/60 bg-white/85 text-xs text-slate-800"
      }`}
    >
      <button
        type="button"
        onClick={() => selectEquipment(null)}
        className={`float-right ${isBioreactor ? "text-emerald-600 hover:text-emerald-300" : "text-slate-400 hover:text-slate-600"}`}
        aria-label="Close"
      >
        ×
      </button>
      <div
        className={`text-[9px] font-semibold uppercase tracking-[0.22em] ${
          isBioreactor ? "text-emerald-600" : "text-teal-700"
        }`}
      >
        {isBioreactor ? "Live Bioreactor Telemetry" : "Equipment"}
      </div>
      <h2
        className={`mt-1 text-base font-medium ${isBioreactor ? "text-emerald-200" : "text-slate-800"}`}
      >
        {eq.name}
      </h2>
      {!isBioreactor ? (
        <>
          <dl className="mt-3 space-y-1.5">
            <div>
              <dt className="text-slate-500">Department</dt>
              <dd className="text-slate-700">{area.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Purpose</dt>
              <dd className="text-slate-700">{eq.purpose}</dd>
            </div>
            {asset?.description ? (
              <div>
                <dt className="text-slate-500">Description</dt>
                <dd className="text-slate-600">{asset.description}</dd>
              </div>
            ) : null}
          </dl>
        </>
      ) : (
        <p className="mt-1 text-[9px] text-emerald-700">{area.name}</p>
      )}
      <div className="mt-3 space-y-1">
        <div className={`flex justify-between ${isBioreactor ? "" : "border-t border-slate-100 pt-2"}`}>
          <span className={isBioreactor ? "text-emerald-700" : "text-slate-500"}>Status</span>
          <span className={isBioreactor ? "text-emerald-300" : "font-medium uppercase text-teal-700"}>
            {machineStatusLabel(machineStatus)}
          </span>
        </div>
        {readings.map((r) => (
          <div key={r.label} className="flex justify-between gap-2 border-t border-emerald-900/40 pt-1">
            <span className={isBioreactor ? "text-emerald-700" : "text-slate-500"}>{r.label}</span>
            <span className={isBioreactor ? "text-emerald-300" : "font-mono text-slate-800"}>
              {r.value}
            </span>
          </div>
        ))}
      </div>
      {isBioreactor ? (
        <p className="mt-2 text-[8px] text-emerald-800">
          Live simulated sensor stream — illustrative digital twin data.
        </p>
      ) : (
        <p className="mt-3 text-[9px] text-slate-400">
          Simulated illustrative data — not real manufacturing instructions.
        </p>
      )}
    </div>
  );
}

export function AreaInfoPanel() {
  const { state, selectArea, enterRoomView } = useFactory();
  const areaId = state.selectedAreaId;
  if (!areaId || state.selectedEquipmentId || state.selectedWorkerId) return null;

  const area = FACTORY_AREA_MAP[areaId];
  const tourIndex = state.guidedTourActive ? state.guidedTourIndex : -1;
  const tourArea = tourIndex >= 0 ? GUIDED_TOUR_ORDER[tourIndex] : null;
  const inRoom = state.sceneViewMode === "room" && state.roomAreaId === areaId;

  return (
    <div className="pointer-events-auto relative w-[min(100%,320px)] rounded-lg border border-white/60 bg-white/85 p-4 shadow-sm backdrop-blur-sm">
      <button
        type="button"
        onClick={() => selectArea(null)}
        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
        aria-label="Close"
      >
        ×
      </button>
      <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-teal-700">
        {state.guidedTourActive ? "Guided Tour" : inRoom ? "3D Room View" : "Department"}
      </div>
      <h2 className="mt-1 text-base font-medium text-slate-800">{area.name}</h2>
      <p className="mt-1.5 text-xs font-medium text-teal-800/90">{area.purpose}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{area.description}</p>

      {!inRoom ? (
        <button
          type="button"
          onClick={() => enterRoomView(areaId)}
          className="mt-3 w-full rounded-md border border-teal-700/30 bg-teal-700 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white transition hover:bg-teal-800"
        >
          Enter 3D Room
        </button>
      ) : null}

      {state.guidedTourActive && tourArea === areaId ? (
        <p className="mt-2 text-[10px] text-slate-500">
          Stop {tourIndex + 1} of {GUIDED_TOUR_ORDER.length}
        </p>
      ) : null}
    </div>
  );
}

export function FactoryControls({
  autoRotate,
  onToggleRotate,
  onResetView,
  onStartTour,
  onStopTour,
  tourActive,
}: {
  autoRotate: boolean;
  onToggleRotate: () => void;
  onResetView: () => void;
  onStartTour: () => void;
  onStopTour: () => void;
  tourActive: boolean;
}) {
  return (
    <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
      <button
        type="button"
        onClick={onToggleRotate}
        className="rounded-md border border-slate-200 bg-white/90 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-600 shadow-sm hover:bg-white"
      >
        {autoRotate ? "Stop Rotate" : "Auto Rotate"}
      </button>
      <button
        type="button"
        onClick={onResetView}
        className="rounded-md border border-slate-200 bg-white/90 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-600 shadow-sm hover:bg-white"
      >
        Reset View
      </button>
      <button
        type="button"
        onClick={tourActive ? onStopTour : onStartTour}
        className="rounded-md border border-teal-700/25 bg-teal-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-teal-800 shadow-sm hover:bg-teal-100"
      >
        {tourActive ? "Stop Tour" : "Guided Tour"}
      </button>
    </div>
  );
}
