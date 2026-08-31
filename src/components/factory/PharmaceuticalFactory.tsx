"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { FactoryProvider, useFactory } from "@/components/factory/context/FactoryContext";
import type { FactoryCameraHandle } from "@/components/factory/FactoryCamera";
import {
  BioreactorTelemetryPanel,
  ContextualRightPanel,
  FactoryBrandBar,
  FactoryControls,
  FactoryHeader,
  RoomModeBanner,
  SceneViewToggle,
  SimulationControls,
} from "@/components/factory/ui/FactoryHUD";
import { FactoryLoaderOverlay } from "@/components/factory/ui/FactoryLoader";
import { useFactoryPerformance } from "@/components/factory/hooks/useFactoryPerformance";

const FactoryScene = dynamic(
  () =>
    import("@/components/factory/FactoryScene").then((mod) => mod.FactoryScene),
  { ssr: false, loading: () => null },
);

function FactoryUI({
  controlsRef,
}: {
  controlsRef: React.RefObject<FactoryCameraHandle | null>;
}) {
  const { startGuidedTour, stopGuidedTour, state } = useFactory();
  const [autoRotate, setAutoRotate] = useState(false);

  return (
    <>
      <FactoryBrandBar />
      <FactoryHeader />

      <div className="pointer-events-none absolute inset-x-0 top-[4.5rem] flex justify-center px-4">
        <RoomModeBanner />
      </div>

      {/* Side panels — vertically centered, away from bottom controls */}
      <div className="pointer-events-none absolute left-4 top-[44%] max-h-[min(52vh,420px)] max-w-[min(100%,300px)] -translate-y-1/2 overflow-y-auto">
        <BioreactorTelemetryPanel />
      </div>
      <div className="pointer-events-none absolute right-4 top-[75%] max-h-[min(52vh,420px)] max-w-[min(100%,340px)] -translate-y-1/2 overflow-y-auto">
        <ContextualRightPanel />
      </div>

      {/* Bottom bar — controls only, no contextual panels */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[5.5rem] flex justify-center px-4">
        <SimulationControls />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-between px-4 sm:px-5">
        <div className="pointer-events-auto self-end">
          <SceneViewToggle />
        </div>
        <div className="pointer-events-auto self-end">
          <FactoryControls
            autoRotate={autoRotate}
            onToggleRotate={() => setAutoRotate((v) => !v)}
            onResetView={() => controlsRef.current?.resetView()}
            onStartTour={startGuidedTour}
            onStopTour={stopGuidedTour}
            tourActive={state.guidedTourActive}
          />
        </div>
      </div>
    </>
  );
}

export function FactoryExperience() {
  const perf = useFactoryPerformance();
  const controlsRef = useRef<FactoryCameraHandle | null>(null);
  const [loading, setLoading] = useState(true);

  const handleReady = useCallback(() => {
    window.setTimeout(() => setLoading(false), 500);
  }, []);

  return (
    <FactoryProvider>
      <div
        dir="ltr"
        className="relative h-[100dvh] w-full overflow-hidden bg-[#eef2f6] font-[system-ui,sans-serif]"
      >
        <FactoryLoaderOverlay visible={loading} />

        <div className="absolute inset-0 z-0">
          <FactoryScene
            perf={perf}
            autoRotate={false}
            onReady={handleReady}
            controlsRef={controlsRef}
          />
        </div>

        {/* All HTML UI above 3D scene labels */}
        <div className="pointer-events-none absolute inset-0 z-50">
          <FactoryUI controlsRef={controlsRef} />
        </div>
      </div>
    </FactoryProvider>
  );
}
