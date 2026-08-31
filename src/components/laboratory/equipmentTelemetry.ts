import type { EquipmentId } from "@/components/laboratory/types";

export type ProcessReading = {
  label: string;
  value: number;
  unit: string;
  decimals?: number;
  min?: number;
  max?: number;
};

export type EquipmentTelemetry = {
  id: EquipmentId;
  title: string;
  status: "normal" | "warning" | "offline";
  readings: ProcessReading[];
};

const BASE_TELEMETRY: Record<EquipmentId, Omit<EquipmentTelemetry, "readings"> & { readings: ProcessReading[] }> = {
  "bioreactor-main": {
    id: "bioreactor-main",
    title: "Bioreactor A",
    status: "normal",
    readings: [
      { label: "Temp", value: 36.5, unit: "°C", decimals: 1, min: 35.5, max: 37.5 },
      { label: "pH", value: 7.12, unit: "", decimals: 2, min: 6.8, max: 7.4 },
      { label: "DO", value: 48, unit: "%", decimals: 0, min: 40, max: 60 },
      { label: "RPM", value: 118, unit: "", decimals: 0, min: 100, max: 140 },
      { label: "Press", value: 1.18, unit: "bar", decimals: 2, min: 1.0, max: 1.35 },
    ],
  },
  "bioreactor-secondary": {
    id: "bioreactor-secondary",
    title: "Bioreactor B",
    status: "normal",
    readings: [
      { label: "Temp", value: 34.2, unit: "°C", decimals: 1, min: 33, max: 36 },
      { label: "pH", value: 7.05, unit: "", decimals: 2, min: 6.8, max: 7.4 },
      { label: "DO", value: 52, unit: "%", decimals: 0, min: 40, max: 60 },
      { label: "RPM", value: 95, unit: "", decimals: 0, min: 80, max: 120 },
    ],
  },
  "single-use-mixer": {
    id: "single-use-mixer",
    title: "Single-Use Mixer",
    status: "normal",
    readings: [
      { label: "Agit", value: 85, unit: "RPM", decimals: 0, min: 70, max: 100 },
      { label: "Temp", value: 22.1, unit: "°C", decimals: 1, min: 20, max: 25 },
      { label: "Vol", value: 200, unit: "L", decimals: 0, min: 180, max: 220 },
    ],
  },
  centrifuge: {
    id: "centrifuge",
    title: "Centrifuge",
    status: "normal",
    readings: [
      { label: "RPM", value: 4200, unit: "", decimals: 0, min: 3000, max: 5000 },
      { label: "Temp", value: 4.0, unit: "°C", decimals: 1, min: 2, max: 8 },
      { label: "Time", value: 12, unit: "min", decimals: 0 },
    ],
  },
  chromatography: {
    id: "chromatography",
    title: "HPLC System",
    status: "normal",
    readings: [
      { label: "Press", value: 145, unit: "bar", decimals: 0, min: 120, max: 180 },
      { label: "Flow", value: 1.2, unit: "mL/m", decimals: 1, min: 0.8, max: 2.0 },
      { label: "Temp", value: 35.0, unit: "°C", decimals: 1, min: 30, max: 40 },
    ],
  },
  microscope: {
    id: "microscope",
    title: "Microscope Station",
    status: "normal",
    readings: [
      { label: "Magn", value: 400, unit: "×", decimals: 0 },
      { label: "Temp", value: 21.5, unit: "°C", decimals: 1 },
    ],
  },
  "lab-cabinet": {
    id: "lab-cabinet",
    title: "Cold Storage",
    status: "normal",
    readings: [
      { label: "Temp", value: 4.2, unit: "°C", decimals: 1, min: 2, max: 8 },
      { label: "RH", value: 45, unit: "%", decimals: 0, min: 35, max: 55 },
    ],
  },
  "fume-hood": {
    id: "fume-hood",
    title: "Fume Hood",
    status: "normal",
    readings: [
      { label: "Face", value: 0.45, unit: "m/s", decimals: 2, min: 0.4, max: 0.6 },
      { label: "Temp", value: 21.8, unit: "°C", decimals: 1 },
    ],
  },
  incubator: {
    id: "incubator",
    title: "CO₂ Incubator",
    status: "normal",
    readings: [
      { label: "Temp", value: 37.0, unit: "°C", decimals: 1, min: 36, max: 38 },
      { label: "CO₂", value: 5.0, unit: "%", decimals: 1, min: 4.5, max: 5.5 },
      { label: "RH", value: 92, unit: "%", decimals: 0 },
    ],
  },
  autoclave: {
    id: "autoclave",
    title: "Autoclave",
    status: "normal",
    readings: [
      { label: "Temp", value: 121, unit: "°C", decimals: 0, min: 118, max: 125 },
      { label: "Press", value: 2.1, unit: "bar", decimals: 1, min: 1.8, max: 2.4 },
      { label: "Cycle", value: 18, unit: "min", decimals: 0 },
    ],
  },
};

function jitter(reading: ProcessReading): ProcessReading {
  const span =
    reading.min != null && reading.max != null
      ? (reading.max - reading.min) * 0.015
      : reading.value * 0.008;
  const delta = (Math.random() - 0.5) * span;
  let next = reading.value + delta;
  if (reading.min != null) next = Math.max(reading.min, next);
  if (reading.max != null) next = Math.min(reading.max, next);
  return { ...reading, value: next };
}

export function cloneTelemetry(): Record<EquipmentId, EquipmentTelemetry> {
  const out = {} as Record<EquipmentId, EquipmentTelemetry>;
  for (const [key, entry] of Object.entries(BASE_TELEMETRY)) {
    out[key as EquipmentId] = {
      ...entry,
      readings: entry.readings.map((r) => ({ ...r })),
    };
  }
  return out;
}

export function tickTelemetry(
  current: Record<EquipmentId, EquipmentTelemetry>,
): Record<EquipmentId, EquipmentTelemetry> {
  const next = { ...current };
  for (const id of Object.keys(current) as EquipmentId[]) {
    next[id] = {
      ...current[id],
      readings: current[id].readings.map(jitter),
    };
  }
  return next;
}

export function formatReading(reading: ProcessReading): string {
  const decimals = reading.decimals ?? 1;
  return `${reading.value.toFixed(decimals)}${reading.unit ? ` ${reading.unit}` : ""}`;
}

export const BIOPROCESSING_IDS: EquipmentId[] = [
  "bioreactor-main",
  "bioreactor-secondary",
  "single-use-mixer",
  "centrifuge",
  "chromatography",
];
