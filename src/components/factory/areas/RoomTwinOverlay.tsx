"use client";

import { Html, Text } from "@react-three/drei";
import { memo } from "react";
import { useFactory } from "@/components/factory/context/FactoryContext";
import { FACTORY_AREA_MAP, equipmentForArea } from "@/components/factory/simulation/factoryLayout";
import { getRoomTwinSnapshot } from "@/components/factory/simulation/roomTwinData";
import {
  machineStatusLabel,
  resolveMachineStatus,
} from "@/components/factory/simulation/EquipmentState";

/** In-room 3D digital twin markers — sensors + equipment tags */
export const RoomTwinOverlay = memo(function RoomTwinOverlay() {
  const { state } = useFactory();
  const roomId = state.sceneViewMode === "room" ? state.roomAreaId : null;
  if (!roomId) return null;

  const area = FACTORY_AREA_MAP[roomId];
  const [cx, , cz] = area.center;
  const [w, d] = area.size;
  const equipment = equipmentForArea(roomId);
  const twin = getRoomTwinSnapshot(
    roomId,
    state.isSimulating,
    area.workers.length,
    equipment.length,
  );

  const machineStatus = area.productionStage
    ? resolveMachineStatus(roomId, state.productionStage, state.isSimulating)
    : null;

  return (
    <group position={[cx, 0, cz]}>
      {/* Corner environmental sensors */}
      {[
        [-w / 2 + 0.8, 2.2, -d / 2 + 0.8],
        [w / 2 - 0.8, 2.2, -d / 2 + 0.8],
        [-w / 2 + 0.8, 2.2, d / 2 - 0.8],
        [w / 2 - 0.8, 2.2, d / 2 - 0.8],
      ].map((pos, i) => (
        <group key={`sensor-${i}`} position={pos as [number, number, number]}>
          <mesh>
            <boxGeometry args={[0.12, 0.08, 0.06]} />
            <meshStandardMaterial
              color="#0ea5e9"
              emissive="#0284c7"
              emissiveIntensity={state.isSimulating ? 0.45 : 0.15}
            />
          </mesh>
        </group>
      ))}

      {/* Room ID plaque */}
      <Text
        position={[0, 3.2, -d / 2 + 0.5]}
        fontSize={0.22}
        color="#0f766e"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#ffffff"
      >
        {area.shortName.toUpperCase()} — DIGITAL TWIN
      </Text>

      {machineStatus ? (
        <Text
          position={[0, 2.85, -d / 2 + 0.5]}
          fontSize={0.12}
          color={state.isSimulating ? "#16a34a" : "#64748b"}
          anchorX="center"
        >
          {machineStatusLabel(machineStatus)}
        </Text>
      ) : null}

      {/* Live twin HUD inside room */}
      <Html
        position={[w / 2 - 1.2, 2.4, 0]}
        transform
        distanceFactor={8}
        zIndexRange={[50, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div className="w-[140px] rounded-md border border-teal-500/30 bg-slate-900/88 p-2 font-mono text-[9px] text-emerald-400 shadow-lg backdrop-blur-sm">
          <div className="border-b border-emerald-900/60 pb-1 text-[8px] uppercase tracking-widest text-emerald-600">
            Live Twin Data
          </div>
          <div className="mt-1.5 space-y-0.5">
            {twin.readings.slice(0, 4).map((r) => (
              <div key={r.label} className="flex justify-between gap-1">
                <span className="text-emerald-700">{r.label}</span>
                <span>{r.value}</span>
              </div>
            ))}
          </div>
          {twin.batchId !== "—" ? (
            <div className="mt-1.5 border-t border-emerald-900/60 pt-1 text-emerald-300">
              {twin.batchId}
            </div>
          ) : null}
        </div>
      </Html>

      {/* Equipment anchor tags */}
      {equipment.slice(0, 4).map((eq, i) => {
        const angle = (i / Math.min(equipment.length, 4)) * Math.PI * 1.4 - 0.7;
        const r = Math.min(w, d) * 0.22;
        return (
          <Html
            key={eq.id}
            position={[Math.sin(angle) * r, 1.6, Math.cos(angle) * r]}
            center
            distanceFactor={10}
            zIndexRange={[45, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div className="whitespace-nowrap rounded border border-white/50 bg-white/90 px-1.5 py-0.5 text-[8px] font-medium text-slate-700 shadow-sm">
              {eq.name}
            </div>
          </Html>
        );
      })}
    </group>
  );
});
