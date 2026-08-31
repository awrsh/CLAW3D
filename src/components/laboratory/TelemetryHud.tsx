"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useLaboratoryTelemetry } from "@/components/laboratory/context/LaboratoryTelemetryContext";
import { useInspectorUi } from "@/components/laboratory/context/LaboratoryInspectorContext";
import { BIOPROCESSING_IDS, formatReading } from "@/components/laboratory/equipmentTelemetry";

export function TelemetryHud() {
  const { telemetry } = useLaboratoryTelemetry();
  const inspector = useInspectorUi();

  return (
    <div className="pointer-events-none absolute right-5 top-24 z-20 flex w-[min(100vw-2.5rem,300px)] flex-col gap-2">
      <div className="pointer-events-auto rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-lg backdrop-blur-md">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-700/80">
          Process Telemetry
        </div>
        <div className="mt-2 space-y-2">
          {BIOPROCESSING_IDS.map((id) => {
            const unit = telemetry[id];
            const primary = unit.readings[0];
            const secondary = unit.readings[1];
            return (
              <div
                key={id}
                className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-0 last:pb-0"
              >
                <span className="text-[11px] font-medium text-slate-700">
                  {unit.title}
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {primary ? formatReading(primary) : "—"}
                  {secondary ? ` · ${formatReading(secondary)}` : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {inspector.visible ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="pointer-events-auto rounded-xl border border-emerald-200/80 bg-emerald-50/95 px-3 py-2.5 shadow-lg backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                QA Inspection
              </span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-900/85">{inspector.activityLabel}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
