import type {
  EquipmentStatus,
  FactoryAreaId,
  ProductionStage,
} from "@/components/factory/simulation/ProductionState";
import { stageToArea } from "@/components/factory/simulation/ProductionState";

export type MachineStatus =
  | "idle"
  | "preparing"
  | "active"
  | "processing"
  | "warning"
  | "completed";

export function machineStatusLabel(status: MachineStatus): string {
  const map: Record<MachineStatus, string> = {
    idle: "IDLE",
    preparing: "PREPARING",
    active: "ACTIVE",
    processing: "PROCESSING",
    warning: "WARNING",
    completed: "COMPLETED",
  };
  return map[status];
}

export function resolveMachineStatus(
  areaId: FactoryAreaId,
  stage: ProductionStage,
  isSimulating: boolean,
): MachineStatus {
  if (!isSimulating) return "idle";
  const activeArea = stageToArea(stage);
  if (!activeArea) {
    if (stage === "finished") return "completed";
    return "idle";
  }
  if (activeArea === areaId) {
    if (stage === "finished") return "completed";
    return stage === "bioreactor" || stage === "filling" ? "processing" : "active";
  }
  const stageOrder: ProductionStage[] = [
    "raw-materials",
    "weighing",
    "preparation",
    "bioreactor",
    "downstream",
    "purification",
    "formulation",
    "filling",
    "quality-control",
    "packaging",
    "finished",
  ];
  const activeIdx = stageOrder.indexOf(stage);
  const areaStage = getAreaProductionStage(areaId);
  if (!areaStage) return "idle";
  const areaIdx = stageOrder.indexOf(areaStage);
  if (areaIdx < activeIdx) return "completed";
  return "idle";
}

function getAreaProductionStage(areaId: FactoryAreaId): ProductionStage | null {
  const map: Partial<Record<FactoryAreaId, ProductionStage>> = {
    "raw-materials": "raw-materials",
    weighing: "weighing",
    preparation: "preparation",
    bioreactor: "bioreactor",
    downstream: "downstream",
    purification: "purification",
    formulation: "formulation",
    filling: "filling",
    "quality-control": "quality-control",
    packaging: "packaging",
    "finished-goods": "finished",
  };
  return map[areaId] ?? null;
}

export function toLegacyStatus(status: MachineStatus): EquipmentStatus {
  if (status === "processing" || status === "active") return "running";
  if (status === "preparing") return "active";
  if (status === "warning") return "warning";
  if (status === "completed") return "normal";
  return "idle";
}
