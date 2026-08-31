"use client";

import { Html } from "@react-three/drei";
import { memo } from "react";
import type { AreaWorker, FactoryAreaId } from "@/components/factory/simulation/ProductionState";
import { FACTORY_AREAS } from "@/components/factory/simulation/factoryLayout";
import { useFactory } from "@/components/factory/context/FactoryContext";
import { FactoryWorker } from "@/components/factory/areas/FactoryWorker";

function AreaRoomMarker({
  areaId,
  name,
  purpose,
  center,
  size,
  workers,
}: {
  areaId: FactoryAreaId;
  name: string;
  purpose: string;
  center: [number, number, number];
  size: [number, number];
  workers: AreaWorker[];
}) {
  const { selectArea, state } = useFactory();
  const [w, d] = size;
  const isActive =
    state.selectedAreaId === areaId ||
    state.activeAreaId === areaId;

  return (
    <group position={center}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.03, 0]}
        onClick={(e) => {
          e.stopPropagation();
          selectArea(areaId);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <planeGeometry args={[w - 0.8, d - 0.8]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={isActive ? 0.12 : 0}
          depthWrite={false}
        />
      </mesh>

      {workers.map((worker) => (
        <FactoryWorker
          key={worker.id}
          worker={worker}
          showActivity
          areaSize={size}
          areaId={areaId}
        />
      ))}

      <Html
        position={[0, 3.4, 0]}
        center
        distanceFactor={14}
        eps={0.85}
        zIndexRange={[40, 0]}
        style={{ pointerEvents: "auto" }}
        transform={false}
      >
        <button
          type="button"
          onClick={() => selectArea(areaId)}
          className={`w-[max(130px,min(180px,16vw))] rounded-lg border px-2.5 py-2 text-left shadow-md backdrop-blur-sm transition ${
            isActive
              ? "border-teal-500/60 bg-white/95 ring-1 ring-teal-400/40"
              : "border-white/70 bg-white/88 hover:bg-white/95"
          }`}
        >
          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-teal-700">
            {name}
          </div>
          <div className="mt-0.5 text-[10px] leading-snug text-slate-600">{purpose}</div>
          {workers.length > 0 ? (
            <div className="mt-1 text-[9px] text-slate-400">
              {workers.length} personnel on duty
            </div>
          ) : null}
        </button>
      </Html>
    </group>
  );
}

export const AreaMarkers = memo(function AreaMarkers() {
  return (
    <group>
      {FACTORY_AREAS.map((area) => (
        <AreaRoomMarker
          key={area.id}
          areaId={area.id}
          name={area.shortName}
          purpose={area.purpose}
          center={area.center}
          size={area.size}
          workers={area.workers}
        />
      ))}
    </group>
  );
});
