"use client";

import { memo } from "react";
import { FactoryWorker } from "@/components/factory/areas/FactoryWorker";
import { useFactory } from "@/components/factory/context/FactoryContext";
import { FACTORY_AREA_MAP } from "@/components/factory/simulation/factoryLayout";

/** Workers visible inside 3D Room mode — clickable for task dialog. */
export const RoomAreaWorkers = memo(function RoomAreaWorkers() {
  const { state, selectWorker } = useFactory();
  const roomId = state.sceneViewMode === "room" ? state.roomAreaId : null;
  if (!roomId) return null;

  const area = FACTORY_AREA_MAP[roomId];

  return (
    <group position={area.center}>
      {area.workers.map((worker) => (
        <FactoryWorker
          key={worker.id}
          worker={worker}
          areaSize={area.size}
          areaId={roomId}
          showActivity={false}
          clickable
          selected={state.selectedWorkerId === worker.id}
          onSelect={() => selectWorker(worker.id)}
        />
      ))}
    </group>
  );
});
