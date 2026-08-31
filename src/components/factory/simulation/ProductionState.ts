export type ProductionStage =
  | "idle"
  | "raw-materials"
  | "weighing"
  | "preparation"
  | "bioreactor"
  | "downstream"
  | "purification"
  | "formulation"
  | "filling"
  | "quality-control"
  | "packaging"
  | "finished";

export type FactoryAreaId =
  | "entrance"
  | "rnd"
  | "manager-office"
  | "qa-office"
  | "raw-materials"
  | "weighing"
  | "preparation"
  | "bioreactor"
  | "downstream"
  | "purification"
  | "formulation"
  | "filling"
  | "quality-control"
  | "packaging"
  | "finished-goods"
  | "control-room"
  | "utilities";

export type EquipmentStatus = "idle" | "active" | "running" | "normal" | "warning";

export type WorkerPose =
  | "tpose"
  | "operating"
  | "monitoring"
  | "inspecting"
  | "weighing"
  | "typing"
  | "standing";

export type WorkerUniform = "cleanroom" | "lab" | "warehouse" | "office" | "security";

export type AreaWorker = {
  id: string;
  role: string;
  activity: string;
  /** Position offset from area center */
  position: [number, number, number];
  /** Y-axis rotation in radians — face equipment */
  rotation?: number;
  pose?: WorkerPose;
  uniform?: WorkerUniform;
  color?: string;
  /** Walk back-and-forth to this offset from `position` */
  patrol?: {
    to: [number, number, number];
    speed?: number;
  };
  /** Stay in place (no patrol) */
  static?: boolean;
};

export type FactoryAreaMeta = {
  id: FactoryAreaId;
  name: string;
  shortName: string;
  description: string;
  /** One-line summary of what happens in this room */
  purpose: string;
  workers: AreaWorker[];
  center: [number, number, number];
  size: [number, number];
  camera: {
    position: [number, number, number];
    target: [number, number, number];
  };
  productionStage?: ProductionStage;
  mapCell: { row: number; col: number; rowSpan?: number; colSpan?: number };
};

export type EquipmentReading = {
  label: string;
  value: string;
};

export type SimulatedEquipment = {
  id: string;
  name: string;
  areaId: FactoryAreaId;
  purpose: string;
  status: EquipmentStatus;
  readings: EquipmentReading[];
};

export type FactorySimulationState = {
  productionStage: ProductionStage;
  overallProgress: number;
  isSimulating: boolean;
  guidedTourActive: boolean;
  guidedTourIndex: number;
  selectedAreaId: FactoryAreaId | null;
  selectedEquipmentId: string | null;
  activeAreaId: FactoryAreaId | null;
  introComplete: boolean;
};

export const PRODUCTION_STAGES: ProductionStage[] = [
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

export const STAGE_LABELS: Record<ProductionStage, string> = {
  idle: "Standby",
  "raw-materials": "Raw Materials",
  weighing: "Weighing & Dispensing",
  preparation: "Solution Preparation",
  bioreactor: "Bioreactor / Upstream",
  downstream: "Downstream Processing",
  purification: "Purification",
  formulation: "Formulation",
  filling: "Filling",
  "quality-control": "Quality Control",
  packaging: "Packaging",
  finished: "Finished Product",
};

export function stageToArea(stage: ProductionStage): FactoryAreaId | null {
  const map: Partial<Record<ProductionStage, FactoryAreaId>> = {
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
    finished: "finished-goods",
  };
  return map[stage] ?? null;
}

export function createInitialSimulationState(): FactorySimulationState {
  return {
    productionStage: "idle",
    overallProgress: 0,
    isSimulating: false,
    guidedTourActive: false,
    guidedTourIndex: 0,
    selectedAreaId: null,
    selectedEquipmentId: null,
    activeAreaId: null,
    introComplete: false,
  };
}
