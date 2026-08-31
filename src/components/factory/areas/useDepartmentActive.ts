"use client";

import { useFactory } from "@/components/factory/context/FactoryContext";
import { resolveMachineStatus } from "@/components/factory/simulation/EquipmentState";
import type { FactoryAreaId } from "@/components/factory/simulation/ProductionState";

export function useDepartmentActive(areaId: FactoryAreaId) {
  const { state, selectEquipment } = useFactory();
  const status = resolveMachineStatus(
    areaId,
    state.productionStage,
    state.isSimulating,
  );
  const active =
    status === "active" ||
    status === "processing" ||
    status === "preparing" ||
    state.activeAreaId === areaId;

  return {
    active,
    status,
    selectEquipment,
    isSimulating: state.isSimulating,
  };
}
