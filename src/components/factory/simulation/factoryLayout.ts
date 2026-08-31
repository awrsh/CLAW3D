import type {
  FactoryAreaMeta,
  FactoryAreaId,
  SimulatedEquipment,
  AreaWorker,
} from "@/components/factory/simulation/ProductionState";
import {
  buildSimulatedEquipment,
  getFactoryAsset,
} from "@/components/factory/assets/factoryAssets";

export const FACTORY_DIMENSIONS = {
  width: 128,
  depth: 56,
  height: 5.8,
  corridorWidth: 8,
} as const;

export const FACTORY_COLORS = {
  floor: "#e4e8ec",
  corridor: "#dbeafe",
  wall: "#f4f6f8",
  wallAccent: "#e2e8f0",
  steel: "#b8c0c8",
  steelBright: "#d8dee4",
  graphite: "#3d454d",
  glass: "#c5dce8",
  accent: "#0d9488",
  accentBlue: "#2563eb",
  active: "#22c55e",
  warning: "#f59e0b",
  zoneHighlight: "#38bdf8",
} as const;

export const INTRO_CAMERA = {
  position: [0, 8, 48] as [number, number, number],
  target: [0, 0, 0] as [number, number, number],
};

export const DEFAULT_FACTORY_CAMERA = {
  position: [24, 36, 52] as [number, number, number],
  target: [0, 0, 0] as [number, number, number],
};

export type CameraViewMode = "overview" | "cinematic" | "room-interior";

export type AreaOpenSide = "south" | "north";

export function getAreaOpenSide(area: FactoryAreaMeta): AreaOpenSide {
  return area.center[2] < -4 ? "north" : "south";
}

/** Immersive first-person-style view from inside the room entrance */
export function getRoomInteriorCameraView(
  area: FactoryAreaMeta,
): { position: [number, number, number]; target: [number, number, number] } {
  const [cx, , cz] = area.center;
  const [, d] = area.size;
  const hd = d / 2;
  const openSide = getAreaOpenSide(area);
  const camZ = openSide === "south" ? cz + hd - 3.2 : cz - hd + 3.2;
  const targetZ = openSide === "south" ? cz - 1 : cz + 1;

  return {
    position: [cx + 0.8, 1.62, camZ],
    target: [cx, 1.35, targetZ],
  };
}

/** Camera views for open-top dollhouse layout — always from open side / above. */
export function getAreaCameraView(
  area: FactoryAreaMeta,
  mode: CameraViewMode = "cinematic",
): { position: [number, number, number]; target: [number, number, number] } {
  if (mode === "room-interior") {
    return getRoomInteriorCameraView(area);
  }

  const [cx, , cz] = area.center;
  const [, d] = area.size;
  const hd = d / 2;
  const target: [number, number, number] = [cx, 1.2, cz];

  // South wing (cz < -4) opens north; all others open south toward corridor
  const opensNorth = getAreaOpenSide(area) === "north";
  const openEdgeZ = opensNorth ? cz - hd : cz + hd;
  const margin = mode === "overview" ? 18 : 10;
  const camZ = opensNorth ? openEdgeZ - margin : openEdgeZ + margin;
  const camY = mode === "overview" ? 34 : 18;

  return {
    position: [cx + (mode === "cinematic" ? 4 : 0), camY, camZ],
    target,
  };
}

function area(
  id: FactoryAreaId,
  name: string,
  shortName: string,
  description: string,
  purpose: string,
  center: [number, number, number],
  size: [number, number],
  camera: FactoryAreaMeta["camera"],
  mapCell: FactoryAreaMeta["mapCell"],
  workers: AreaWorker[],
  productionStage?: FactoryAreaMeta["productionStage"],
): FactoryAreaMeta {
  return {
    id,
    name,
    shortName,
    description,
    purpose,
    workers,
    center,
    size,
    camera,
    mapCell,
    productionStage,
  };
}

