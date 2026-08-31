import type {
  FactoryAreaId,
  SimulatedEquipment,
} from "@/components/factory/simulation/ProductionState";
import { FACTORY_MODEL_PATHS } from "@/components/factory/assets/factorySceneConfig";

export type FactoryAssetCategory =
  | "bioprocessing"
  | "tank"
  | "pump"
  | "filtration"
  | "utility"
  | "laboratory"
  | "packaging"
  | "warehouse"
  | "filling";

export type FactoryAssetDef = {
  id: string;
  name: string;
  path: string | null;
  department: FactoryAreaId;
  category: FactoryAssetCategory;
  description: string;
  purpose: string;
  defaultReadings: { label: string; value: string }[];
};

export const FACTORY_ASSETS: FactoryAssetDef[] = [
  {
    id: "bioreactor-01",
    name: "Bioreactor 01",
    path: FACTORY_MODEL_PATHS.bioreactorMain,
    department: "bioreactor",
    category: "bioprocessing",
    description: "Primary upstream bioprocessing vessel.",
    purpose: "Controlled biological cultivation and production.",
    defaultReadings: [
      { label: "Temperature", value: "37.0 °C" },
      { label: "Pressure", value: "1.2 bar" },
      { label: "Process", value: "FERMENTATION" },
      { label: "Progress", value: "64%" },
    ],
  },
  {
    id: "bioreactor-02",
    name: "Bioreactor 02",
    path: FACTORY_MODEL_PATHS.bioreactorSecondary,
    department: "bioreactor",
    category: "bioprocessing",
    description: "Secondary parallel upstream vessel.",
    purpose: "Parallel upstream production run.",
    defaultReadings: [
      { label: "Temperature", value: "36.8 °C" },
      { label: "Pressure", value: "1.18 bar" },
      { label: "Progress", value: "58%" },
    ],
  },
  {
    id: "mixer-01",
    name: "Single-Use Mixer",
    path: FACTORY_MODEL_PATHS.singleUseMixer,
    department: "preparation",
    category: "bioprocessing",
    description: "Single-use mixing system for buffer preparation.",
    purpose: "Controlled mixing and buffer preparation.",
    defaultReadings: [
      { label: "Agitation", value: "85 RPM" },
      { label: "Temp", value: "22.1 °C" },
      { label: "Volume", value: "200 L" },
    ],
  },
  {
    id: "prep-tank-01",
    name: "Preparation Tank",
    path: FACTORY_MODEL_PATHS.prepTank,
    department: "preparation",
    category: "tank",
    description: "Stainless steel preparation vessel with agitator.",
    purpose: "Large-scale buffer and media preparation.",
    defaultReadings: [
      { label: "Level", value: "78%" },
      { label: "Agitation", value: "120 RPM" },
    ],
  },
  {
    id: "ibc-01",
    name: "IBC Container 01",
    path: FACTORY_MODEL_PATHS.ibcTank,
    department: "raw-materials",
    category: "tank",
    description: "Intermediate bulk container for raw materials.",
    purpose: "Bulk ingredient storage and transfer.",
    defaultReadings: [{ label: "Fill", value: "92%" }],
  },
  {
    id: "iso-tank-01",
    name: "ISO Tank",
    path: FACTORY_MODEL_PATHS.isoTank,
    department: "raw-materials",
    category: "tank",
    description: "ISO logistics tank for liquid raw materials.",
    purpose: "Material storage and logistics.",
    defaultReadings: [{ label: "Status", value: "STORED" }],
  },
  {
    id: "chemical-tank-01",
    name: "Chemical Storage Tank",
    path: FACTORY_MODEL_PATHS.chemicalTank,
    department: "raw-materials",
    category: "tank",
    description: "Pharmaceutical-grade chemical storage tank.",
    purpose: "Controlled chemical ingredient storage.",
    defaultReadings: [{ label: "Level", value: "65%" }],
  },
  {
    id: "weigh-station-01",
    name: "Dispensing Scale",
    path: null,
    department: "weighing",
    category: "laboratory",
    description: "GMP weighing and dispensing station.",
    purpose: "Precision weighing under cleanroom control.",
    defaultReadings: [{ label: "Batch", value: "BR-2408-A" }],
  },
  {
    id: "filtration-skid-01",
    name: "Membrane Filtration Skid",
    path: FACTORY_MODEL_PATHS.filtrationSkid,
    department: "downstream",
    category: "filtration",
    description: "Downstream membrane filtration system.",
    purpose: "Harvest filtration and clarification.",
    defaultReadings: [
      { label: "Pressure", value: "2.4 bar" },
      { label: "Flow", value: "85 L/min" },
    ],
  },
  {
    id: "industrial-tank-01",
    name: "Process Hold Tank",
    path: FACTORY_MODEL_PATHS.industrialTank,
    department: "downstream",
    category: "tank",
    description: "Intermediate process hold vessel.",
    purpose: "Temporary downstream product hold.",
    defaultReadings: [{ label: "Level", value: "54%" }],
  },
  {
    id: "hplc-01",
    name: "Chromatography System",
    path: FACTORY_MODEL_PATHS.chromatography,
    department: "purification",
    category: "filtration",
    description: "Purification chromatography skid.",
    purpose: "Product isolation and polishing.",
    defaultReadings: [
      { label: "Pressure", value: "145 bar" },
      { label: "Flow", value: "1.2 mL/min" },
    ],
  },
  {
    id: "form-tank-01",
    name: "Formulation Vessel",
    path: FACTORY_MODEL_PATHS.stainlessTank,
    department: "formulation",
    category: "tank",
    description: "Final formulation stainless vessel.",
    purpose: "Drug substance formulation.",
    defaultReadings: [{ label: "Temp", value: "20.5 °C" }],
  },
  {
    id: "filler-01",
    name: "Vial Filling Line",
    path: FACTORY_MODEL_PATHS.fillingMachine,
    department: "filling",
    category: "filling",
    description: "Automatic aseptic vial filling machine.",
    purpose: "Aseptic filling and stoppering.",
    defaultReadings: [
      { label: "Speed", value: "120 vials/min" },
      { label: "Reject", value: "0.02%" },
    ],
  },
  {
    id: "microscope-01",
    name: "Trinocular Microscope",
    path: FACTORY_MODEL_PATHS.microscopeTrinocular,
    department: "quality-control",
    category: "laboratory",
    description: "QC analytical microscope workstation.",
    purpose: "Visual inspection and analysis.",
    defaultReadings: [{ label: "Sample", value: "QC-4421" }],
  },
  {
    id: "centrifuge-01",
    name: "Laboratory Centrifuge",
    path: FACTORY_MODEL_PATHS.centrifuge,
    department: "quality-control",
    category: "laboratory",
    description: "Sample preparation centrifuge.",
    purpose: "Sample separation for QC testing.",
    defaultReadings: [{ label: "RPM", value: "4200" }],
  },
  {
    id: "pack-line-01",
    name: "Packaging Line",
    path: null,
    department: "packaging",
    category: "packaging",
    description: "Automated secondary packaging line.",
    purpose: "Labeling and carton packing.",
    defaultReadings: [{ label: "Throughput", value: "48 cartons/min" }],
  },
  {
    id: "ro-uv-01",
    name: "RO + UV Water System",
    path: FACTORY_MODEL_PATHS.roUvSkid,
    department: "utilities",
    category: "utility",
    description: "Water for injection generation skid.",
    purpose: "Purified water and utility supply.",
    defaultReadings: [
      { label: "Conductivity", value: "0.8 µS/cm" },
      { label: "UV", value: "ACTIVE" },
    ],
  },
  {
    id: "pump-main-01",
    name: "Process Transfer Pump",
    path: FACTORY_MODEL_PATHS.centrifugalPump,
    department: "downstream",
    category: "pump",
    description: "Centrifugal transfer pump.",
    purpose: "Inter-unit fluid transfer.",
    defaultReadings: [{ label: "Flow", value: "42 L/min" }],
  },
];

export const FACTORY_ASSET_MAP = Object.fromEntries(
  FACTORY_ASSETS.map((a) => [a.id, a]),
) as Record<string, FactoryAssetDef>;

export function buildSimulatedEquipment(): SimulatedEquipment[] {
  return FACTORY_ASSETS.map((asset) => ({
    id: asset.id,
    name: asset.name,
    areaId: asset.department,
    purpose: asset.purpose,
    status: "idle",
    readings: asset.defaultReadings,
  }));
}

export function getFactoryAsset(id: string) {
  return FACTORY_ASSET_MAP[id] ?? null;
}
