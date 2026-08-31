/** Canvas quality presets — persisted with building config. */

export type PerformanceMode = "high" | "balanced" | "low";

export type PerformanceProfile = {
  label: string;
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  antialias: boolean;
};

export const PERFORMANCE_PROFILES: Record<PerformanceMode, PerformanceProfile> = {
  high: {
    label: "بالا",
    dpr: [1, 1.5],
    shadows: true,
    shadowMapSize: 1024,
    antialias: true,
  },
  balanced: {
    label: "متوسط",
    dpr: [1, 1.25],
    shadows: true,
    shadowMapSize: 512,
    antialias: true,
  },
  low: {
    label: "پایین",
    dpr: [1, 1],
    shadows: false,
    shadowMapSize: 256,
    antialias: false,
  },
};

export const PERFORMANCE_MODE_OPTIONS: Array<{
  value: PerformanceMode;
  label: string;
  title: string;
}> = [
  { value: "high", label: "بالا", title: "کیفیت بالا · سایه ۱۰۲۴ · DPR تا ۱.۵" },
  {
    value: "balanced",
    label: "متوسط",
    title: "متعادل · سایه ۵۱۲ · DPR تا ۱.۲۵",
  },
  {
    value: "low",
    label: "پایین",
    title: "سبک · بدون سایه · DPR ۱",
  },
];

export function normalizePerformanceMode(raw: unknown): PerformanceMode {
  if (raw === "high" || raw === "balanced" || raw === "low") return raw;
  return "balanced";
}
