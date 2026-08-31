export type EquipmentId =
  | "bioreactor-main"
  | "bioreactor-secondary"
  | "single-use-mixer"
  | "centrifuge"
  | "chromatography"
  | "microscope"
  | "fume-hood"
  | "incubator"
  | "lab-cabinet"
  | "autoclave";

export type EquipmentMeta = {
  id: EquipmentId;
  name: string;
  description: string;
  zone: "bioprocessing" | "research" | "storage";
};

export type LaboratorySelection = {
  id: EquipmentId;
  meta: EquipmentMeta;
} | null;

export type LabPerformanceProfile = {
  isMobile: boolean;
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  antialias: boolean;
  enableHeroGlow: boolean;
  pipeDetail: "full" | "simple";
};
