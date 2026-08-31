"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useLaboratory } from "@/components/laboratory/context/LaboratoryContext";
import { getEquipmentMeta } from "@/components/laboratory/sceneConfig";

export function EquipmentInfoPanel() {
  const { selected, hoveredId, selectEquipment } = useLaboratory();
  const hoverMeta = hoveredId ? getEquipmentMeta(hoveredId) : null;
  const show = selected ?? (hoverMeta ? { id: hoveredId!, meta: hoverMeta } : null);

  return (
    <AnimatePresence mode="wait">
      {show ? (
        <motion.aside
          key={show.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-auto w-[min(100vw-2rem,320px)] rounded-xl border border-slate-200/80 bg-white/92 p-4 shadow-xl backdrop-blur-md"
        >
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-700/70">
            {show.meta.zone}
          </div>
          <h3 className="text-[15px] font-semibold text-slate-800">{show.meta.name}</h3>
          <p className="mt-2 text-[12px] leading-6 text-slate-600">{show.meta.description}</p>
          {selected ? (
            <button
              type="button"
              onClick={() => selectEquipment(null)}
              className="mt-3 text-[11px] font-medium text-slate-400 transition hover:text-slate-600"
            >
              Close
            </button>
          ) : (
            <p className="mt-3 text-[10px] text-slate-400">Click to pin details</p>
          )}
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

export function LaboratoryHeader() {
  return (
    <header className="pointer-events-none absolute left-5 top-5 z-20 max-w-md">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pointer-events-auto rounded-xl border border-slate-200/70 bg-white/88 px-4 py-3 shadow-lg backdrop-blur-md"
      >
        <h1 className="text-[13px] font-bold uppercase tracking-[0.22em] text-slate-800">
          Pharmaceutical R&amp;D Lab
        </h1>
        <p className="mt-1 text-[11px] tracking-wide text-slate-500">
          Research · Biotechnology · Innovation
        </p>
        <Link
          href="/factory"
          className="mt-2 mr-3 inline-block text-[10px] font-medium text-teal-700 hover:text-teal-900"
        >
          Manufacturing Facility →
        </Link>
        <Link
          href="/"
          className="mt-2 inline-block text-[10px] font-medium text-slate-400 hover:text-slate-600"
        >
          ← Office Studio
        </Link>
      </motion.div>
    </header>
  );
}

type LabControlsProps = {
  autoRotate: boolean;
  onToggleRotate: () => void;
  onResetView: () => void;
  exploreMode: boolean;
  onToggleExplore: () => void;
};

export function LaboratoryControls({
  autoRotate,
  onToggleRotate,
  onResetView,
  exploreMode,
  onToggleExplore,
}: LabControlsProps) {
  const items = [
    { label: "Explore", active: exploreMode, onClick: onToggleExplore },
    { label: "Rotate", active: autoRotate, onClick: onToggleRotate },
    { label: "Reset View", active: false, onClick: onResetView },
  ] as const;

  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200/70 bg-white/88 p-1.5 shadow-lg backdrop-blur-md">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onClick}
          className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${
            item.active
              ? "bg-slate-800 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {item.label}
        </button>
      ))}
      <span className="hidden px-1 text-[10px] text-slate-400 sm:inline">
        Zoom · Pan · Drag
      </span>
    </div>
  );
}
