"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { FactoryProvider, useFactory } from "@/components/factory/context/FactoryContext";
import type { FactoryCameraHandle } from "@/components/factory/FactoryCamera";
import {
  AreaInfoPanel,
  ControlRoomDashboard,
  EquipmentInfoPanel,
  FactoryControls,
  FactoryHeader,
  FactoryMap,
  ProductionFlowStrip,
  ProductionPanel,
  RoomModeBanner,
  RoomTwinPanel,
  SceneViewToggle,
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
  const {
    startGuidedTour,
    stopGuidedTour,
    state,
  } = useFactory();
  const [autoRotate, setAutoRotate] = useState(false);

  return (
    <>
      <FactoryHeader />
      <ProductionFlowStrip />

      <div className="pointer-events-none absolute inset-x-0 top-[4.5rem] z-20 flex justify-center px-4">
        <RoomModeBanner />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex flex-col gap-3 px-4 sm:px-5">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            {state.sceneViewMode !== "room" ? <FactoryMap /> : null}
            {state.sceneViewMode === "room" ? <RoomTwinPanel /> : <ProductionPanel />}
          </div>
          <div className="flex flex-col items-end gap-2">
            <SceneViewToggle />
            <ControlRoomDashboard />
            <EquipmentInfoPanel />
            <AreaInfoPanel />
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

        <FactoryScene
          perf={perf}
          autoRotate={false}
          onReady={handleReady}
          controlsRef={controlsRef}
        />

        <FactoryUI controlsRef={controlsRef} />
      </div>
    </FactoryProvider>
  );
}