/** Production flow runs along +X. Support areas on ±Z. */
export const FACTORY_AREAS: FactoryAreaMeta[] = [
  area(
    "entrance",
    "Entrance / Reception",
    "Entrance",
    "Corporate reception, security access and visitor orientation for the biopharmaceutical manufacturing facility.",
    "Visitor reception, security screening and facility orientation.",
    [0, 0, 24],
    [22, 14],
    { position: [0, 5, 34], target: [0, 1, 24] },
    { row: 0, col: 1, colSpan: 2 },
    [
      { id: "ent-sec", role: "Security Officer", activity: "Verifying access badges", position: [-3, 0, 3], rotation: 0.4, pose: "standing", uniform: "security" },
      { id: "ent-rec", role: "Reception Host", activity: "Registering facility visitors", position: [2, 0, -2], rotation: -0.5, pose: "typing", uniform: "office" },
    ],
  ),
  area(
    "manager-office",
    "Plant Manager Office",
    "Manager",
    "Executive office for plant management, batch review meetings and facility oversight.",
    "Plant management, executive meetings and facility oversight.",
    [-36, 0, 24],
    [12, 12],
    { position: [-36, 7, 34], target: [-36, 1, 24] },
    { row: 0, col: 0 },
    [
      { id: "mgr-dir", role: "Plant Director", activity: "Reviewing monthly OEE report", position: [-3, 0, 2], rotation: 0.2, pose: "typing", uniform: "office" },
      { id: "mgr-qa", role: "Quality Director", activity: "Sign-off on batch release agenda", position: [3, 0, 2], rotation: -0.15, pose: "monitoring", uniform: "office" },
      { id: "mgr-adm", role: "Executive Assistant", activity: "Scheduling GMP audit meetings", position: [0, 0, -1], rotation: 0, pose: "typing", uniform: "office" },
    ],
  ),
  area(
    "qa-office",
    "QA Documentation Office",
    "QA Office",
    "Quality Assurance document control, batch record review and regulatory compliance.",
    "QA batch record review, document control and release documentation.",
    [36, 0, 24],
    [12, 12],
    { position: [36, 7, 34], target: [36, 1, 24] },
    { row: 0, col: 3 },
    [
      { id: "qa-spec", role: "QA Specialist", activity: "Reviewing batch manufacturing record", position: [-2, 0, 0], rotation: 0.3, pose: "typing", uniform: "office" },
      { id: "qa-rel", role: "Batch Release Officer", activity: "Checking COA against specifications", position: [2, 0, 0], rotation: -0.2, pose: "inspecting", uniform: "lab" },
      { id: "qa-doc", role: "Document Controller", activity: "Archiving executed batch records", position: [0, 0, 2], rotation: 3.1, pose: "typing", uniform: "office" },
    ],
  ),
  area(
    "rnd",
    "R&D Center",
    "R&D",
    "Research and development laboratory for cell line development, analytical method work and process characterization.",
    "Early-stage research, cell line work and analytical method development.",
    [-18, 0, 18],
    [20, 18],
    { position: [-18, 8, 28], target: [-18, 1, 18] },
    { row: 0, col: 1 },
    [
      { id: "rnd-sci", role: "Research Scientist", activity: "Reviewing culture data on monitor", position: [-4, 0, -3], rotation: 0.6, pose: "monitoring", uniform: "lab" },
      { id: "rnd-tech", role: "Lab Technician", activity: "Preparing samples at workstation", position: [5, 0, 0], rotation: -1.2, pose: "operating", uniform: "lab" },
    ],
  ),
  area(
    "control-room",
    "Production Control Room",
    "Control",
    "Central monitoring of bioreactors, purification skids, filling lines and facility KPIs.",
    "Central batch monitoring, alarms and production KPI oversight.",
    [18, 0, 18],
    [18, 14],
    { position: [18, 6, 28], target: [18, 1.5, 18] },
    { row: 1, col: 3 },
    [
      { id: "ctrl-sup", role: "Production Supervisor", activity: "Monitoring live batch dashboard", position: [-2, 0, -1], rotation: 0, pose: "monitoring", uniform: "office" },
      { id: "ctrl-eng", role: "Process Engineer", activity: "Reviewing bioreactor trends", position: [2, 0, 0], rotation: 0.2, pose: "typing", uniform: "office" },
    ],
  ),
  area(
    "raw-materials",
    "Raw Material Storage",
    "Storage",
    "Controlled storage of pharmaceutical ingredients and production materials.",
    "Controlled warehousing and traceability of raw materials.",
    [-48, 0, 0],
    [16, 18],
    { position: [-48, 7, 14], target: [-48, 1, 0] },
    { row: 1, col: 0 },
    [
      { id: "raw-op", role: "Warehouse Operator", activity: "Scanning inbound pallets", position: [-3, 0, 3], rotation: -0.8, pose: "inspecting", uniform: "warehouse" },
      { id: "raw-clerk", role: "Inventory Clerk", activity: "Updating stock in ERP", position: [4, 0, -4], rotation: 0.3, pose: "typing", uniform: "warehouse" },
      { id: "raw-fork", role: "Forklift Driver", activity: "Moving pallet to cold store", position: [0, 0, -2], rotation: 1.1, pose: "operating", uniform: "warehouse" },
    ],
    "raw-materials",
  ),
  area(
    "weighing",
    "Weighing & Dispensing",
    "Weighing",
    "GMP weighing and dispensing of raw materials under cleanroom controls.",
    "GMP weighing and dispensing of ingredients per batch record.",
    [-32, 0, 0],
    [14, 16],
    { position: [-32, 6, 12], target: [-32, 1, 0] },
    { row: 1, col: 1 },
    [
      { id: "wgh-op", role: "Dispensing Operator", activity: "Weighing API on precision scale", position: [-1, 0, 1], rotation: 3.14, pose: "weighing", uniform: "cleanroom" },
      { id: "wgh-qa", role: "QA Witness", activity: "Witnessing critical weigh step", position: [3, 0, -1], rotation: 2.6, pose: "inspecting", uniform: "lab" },
    ],
    "weighing",
  ),
  area(
    "preparation",
    "Solution Preparation",
    "Preparation",
    "Buffer and media preparation with stainless vessels, pumps and digital controls.",
    "Buffer and media preparation for upstream production.",
    [-16, 0, 0],
    [14, 16],
    { position: [-16, 6, 12], target: [-16, 1, 0] },
    { row: 1, col: 2 },
    [
      { id: "prep-op", role: "Prep Operator", activity: "Running single-use mixer cycle", position: [-3, 0, 1], rotation: 0.5, pose: "operating", uniform: "cleanroom" },
      { id: "prep-tech", role: "Utility Technician", activity: "Checking pump connections", position: [3, 0, 2], rotation: -0.6, pose: "inspecting", uniform: "cleanroom" },
    ],
    "preparation",
  ),
  area(
    "bioreactor",
    "Bioreactor / Upstream",
    "Upstream",
    "Controlled biological cultivation and upstream bioprocessing.",
    "Biological cultivation and upstream bioprocessing runs.",
    [0, 0, 0],
    [16, 18],
    { position: [0, 8, 16], target: [0, 2, 0] },
    { row: 2, col: 0 },
    [
      { id: "bio-op", role: "Upstream Operator", activity: "Monitoring fermentation parameters", position: [-5, 0, 2], rotation: 0.35, pose: "monitoring", uniform: "cleanroom" },
      { id: "bio-eng", role: "Bioprocess Engineer", activity: "Adjusting DO and agitation setpoints", position: [4, 0, -3], rotation: -0.4, pose: "operating", uniform: "cleanroom" },
      { id: "bio-samp", role: "Sampling Technician", activity: "Drawing aseptic culture sample", position: [0, 0, 4], rotation: 2.8, pose: "inspecting", uniform: "cleanroom" },
    ],
    "bioreactor",
  ),
  area(
    "downstream",
    "Downstream Processing",
    "Downstream",
    "Harvest, filtration and intermediate processing before purification.",
    "Harvest, filtration and intermediate process steps.",
    [16, 0, 0],
    [14, 16],
    { position: [16, 7, 14], target: [16, 1.5, 0] },
    { row: 2, col: 1 },
    [
      { id: "ds-op", role: "Harvest Operator", activity: "Transferring culture to filter skid", position: [-3, 0, 1], rotation: 0.5, pose: "operating", uniform: "cleanroom" },
      { id: "ds-fil", role: "Filtration Specialist", activity: "Operating depth filter train", position: [2, 0, 2], rotation: -0.3, pose: "monitoring", uniform: "cleanroom" },
    ],
    "downstream",
  ),
  area(
    "purification",
    "Purification",
    "Purify",
    "Chromatography and filtration for product isolation and polishing.",
    "Chromatography and polishing for product isolation.",
    [32, 0, 0],
    [16, 16],
    { position: [32, 7, 14], target: [32, 1.5, 0] },
    { row: 2, col: 2 },
    [
      { id: "pur-op", role: "Purification Operator", activity: "Running chromatography cycle", position: [0, 0, -1], rotation: 0, pose: "operating", uniform: "cleanroom" },
      { id: "pur-tech", role: "Senior Technician", activity: "Collecting fraction samples", position: [-3, 0, 3], rotation: 0.8, pose: "inspecting", uniform: "cleanroom" },
    ],
    "purification",
  ),
  area(
    "formulation",
    "Formulation",
    "Formulation",
    "Final formulation under controlled cleanroom conditions.",
    "Final drug substance formulation under cleanroom control.",
    [48, 0, 0],
    [14, 14],
    { position: [48, 6, 12], target: [48, 1, 0] },
    { row: 2, col: 3 },
    [
      { id: "form-sci", role: "Formulation Scientist", activity: "Blending final formulation batch", position: [0, 0, -1], rotation: 0, pose: "operating", uniform: "lab" },
      { id: "form-op", role: "Cleanroom Operator", activity: "Maintaining aseptic conditions", position: [-3, 0, 2], rotation: 0.6, pose: "inspecting", uniform: "cleanroom" },
    ],
    "formulation",
  ),
  area(
    "filling",
    "Filling Room",
    "Filling",
    "Aseptic vial filling line with conveyor, sensors and in-line controls.",
    "Aseptic vial filling, stoppering and in-line inspection.",
    [0, 0, -16],
    [16, 16],
    { position: [0, 7, -4], target: [0, 1, -16] },
    { row: 3, col: 0 },
    [
      { id: "fill-op", role: "Fill-Finish Operator", activity: "Supervising vial filling line", position: [3, 0, 1], rotation: -0.5, pose: "monitoring", uniform: "cleanroom" },
      { id: "fill-tech", role: "Line Technician", activity: "Clearing conveyor sensor alert", position: [-3, 0, 2], rotation: 0.4, pose: "operating", uniform: "cleanroom" },
      { id: "fill-qa", role: "In-Process QA", activity: "Checking fill weight samples", position: [0, 0, -3], rotation: 0.1, pose: "weighing", uniform: "lab" },
    ],
    "filling",
  ),
  area(
    "quality-control",
    "Quality Control",
    "QC",
    "Analytical testing and quality verification of pharmaceutical products.",
    "Analytical testing and release verification of products.",
    [16, 0, -16],
    [14, 14],
    { position: [16, 6, -4], target: [16, 1, -16] },
    { row: 3, col: 1 },
    [
      { id: "qc-an", role: "QC Analyst", activity: "Running HPLC purity assay", position: [2, 0, 1], rotation: -0.7, pose: "operating", uniform: "lab" },
      { id: "qc-micro", role: "Microbiologist", activity: "Inspecting sterility samples", position: [-3, 0, 0], rotation: 0.5, pose: "inspecting", uniform: "lab" },
      { id: "qc-doc", role: "QC Documenter", activity: "Recording batch test results", position: [0, 0, 3], rotation: -0.2, pose: "typing", uniform: "lab" },
    ],
    "quality-control",
  ),
  area(
    "packaging",
    "Packaging",
    "Packaging",
    "Automated labeling, carton packing and serialization.",
    "Labeling, serialization and secondary packaging.",
    [32, 0, -16],
    [16, 16],
    { position: [32, 7, -4], target: [32, 1, -16] },
    { row: 3, col: 2 },
    [
      { id: "pack-op", role: "Packaging Operator", activity: "Loading cartons onto conveyor", position: [-2, 0, 1], rotation: 0.3, pose: "operating", uniform: "cleanroom" },
      { id: "pack-vis", role: "Vision Inspector", activity: "Reviewing camera reject logs", position: [3, 0, 1], rotation: -0.4, pose: "monitoring", uniform: "lab" },
      { id: "pack-lead", role: "Line Lead", activity: "Verifying serialization labels", position: [0, 0, -2], rotation: 0.6, pose: "inspecting", uniform: "cleanroom" },
    ],
    "packaging",
  ),
  area(
    "finished-goods",
    "Finished Product Storage",
    "Finished",
    "Temperature-controlled warehousing and dispatch preparation.",
    "Cold-chain storage and dispatch preparation.",
    [48, 0, -16],
    [16, 16],
    { position: [48, 8, -4], target: [48, 1, -16] },
    { row: 3, col: 3 },
    [
      { id: "fg-log", role: "Logistics Coordinator", activity: "Allocating cold-chain pallets", position: [-2, 0, 1], rotation: 0.5, pose: "inspecting", uniform: "warehouse" },
      { id: "fg-ship", role: "Shipping Clerk", activity: "Preparing dispatch documents", position: [3, 0, -3], rotation: -0.2, pose: "typing", uniform: "warehouse" },
    ],
    "finished",
  ),
  area(
    "utilities",
    "Utilities / Technical",
    "Utilities",
    "HVAC, WFI generation, clean steam and technical infrastructure.",
    "HVAC, WFI and clean utility infrastructure support.",
    [-18, 0, -16],
    [18, 14],
    { position: [-18, 7, -4], target: [-18, 1, -16] },
    { row: 3, col: 0 },
    [
      { id: "util-eng", role: "Facilities Engineer", activity: "Checking WFI loop pressure", position: [-3, 0, 0], rotation: 0.4, pose: "monitoring", uniform: "cleanroom" },
      { id: "util-hvac", role: "HVAC Technician", activity: "Balancing cleanroom air flow", position: [3, 0, 1], rotation: -0.5, pose: "operating", uniform: "cleanroom" },
    ],
  ),
];

export const FACTORY_AREA_MAP = Object.fromEntries(
  FACTORY_AREAS.map((a) => [a.id, a]),
) as Record<FactoryAreaId, FactoryAreaMeta>;

export const GUIDED_TOUR_ORDER: FactoryAreaId[] = [
  "entrance",
  "manager-office",
  "rnd",
  "qa-office",
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
  "finished-goods",
  "control-room",
];

export const SIMULATED_EQUIPMENT: SimulatedEquipment[] = buildSimulatedEquipment();

export function getEquipment(id: string): SimulatedEquipment | null {
  const asset = getFactoryAsset(id);
  if (!asset) return null;
  const base = SIMULATED_EQUIPMENT.find((e) => e.id === id);
  return base ?? null;
}

export function equipmentForArea(areaId: FactoryAreaId) {
  return SIMULATED_EQUIPMENT.filter((e) => e.areaId === areaId);
}
