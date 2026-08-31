"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  cloneTelemetry,
  tickTelemetry,
} from "@/components/laboratory/equipmentTelemetry";
import type { EquipmentTelemetry } from "@/components/laboratory/equipmentTelemetry";
import type { EquipmentId } from "@/components/laboratory/types";

type LaboratoryTelemetryContextValue = {
  telemetry: Record<EquipmentId, EquipmentTelemetry>;
  getReadings: (id: EquipmentId) => EquipmentTelemetry | null;
};

const LaboratoryTelemetryContext =
  createContext<LaboratoryTelemetryContextValue | null>(null);

export function LaboratoryTelemetryProvider({ children }: { children: ReactNode }) {
  const [telemetry, setTelemetry] = useState(cloneTelemetry);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTelemetry((current) => tickTelemetry(current));
    }, 2200);
    return () => window.clearInterval(timer);
  }, []);

  const value = useMemo(
    () => ({
      telemetry,
      getReadings: (id: EquipmentId) => telemetry[id] ?? null,
    }),
    [telemetry],
  );

  return (
    <LaboratoryTelemetryContext.Provider value={value}>
      {children}
    </LaboratoryTelemetryContext.Provider>
  );
}

export function useLaboratoryTelemetry() {
  const ctx = useContext(LaboratoryTelemetryContext);
  if (!ctx) {
    throw new Error(
      "useLaboratoryTelemetry must be used within LaboratoryTelemetryProvider",
    );
  }
  return ctx;
}

export function useTelemetryOptional() {
  return useContext(LaboratoryTelemetryContext);
}
