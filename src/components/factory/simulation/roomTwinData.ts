import type { FactoryAreaId } from "@/components/factory/simulation/ProductionState";

export type RoomTwinReading = {
  label: string;
  value: string;
  status?: "normal" | "active" | "warning";
};

export type RoomTwinSnapshot = {
  areaId: FactoryAreaId;
  batchId: string;
  readings: RoomTwinReading[];
  equipmentOnline: number;
  personnelCount: number;
};

function hash(id: string): number {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

const CLEANROOM_AREAS = new Set<FactoryAreaId>([
  "weighing", "preparation", "bioreactor", "downstream", "purification",
  "formulation", "filling", "quality-control", "packaging", "utilities",
]);

export function getRoomTwinSnapshot(
  areaId: FactoryAreaId,
  isSimulating: boolean,
  personnelCount: number,
  equipmentCount: number,
): RoomTwinSnapshot {
  const h = hash(areaId);
  const isClean = CLEANROOM_AREAS.has(areaId);
  const temp = isClean ? 20 + (h % 3) * 0.5 : 18 + (h % 4);
  const rh = 42 + (h % 12);
  const dp = isClean ? 12 + (h % 8) : 2 + (h % 3);
  const ach = isClean ? 18 + (h % 6) : 6 + (h % 4);

  const batchNum = 2400 + (h % 180);
  const batchId = isSimulating ? `CG-BATCH-${batchNum}` : "—";

  return {
    areaId,
    batchId,
    personnelCount,
    equipmentOnline: equipmentCount,
    readings: [
      { label: "Temperature", value: `${temp.toFixed(1)} °C`, status: "normal" },
      { label: "Relative Humidity", value: `${rh} %RH`, status: "normal" },
      { label: "Pressure Δ", value: `${dp} Pa`, status: isClean ? "active" : "normal" },
      { label: "Air Changes", value: `${ach} /hr`, status: "normal" },
      {
        label: "Room Status",
        value: isSimulating ? "IN PRODUCTION" : "STANDBY",
        status: isSimulating ? "active" : "normal",
      },
      {
        label: "GMP Class",
        value: isClean ? (areaId === "filling" ? "Grade B" : "Grade C") : "Controlled",
        status: "normal",
      },
    ],
  };
}
