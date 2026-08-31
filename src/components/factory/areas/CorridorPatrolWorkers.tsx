"use client";

import { memo } from "react";
import type { AreaWorker } from "@/components/factory/simulation/ProductionState";
import { FactoryWorker } from "@/components/factory/areas/FactoryWorker";

const CORRIDOR_PATROLS: AreaWorker[] = [
  {
    id: "corridor-a",
    role: "Production Operator",
    activity: "Moving batch samples to QC",
    position: [-28, 0, 4],
    patrol: { to: [24, 0, 0], speed: 0.28 },
    uniform: "cleanroom",
  },
  {
    id: "corridor-b",
    role: "Materials Handler",
    activity: "Delivering pallets to prep area",
    position: [-8, 0, 4],
    patrol: { to: [32, 0, 0], speed: 0.32 },
    uniform: "warehouse",
  },
  {
    id: "corridor-c",
    role: "QA Inspector",
    activity: "Walking to packaging line audit",
    position: [12, 0, 4],
    patrol: { to: [0, 0, -20], speed: 0.25 },
    uniform: "lab",
  },
];

export const CorridorPatrolWorkers = memo(function CorridorPatrolWorkers() {
  return (
    <group name="corridor-patrol">
      {CORRIDOR_PATROLS.map((worker) => (
        <FactoryWorker key={worker.id} worker={worker} areaSize={[120, 8]} />
      ))}
    </group>
  );
});
