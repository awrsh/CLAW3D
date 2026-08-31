"use client";

import { memo } from "react";
import { FACTORY_AREAS, FACTORY_DIMENSIONS } from "@/components/factory/simulation/factoryLayout";

const CEILING_Y = FACTORY_DIMENSIONS.height - 0.35;

export const FluorescentStrip = memo(function FluorescentStrip({
  position,
  length = 1.4,
  rotation = 0,
}: {
  position: [number, number, number];
  length?: number;
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh>
        <boxGeometry args={[length, 0.08, 0.28]} />
        <meshStandardMaterial color="#f1f5f9" emissive="#ffffff" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[length - 0.1, 0.02, 0.22]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#bae6fd" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
});

export const EmergencyLight = memo(function EmergencyLight({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.22, 0.1, 0.12]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
});

export const WallSconce = memo(function WallSconce({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh>
        <boxGeometry args={[0.15, 0.25, 0.1]} />
        <meshStandardMaterial color="#cbd5e1" emissive="#fef9c3" emissiveIntensity={0.15} roughness={0.6} />
      </mesh>
    </group>
  );
});

function RoomLightGrid({
  center,
  size,
  cols,
}: {
  center: [number, number, number];
  size: [number, number];
  cols: number;
}) {
  const [cx, , cz] = center;
  const [w, d] = size;
  const rows = 1;
  const lights = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = cx - w / 2 + (w / (cols + 1)) * (c + 1);
      const z = cz - d / 2 + (d / (rows + 1)) * (r + 1);
      lights.push(
        <FluorescentStrip key={`${r}-${c}`} position={[x, CEILING_Y, z]} length={Math.min(w / cols, 1.6)} />,
      );
    }
  }
  return <group>{lights}</group>;
}

/** Emissive fixtures only — zero extra light/shadow render passes. */
export const FactoryRoomLighting = memo(function FactoryRoomLighting() {
  const productionAreas = FACTORY_AREAS.filter((a) =>
    [
      "raw-materials", "weighing", "preparation", "bioreactor", "downstream",
      "purification", "formulation", "filling", "quality-control", "packaging",
      "finished-goods", "utilities",
    ].includes(a.id),
  );
  const officeAreas = FACTORY_AREAS.filter((a) =>
    ["entrance", "rnd", "control-room", "manager-office", "qa-office"].includes(a.id),
  );

  return (
    <group name="factory-room-lighting">
      {productionAreas.map((area) => (
        <RoomLightGrid key={area.id} center={area.center} size={area.size} cols={2} />
      ))}

      {officeAreas.map((area) => {
        const [cx, , cz] = area.center;
        const [w, d] = area.size;
        return (
          <group key={area.id}>
            <RoomLightGrid center={area.center} size={area.size} cols={2} />
            <EmergencyLight position={[cx - w / 2 + 0.8, CEILING_Y - 0.2, cz + d / 2 - 0.6]} />
            <EmergencyLight position={[cx + w / 2 - 0.8, CEILING_Y - 0.2, cz + d / 2 - 0.6]} />
          </group>
        );
      })}

      {Array.from({ length: 14 }).map((_, i) => (
        <FluorescentStrip key={`cor-${i}`} position={[-52 + i * 8, CEILING_Y, 0]} length={2.2} />
      ))}

      <FluorescentStrip position={[14, CEILING_Y, -16]} length={2.4} />
      <FluorescentStrip position={[18, CEILING_Y, -16]} length={2.4} />
    </group>
  );
});
