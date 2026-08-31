"use client";

import { memo } from "react";
import { ProcessMonitor } from "@/components/laboratory/ProcessMonitor";
import { useTelemetryOptional } from "@/components/laboratory/context/LaboratoryTelemetryContext";
import type { EquipmentId } from "@/components/laboratory/types";

type EquipmentTelemetryMonitorProps = {
  equipmentId: EquipmentId;
  position?: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  pixelScale?: number;
};

export const EquipmentTelemetryMonitor = memo(function EquipmentTelemetryMonitor({
  equipmentId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width,
  height,
  pixelScale,
}: EquipmentTelemetryMonitorProps) {
  const telemetry = useTelemetryOptional();
  const data = telemetry?.getReadings(equipmentId);

  if (!data) return null;

  return (
    <ProcessMonitor
      title={data.title}
      readings={data.readings}
      status={data.status}
      position={position}
      rotation={rotation}
      width={width}
      height={height}
      pixelScale={pixelScale}
    />
  );
});
