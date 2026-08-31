"use client";

import { EquipmentTelemetryMonitor } from "@/components/laboratory/EquipmentTelemetryMonitor";
import { ScadaWallDisplay } from "@/components/laboratory/ProcessMonitor";
import { useLaboratoryTelemetry } from "@/components/laboratory/context/LaboratoryTelemetryContext";
import { BIOPROCESSING_IDS } from "@/components/laboratory/equipmentTelemetry";
import { LAYOUT } from "@/components/laboratory/labLayout";
import { memo } from "react";

export const BioprocessingMonitors = memo(function BioprocessingMonitors() {
  const { telemetry } = useLaboratoryTelemetry();

  const scadaPanels = BIOPROCESSING_IDS.map((id) => ({
    title: telemetry[id].title,
    readings: telemetry[id].readings,
    status: telemetry[id].status,
  }));

  const [bA, bB, mix] = [
    LAYOUT.bioreactorMain,
    LAYOUT.bioreactorSecondary,
    LAYOUT.singleUseMixer,
  ];

  return (
    <group name="process-monitors">
      <ScadaWallDisplay
        position={[LAYOUT.scadaWall[0], LAYOUT.scadaWall[1], LAYOUT.scadaWall[2]]}
        panels={scadaPanels}
      />

      <EquipmentTelemetryMonitor
        equipmentId="bioreactor-main"
        position={[bA[0] + 1.35, 1.55, bA[2]]}
        rotation={[0, -Math.PI / 2, 0]}
        width={0.42}
        height={0.3}
      />
      <EquipmentTelemetryMonitor
        equipmentId="bioreactor-secondary"
        position={[bB[0] + 1.1, 1.25, bB[2]]}
        rotation={[0, -Math.PI / 2 + 0.35, 0]}
        width={0.36}
        height={0.26}
      />
      <EquipmentTelemetryMonitor
        equipmentId="single-use-mixer"
        position={[mix[0] + 0.55, 1.38, mix[2]]}
        rotation={[0, -0.15, 0]}
        width={0.28}
        height={0.18}
      />
      <EquipmentTelemetryMonitor
        equipmentId="centrifuge"
        position={[LAYOUT.centrifuge[0] + 0.55, 0.82, LAYOUT.centrifuge[2]]}
        rotation={[0, -Math.PI / 2, 0]}
        width={0.24}
        height={0.16}
        pixelScale={384}
      />
      <EquipmentTelemetryMonitor
        equipmentId="chromatography"
        position={[LAYOUT.chromatography[0] + 0.65, 1.05, LAYOUT.chromatography[2]]}
        rotation={[0, -Math.PI / 2 + 0.25, 0]}
        width={0.26}
        height={0.17}
        pixelScale={384}
      />
    </group>
  );
});

export const ZoneMonitors = memo(function ZoneMonitors() {
  return (
    <group name="zone-monitors">
      <EquipmentTelemetryMonitor
        equipmentId="microscope"
        position={[LAYOUT.workstation[0] + 0.65, 0.92, LAYOUT.workstation[2] + 0.35]}
        rotation={[0, -0.55, 0]}
        width={0.22}
        height={0.14}
        pixelScale={384}
      />
      <EquipmentTelemetryMonitor
        equipmentId="fume-hood"
        position={[LAYOUT.fumeHood[0], 1.35, LAYOUT.fumeHood[2] + 0.35]}
        rotation={[0, -0.15, 0]}
        width={0.24}
        height={0.15}
        pixelScale={384}
      />
      <EquipmentTelemetryMonitor
        equipmentId="incubator"
        position={[LAYOUT.incubator[0] + 0.45, 1.05, LAYOUT.incubator[2]]}
        rotation={[0, -Math.PI / 2, 0]}
        width={0.22}
        height={0.14}
        pixelScale={384}
      />
      <EquipmentTelemetryMonitor
        equipmentId="lab-cabinet"
        position={[LAYOUT.labCabinet[0] + 0.55, 1.48, LAYOUT.labCabinet[2]]}
        rotation={[0, -Math.PI / 2, 0]}
        width={0.24}
        height={0.16}
        pixelScale={384}
      />
      <EquipmentTelemetryMonitor
        equipmentId="autoclave"
        position={[LAYOUT.autoclave[0] + 0.45, 0.95, LAYOUT.autoclave[2]]}
        rotation={[0, -Math.PI / 2, 0]}
        width={0.22}
        height={0.14}
        pixelScale={384}
      />
    </group>
  );
});
