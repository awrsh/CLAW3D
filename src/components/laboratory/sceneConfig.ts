import type { EquipmentMeta } from "@/components/laboratory/types";
import { LAB_LAYOUT } from "@/components/laboratory/labLayout";

/** Set to false after placing downloaded GLB/GLTF files in public/models/laboratory/ */
export const LAB_USE_PROXY_MODELS = true;

export const LAB_MODEL_PATHS = {
  bioreactorMain: "/models/laboratory/bioreactor-main.glb",
  bioreactorSecondary: "/models/laboratory/bioreactor-secondary.glb",
  singleUseMixer: "/models/laboratory/single-use-mixer.glb",
  microscope: "/models/laboratory/microscope.glb",
  labCabinet: "/models/laboratory/lab-cabinet.glb",
  centrifuge: "/models/laboratory/centrifuge.glb",
  fumeHood: "/models/laboratory/fume-hood.glb",
  chromatography: "/models/laboratory/chromatography.glb",
  autoclave: "/models/laboratory/autoclave.glb",
  incubator: "/models/laboratory/incubator.glb",
} as const;

export const LAB_COLORS = {
  floor: "#e8ecef",
  floorEdge: "#d0d5da",
  wall: "#f5f7f9",
  wallAccent: "#e2e6ea",
  ceiling: "#fafbfc",
  graphite: "#3d454d",
  graphiteDark: "#2a3036",
  steel: "#b8c0c8",
  steelBright: "#d8dee4",
  glass: "#c5dce8",
  glassTint: "#a8c8d8",
  accentTeal: "#0d9488",
  accentBlue: "#2563eb",
  heroGlow: "#e0f2fe",
  workstation: "#f0f2f5",
  walkway: "#dbeafe",
} as const;

export const LAB_DIMENSIONS = LAB_LAYOUT;

export const DEFAULT_CAMERA = {
  position: [16, 4.5, 15] as [number, number, number],
  target: [-4, 1.6, -2] as [number, number, number],
  fov: 42,
};

export const EQUIPMENT_CATALOG: Record<string, EquipmentMeta> = {
  "bioreactor-main": {
    id: "bioreactor-main",
    name: "Bioreactor",
    description:
      "Used for controlled cultivation of biological materials in pharmaceutical and biotechnology processes.",
    zone: "bioprocessing",
  },
  "bioreactor-secondary": {
    id: "bioreactor-secondary",
    name: "Bioreactor",
    description:
      "Secondary bioprocessing vessel for parallel culture runs and scale-up studies in R&D workflows.",
    zone: "bioprocessing",
  },
  "single-use-mixer": {
    id: "single-use-mixer",
    name: "Single-Use Mixer",
    description:
      "Used for controlled mixing and preparation in biopharmaceutical processes.",
    zone: "bioprocessing",
  },
  centrifuge: {
    id: "centrifuge",
    name: "Laboratory Centrifuge",
    description:
      "Separates biological samples by density for pharmaceutical QC and cell harvest workflows.",
    zone: "bioprocessing",
  },
  chromatography: {
    id: "chromatography",
    name: "Chromatography System",
    description:
      "HPLC/UPLC platform for purity analysis, compound separation and release testing.",
    zone: "bioprocessing",
  },
  microscope: {
    id: "microscope",
    name: "Trinocular Microscope",
    description:
      "Precision optical equipment used for laboratory research and sample analysis.",
    zone: "research",
  },
  "fume-hood": {
    id: "fume-hood",
    name: "Laboratory Fume Hood",
    description:
      "Contained ventilation workspace for safe handling of volatile reagents and APIs.",
    zone: "research",
  },
  incubator: {
    id: "incubator",
    name: "CO₂ Incubator",
    description:
      "Maintains stable temperature and atmosphere for cell culture and stability studies.",
    zone: "research",
  },
  "lab-cabinet": {
    id: "lab-cabinet",
    name: "Laboratory Cabinet",
    description:
      "Controlled storage for reagents, samples and laboratory consumables with clean-room compatibility.",
    zone: "storage",
  },
  autoclave: {
    id: "autoclave",
    name: "Autoclave",
    description:
      "Steam sterilization unit for glassware, media and critical manufacturing tools.",
    zone: "storage",
  },
};

export function getEquipmentMeta(id: string): EquipmentMeta | null {
  return EQUIPMENT_CATALOG[id] ?? null;
}
