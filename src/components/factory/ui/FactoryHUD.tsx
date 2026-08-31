"use client";

import Link from "next/link";
import { useFactory, STAGE_LABELS } from "@/components/factory/context/FactoryContext";
import {
  FACTORY_AREA_MAP,
  GUIDED_TOUR_ORDER,
  getEquipment,
} from "@/components/factory/simulation/factoryLayout";
import { getFactoryAsset } from "@/components/factory/assets/factoryAssets";
import {
  machineStatusLabel,
  resolveMachineStatus,
} from "@/components/factory/simulation/EquipmentState";
import type { FactoryAreaId } from "@/components/factory/simulation/ProductionState";

const MAP_CELLS: { id: FactoryAreaId; label: string }[][] = [
  [
    { id: "manager-office", label: "Mgr" },
    { id: "rnd", label: "R&D" },
    { id: "entrance", label: "Entry" },
    { id: "qa-office", label: "QA" },
  ],
  [
    { id: "raw-materials", label: "Storage" },
    { id: "weighing", label: "Weigh" },
    { id: "preparation", label: "Prep" },
    { id: "formulation", label: "Form" },
  ],
  [
    { id: "bioreactor", label: "Bio" },
    { id: "downstream", label: "Down" },
    { id: "purification", label: "Purify" },
    { id: "utilities", label: "Util" },
  ],
  [
    { id: "filling", label: "Fill" },
    { id: "quality-control", label: "QC" },
    { id: "packaging", label: "Pack" },
    { id: "finished-goods", label: "Done" },
  ],
];

