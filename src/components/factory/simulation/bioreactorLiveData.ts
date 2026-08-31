import type { EquipmentReading } from "@/components/factory/simulation/ProductionState";

function hash(id: string): number {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

function wave(t: number, freq: number, amp: number, phase = 0) {
  return Math.sin(t * freq + phase) * amp;
}

/** Fluctuating bioreactor telemetry for digital-twin dialogs. */
export function getBioreactorLiveReadings(
  equipmentId: string,
  isSimulating: boolean,
  timeMs: number,
): EquipmentReading[] {
  const h = hash(equipmentId);
  const t = timeMs / 1000;
  const baseTemp = equipmentId.includes("02") ? 36.8 : 37.0;
  const basePressure = equipmentId.includes("02") ? 1.18 : 1.22;
  const running = isSimulating;

  const temp = baseTemp + wave(t, 0.07, 0.35, h) + (running ? wave(t, 0.19, 0.12) : 0);
  const pressure =
    basePressure + wave(t, 0.05, 0.04, h * 0.3) + (running ? 0.02 : 0);
  const do2 = running ? 42 + wave(t, 0.11, 3.5, h) : 68 + wave(t, 0.08, 1.2, h);
  const ph = running ? 7.05 + wave(t, 0.09, 0.06, h) : 7.12;
  const agitation = running ? 185 + wave(t, 0.14, 12, h) : 0;
  const progress = running
    ? Math.min(99, 52 + ((t * 3.2 + h) % 47))
    : 0;

  return [
    { label: "Temperature", value: `${temp.toFixed(2)} °C` },
    { label: "Vessel Pressure", value: `${pressure.toFixed(2)} bar` },
    { label: "Dissolved O₂", value: `${do2.toFixed(1)} %` },
    { label: "pH", value: ph.toFixed(2) },
    { label: "Agitation", value: running ? `${Math.round(agitation)} RPM` : "STANDBY" },
    { label: "Batch Progress", value: running ? `${Math.round(progress)} %` : "—" },
    {
      label: "Process Phase",
      value: running ? "FERMENTATION" : "IDLE",
    },
    {
      label: "Viability",
      value: running ? `${(92 + wave(t, 0.04, 1.8)).toFixed(1)} %` : "—",
    },
  ];
}
