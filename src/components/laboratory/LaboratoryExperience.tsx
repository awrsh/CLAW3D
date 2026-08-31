"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { LaboratoryProvider } from "@/components/laboratory/context/LaboratoryContext";
import { LaboratoryInspectorProvider } from "@/components/laboratory/context/LaboratoryInspectorContext";
import { LaboratoryTelemetryProvider } from "@/components/laboratory/context/LaboratoryTelemetryContext";
import {
  LaboratoryControls,
  EquipmentInfoPanel,
  LaboratoryHeader,
} from "@/components/laboratory/EquipmentInfo";
import { LaboratoryLoaderOverlay } from "@/components/laboratory/LaboratoryLoader";
import { TelemetryHud } from "@/components/laboratory/TelemetryHud";
import { useLabPerformance } from "@/components/laboratory/hooks/useLabPerformance";
import type { CameraControlsHandle } from "@/components/laboratory/CameraControls";

const LaboratoryScene = dynamic(
  () =>
    import("@/components/laboratory/LaboratoryScene").then(
      (mod) => mod.LaboratoryScene,
    ),
  { ssr: false, loading: () => null },
);

export function LaboratoryExperience() {
  const perf = useLabPerformance();
  const controlsRef = useRef<CameraControlsHandle | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [exploreMode, setExploreMode] = useState(true);

  const handleReady = useCallback(() => {
    window.setTimeout(() => setLoading(false), 400);
  }, []);

  const resetView = () => controlsRef.current?.resetView();

  const handleToggleExplore = () => {
    setExploreMode((prev) => {
      const next = !prev;
      if (next) setAutoRotate(true);
      return next;
    });
  };

  return (
    <LaboratoryProvider>
      <LaboratoryTelemetryProvider>
        <LaboratoryInspectorProvider enabled={!perf.isMobile}>
          <div
            dir="ltr"
            className="relative h-[100dvh] w-full overflow-hidden bg-[#eef2f6] font-[system-ui,sans-serif]"
          >
            <LaboratoryLoaderOverlay visible={loading} />

            <LaboratoryScene
              perf={perf}
              autoRotate={autoRotate}
              onReady={handleReady}
              controlsRef={controlsRef}
              inspectorEnabled={!perf.isMobile}
            />

            <LaboratoryHeader />
            <TelemetryHud />

            <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex flex-col items-end gap-3 px-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="hidden sm:block" />
              <div className="flex w-full flex-col items-end gap-3 sm:w-auto sm:flex-row sm:items-end">
                <EquipmentInfoPanel />
                <LaboratoryControls
                  autoRotate={autoRotate}
                  onToggleRotate={() => setAutoRotate((v) => !v)}
                  onResetView={resetView}
                  exploreMode={exploreMode}
                  onToggleExplore={handleToggleExplore}
                />
              </div>
            </div>
          </div>
        </LaboratoryInspectorProvider>
      </LaboratoryTelemetryProvider>
    </LaboratoryProvider>
  );
}