export function FactoryMap() {
  const { state, selectArea } = useFactory();

  return (
    <div className="pointer-events-auto w-[min(100%,220px)] rounded-lg border border-white/60 bg-white/75 p-2 shadow-sm backdrop-blur-sm">
      <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        Facility Map
      </div>
      <div
        className="grid grid-cols-4 gap-0.5"
      >
        {MAP_CELLS.flat().map((cell, i) => {
          const isActive =
            state.selectedAreaId === cell.id ||
            state.activeAreaId === cell.id;
          const isTour =
            state.guidedTourActive &&
            GUIDED_TOUR_ORDER[state.guidedTourIndex] === cell.id;
          if (!cell.label) {
            return (
              <div
                key={i}
                className="col-span-1 rounded-sm bg-slate-100/50"
              />
            );
          }
          return (
            <button
              key={`${cell.id}-${i}`}
              type="button"
              onClick={() => selectArea(cell.id)}
              className={`rounded-sm px-1 py-1.5 text-[8px] font-medium transition-colors ${
                isActive || isTour
                  ? "bg-teal-600/90 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cell.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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

export function ProductionPanel() {
  const { state, startProduction, stopProduction } = useFactory();

  return (
    <div className="pointer-events-auto w-[min(100%,280px)] rounded-lg border border-white/60 bg-white/80 p-3 shadow-sm backdrop-blur-sm">
      <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        Production Simulation
      </div>
      <div className="mt-2 text-xs text-slate-700">
        Stage:{" "}
        <span className="font-medium text-teal-700">
          {STAGE_LABELS[state.productionStage]}
        </span>
      </div>
      <div className="mt-2">
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>Progress</span>
          <span>{state.overallProgress}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-teal-600 transition-all duration-500"
            style={{ width: `${state.overallProgress}%` }}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={state.isSimulating ? stopProduction : startProduction}
        className="mt-3 w-full rounded-md border border-teal-700/30 bg-teal-700 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white transition hover:bg-teal-800"
      >
        {state.isSimulating ? "Stop Production" : "Start Production"}
      </button>
    </div>
  );
}

export function ControlRoomDashboard() {
  const { state } = useFactory();
  const show = state.selectedAreaId === "control-room" || state.isSimulating;

  if (!show) return null;

  return (
    <div className="pointer-events-auto w-[min(100%,300px)] rounded-lg border border-slate-200/80 bg-slate-900/90 p-3 font-mono text-[10px] text-emerald-400 shadow-lg backdrop-blur-sm">
      <div className="border-b border-emerald-900/50 pb-2 text-[9px] uppercase tracking-widest text-emerald-600">
        Production Status
      </div>
      <div className="mt-2 space-y-1">
        <Row label="Bioreactor 01" value={state.isSimulating ? "RUNNING" : "STANDBY"} />
        <Row label="Bioreactor 02" value={state.isSimulating ? "RUNNING" : "STANDBY"} />
        <Row label="Purification" value={state.isSimulating ? "ACTIVE" : "IDLE"} />
        <Row label="Filling Line" value={state.isSimulating ? "ACTIVE" : "IDLE"} />
        <Row label="QC" value="NORMAL" />
      </div>
      <div className="mt-3 border-t border-emerald-900/50 pt-2">
        <div className="text-emerald-600">Production Progress</div>
        <div className="mt-1 flex gap-0.5">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-sm ${
                i < Math.round((state.overallProgress / 100) * 15)
                  ? "bg-emerald-500"
                  : "bg-emerald-950"
              }`}
            />
          ))}
        </div>
        <div className="mt-1 text-right text-emerald-300">{state.overallProgress}%</div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-emerald-700">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function AreaInfoPanel() {
  const { state, selectArea } = useFactory();
  const areaId = state.selectedAreaId;
  if (!areaId) return null;

  const area = FACTORY_AREA_MAP[areaId];
  const tourIndex = state.guidedTourActive ? state.guidedTourIndex : -1;
  const tourArea = tourIndex >= 0 ? GUIDED_TOUR_ORDER[tourIndex] : null;

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
        {state.guidedTourActive ? "Guided Tour" : "Department"}
      </div>
      <h2 className="mt-1 text-base font-medium text-slate-800">{area.name}</h2>
      <p className="mt-1.5 text-xs font-medium text-teal-800/90">{area.purpose}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">
        {area.description}
      </p>

      {area.workers.length > 0 ? (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Personnel on duty
          </div>
          <ul className="mt-2 space-y-2">
            {area.workers.map((w) => (
              <li key={w.id} className="text-xs">
                <span className="font-semibold text-slate-800">{w.role}</span>
                <p className="mt-0.5 text-[11px] text-slate-500">{w.activity}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {state.guidedTourActive && tourArea === areaId ? (
        <p className="mt-2 text-[10px] text-slate-500">
          Stop {tourIndex + 1} of {GUIDED_TOUR_ORDER.length}
        </p>
      ) : null}
    </div>
  );
}

export function EquipmentInfoPanel() {
  const { state, selectEquipment } = useFactory();
  const eq = state.selectedEquipmentId
    ? getEquipment(state.selectedEquipmentId)
    : null;
  if (!eq) return null;

  const area = FACTORY_AREA_MAP[eq.areaId];
  const asset = getFactoryAsset(eq.id);
  const machineStatus = resolveMachineStatus(
    eq.areaId,
    state.productionStage,
    state.isSimulating,
  );

  return (
    <div className="pointer-events-auto w-[min(100%,300px)] rounded-lg border border-white/60 bg-white/85 p-4 shadow-sm backdrop-blur-sm">
      <button
        type="button"
        onClick={() => selectEquipment(null)}
        className="float-right text-slate-400 hover:text-slate-600"
        aria-label="Close"
      >
        ×
      </button>
      <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-teal-700">
        Equipment
      </div>
      <h2 className="mt-1 text-base font-medium text-slate-800">{eq.name}</h2>
      <dl className="mt-3 space-y-1.5 text-xs">
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
        <div>
          <dt className="text-slate-500">Status</dt>
          <dd className="font-medium uppercase text-teal-700">
            {machineStatusLabel(machineStatus)}
          </dd>
        </div>
        {eq.readings.map((r) => (
          <div key={r.label} className="flex justify-between border-t border-slate-100 pt-1">
            <dt className="text-slate-500">{r.label}</dt>
            <dd className="font-mono text-slate-800">{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[9px] text-slate-400">
        Simulated illustrative data — not real manufacturing instructions.
      </p>
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
    <div className="pointer-events-auto flex flex-col items-end gap-1.5">
      <p className="max-w-[220px] text-right text-[9px] leading-snug text-slate-500">
        Left drag: rotate · Middle drag / wheel click: pan · Scroll: zoom · Arrows: pan
      </p>
      <div className="flex flex-wrap gap-2">
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
        {tourActive ? "Stop Tour" : "Start Guided Tour"}
      </button>
      </div>
    </div>
  );
}

export function ProductionFlowStrip() {
  const { state } = useFactory();
  if (!state.isSimulating && state.productionStage === "idle") return null;

  const stages = [
    "raw-materials",
    "weighing",
    "preparation",
    "bioreactor",
    "purification",
    "formulation",
    "filling",
    "quality-control",
    "packaging",
    "finished",
  ] as const;

  const currentIdx = stages.indexOf(
    state.productionStage as (typeof stages)[number],
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4">
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/50 bg-white/70 px-3 py-1.5 text-[8px] uppercase tracking-wide backdrop-blur-sm">
        {stages.map((s, i) => (
          <span
            key={s}
            className={`whitespace-nowrap px-1.5 py-0.5 ${
              i === currentIdx
                ? "rounded-full bg-teal-600 text-white"
                : i < currentIdx
                  ? "text-teal-700"
                  : "text-slate-400"
            }`}
          >
            {STAGE_LABELS[s]}
            {i < stages.length - 1 ? (
              <span className="ml-1 text-slate-300">→</span>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}
