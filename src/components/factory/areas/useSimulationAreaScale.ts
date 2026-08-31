"use client";

import { useFactory } from "@/components/factory/context/FactoryContext";
import type { FactoryAreaId } from "@/components/factory/simulation/ProductionState";

/** Scale boost for the active room during production simulation. */
export function useSimulationAreaScale(areaId: FactoryAreaId) {
  const { state } = useFactory();
  if (
    state.isSimulating &&
    state.activeAreaId === areaId &&
    state.sceneViewMode === "facility"
  ) {
    return 1.14;
  }
  return 1;
}
