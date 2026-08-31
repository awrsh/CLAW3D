"use client";

import { memo } from "react";
import { LAB_COLORS } from "@/components/laboratory/sceneConfig";
import { GlbEquipment } from "@/components/laboratory/GlbEquipment";
import { MicroscopeProxy } from "@/components/laboratory/Microscope";
import { LAB_MODEL_PATHS } from "@/components/laboratory/sceneConfig";
import { useLaboratory } from "@/components/laboratory/context/LaboratoryContext";
import { EquipmentHighlight } from "@/components/laboratory/EquipmentHighlight";

type LaboratoryWorkstationProps = {
  position?: [number, number, number];
};

function Vial({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.018, 0.018, 0.09, 10]} />
        <meshPhysicalMaterial color={color} transmission={0.4} transparent opacity={0.9} roughness={0.08} />
      </mesh>
      <mesh position={[0, 0.055, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.015, 10]} />
        <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

export const LaboratoryWorkstation = memo(function LaboratoryWorkstation({
  position = [11, 0, 7],
}: LaboratoryWorkstationProps) {
  const { hoveredId, selected, setHoveredId, selectEquipment } = useLaboratory();
  const id = "microscope" as const;
  const active = hoveredId === id || selected?.id === id;

  return (
    <group position={position}>
      {/* Premium bench */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.08, 0.95]} />
        <meshStandardMaterial color={LAB_COLORS.workstation} metalness={0.12} roughness={0.38} />
      </mesh>
      {[-1.05, 1.05].map((x) => (
        <mesh key={x} position={[x, 0.21, 0]} castShadow>
          <boxGeometry args={[0.08, 0.42, 0.75]} />
          <meshStandardMaterial color={LAB_COLORS.steelBright} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Back splash */}
      <mesh position={[0, 0.72, -0.42]} castShadow>
        <boxGeometry args={[2.35, 0.55, 0.04]} />
        <meshStandardMaterial color="#ffffff" metalness={0.05} roughness={0.5} />
      </mesh>

      {/* Digital display */}
      <group position={[0.75, 0.62, -0.38]}>
        <mesh>
          <boxGeometry args={[0.42, 0.28, 0.03]} />
          <meshStandardMaterial color={LAB_COLORS.graphite} metalness={0.35} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[0.36, 0.22]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
      </group>

      {/* Pipette stand */}
      <mesh position={[-0.55, 0.52, 0.15]}>
        <cylinderGeometry args={[0.06, 0.08, 0.02, 12]} />
        <meshStandardMaterial color={LAB_COLORS.steel} metalness={0.75} roughness={0.28} />
      </mesh>
      {[0, 0.08, -0.08].map((ox, i) => (
        <mesh key={i} position={[-0.55 + ox, 0.58, 0.15]} rotation={[0, 0, 0.08]}>
          <cylinderGeometry args={[0.008, 0.008, 0.22, 6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}

      {/* Sample tubes rack */}
      <group position={[-0.85, 0.48, -0.1]}>
        <mesh>
          <boxGeometry args={[0.35, 0.04, 0.12]} />
          <meshStandardMaterial color={LAB_COLORS.steelBright} metalness={0.65} roughness={0.32} />
        </mesh>
        {[-0.1, 0, 0.1].map((x) => (
          <mesh key={x} position={[x, 0.08, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.4} />
          </mesh>
        ))}
      </group>

      <Vial position={[-0.2, 0.5, 0.28]} color="#bfdbfe" />
      <Vial position={[0.15, 0.5, 0.32]} color="#bbf7d0" />
      <Vial position={[0.35, 0.5, 0.22]} color="#fde68a" />

      {/* Petri dish */}
      <mesh position={[0.45, 0.47, 0.05]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.015, 20]} />
        <meshPhysicalMaterial color="#f1f5f9" transmission={0.25} transparent opacity={0.95} />
      </mesh>

      <EquipmentHighlight active={active} width={1.2} height={1.1} depth={0.9} y={0.55} />

      <GlbEquipment
        modelPath={LAB_MODEL_PATHS.microscope}
        proxy={MicroscopeProxy}
        position={[0.05, 0.46, 0.05]}
        rotation={[0, -0.35, 0]}
        scale={1.15}
        onPointerOver={() => setHoveredId(id)}
        onPointerOut={() => setHoveredId(null)}
        onClick={() => selectEquipment(id)}
      />
    </group>
  );
});
