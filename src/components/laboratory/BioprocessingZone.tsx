"use client";

import { memo, type ComponentType } from "react";
import { GlbEquipment } from "@/components/laboratory/GlbEquipment";
import { BioreactorProxy } from "@/components/laboratory/Bioreactor";
import { SingleUseMixerProxy } from "@/components/laboratory/SingleUseMixer";
import { CentrifugeProxy } from "@/components/laboratory/Centrifuge";
import { ChromatographyProxy } from "@/components/laboratory/ChromatographySystem";
import { LaboratoryCabinetProxy } from "@/components/laboratory/LaboratoryCabinet";
import { AutoclaveProxy } from "@/components/laboratory/Autoclave";
import { FumeHoodProxy } from "@/components/laboratory/FumeHood";
import { IncubatorProxy } from "@/components/laboratory/Incubator";
import { EquipmentHighlight } from "@/components/laboratory/EquipmentHighlight";
import { useLaboratory } from "@/components/laboratory/context/LaboratoryContext";
import { LAYOUT } from "@/components/laboratory/labLayout";
import { LAB_MODEL_PATHS } from "@/components/laboratory/sceneConfig";
import type { EquipmentId } from "@/components/laboratory/types";
import type { GlbProxyProps } from "@/components/laboratory/GlbEquipment";

function MainBioreactorProxy(props: GlbProxyProps) {
  return <BioreactorProxy {...props} variant="main" />;
}

function SecondaryBioreactorProxy(props: GlbProxyProps) {
  return <BioreactorProxy {...props} variant="secondary" />;
}

function EquipmentSlot({
  id,
  modelPath,
  proxy,
  position,
  rotation,
  scale,
  highlight,
}: {
  id: EquipmentId;
  modelPath: string;
  proxy: ComponentType<GlbProxyProps>;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  highlight: { w: number; h: number; d: number; y: number };
}) {
  const { hoveredId, selected, setHoveredId, selectEquipment } = useLaboratory();
  const active = hoveredId === id || selected?.id === id;

  return (
    <group position={position}>
      <EquipmentHighlight
        active={active}
        width={highlight.w}
        height={highlight.h}
        depth={highlight.d}
        y={highlight.y}
      />
      <GlbEquipment
        modelPath={modelPath}
        proxy={proxy}
        rotation={rotation}
        scale={scale}
        onPointerOver={() => setHoveredId(id)}
        onPointerOut={() => setHoveredId(null)}
        onClick={() => selectEquipment(id)}
      />
    </group>
  );
}

type BioprocessingZoneProps = {
  pipeDetail?: "full" | "simple";
};

export const BioprocessingZone = memo(function BioprocessingZone({
  pipeDetail = "full",
}: BioprocessingZoneProps) {
  return (
    <group name="zone-bioprocessing">
      <EquipmentSlot
        id="bioreactor-main"
        modelPath={LAB_MODEL_PATHS.bioreactorMain}
        proxy={MainBioreactorProxy}
        position={[...LAYOUT.bioreactorMain]}
        scale={1}
        highlight={{ w: 2.4, h: 3.2, d: 2.2, y: 1.6 }}
      />
      <EquipmentSlot
        id="bioreactor-secondary"
        modelPath={LAB_MODEL_PATHS.bioreactorSecondary}
        proxy={SecondaryBioreactorProxy}
        position={[...LAYOUT.bioreactorSecondary]}
        rotation={[0, 0.35, 0]}
        scale={0.82}
        highlight={{ w: 1.9, h: 2.6, d: 1.8, y: 1.3 }}
      />
      <EquipmentSlot
        id="single-use-mixer"
        modelPath={LAB_MODEL_PATHS.singleUseMixer}
        proxy={SingleUseMixerProxy}
        position={[...LAYOUT.singleUseMixer]}
        rotation={[0, -0.2, 0]}
        highlight={{ w: 1.1, h: 2.1, d: 0.9, y: 1.05 }}
      />
      <EquipmentSlot
        id="centrifuge"
        modelPath={LAB_MODEL_PATHS.centrifuge}
        proxy={CentrifugeProxy}
        position={[...LAYOUT.centrifuge]}
        highlight={{ w: 1.1, h: 1.0, d: 1.0, y: 0.55 }}
      />
      <EquipmentSlot
        id="chromatography"
        modelPath={LAB_MODEL_PATHS.chromatography}
        proxy={ChromatographyProxy}
        position={[...LAYOUT.chromatography]}
        rotation={[0, 0.25, 0]}
        highlight={{ w: 1.3, h: 1.2, d: 0.7, y: 0.6 }}
      />
      {pipeDetail === "full" ? (
        <group>
          <mesh position={[-12, 0.25, -1]} castShadow receiveShadow>
            <boxGeometry args={[2.4, 0.5, 1.6]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.45} metalness={0.08} />
          </mesh>
          <mesh position={[-13.5, 0.85, 0.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 4.5, 12]} />
            <meshStandardMaterial color="#b8c0c8" metalness={0.85} roughness={0.22} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
});

export const ResearchZone = memo(function ResearchZone() {
  return (
    <group name="zone-research">
      <EquipmentSlot
        id="fume-hood"
        modelPath={LAB_MODEL_PATHS.fumeHood}
        proxy={FumeHoodProxy}
        position={[...LAYOUT.fumeHood]}
        rotation={[0, -0.15, 0]}
        highlight={{ w: 1.8, h: 1.6, d: 1.1, y: 0.8 }}
      />
      <EquipmentSlot
        id="incubator"
        modelPath={LAB_MODEL_PATHS.incubator}
        proxy={IncubatorProxy}
        position={[...LAYOUT.incubator]}
        rotation={[0, -0.4, 0]}
        highlight={{ w: 1.1, h: 1.4, d: 0.9, y: 0.7 }}
      />
    </group>
  );
});

export const StorageZone = memo(function StorageZone() {
  return (
    <group name="zone-storage">
      <EquipmentSlot
        id="lab-cabinet"
        modelPath={LAB_MODEL_PATHS.labCabinet}
        proxy={LaboratoryCabinetProxy}
        position={[...LAYOUT.labCabinet]}
        highlight={{ w: 1.3, h: 2.2, d: 0.65, y: 1.05 }}
      />
      <EquipmentSlot
        id="autoclave"
        modelPath={LAB_MODEL_PATHS.autoclave}
        proxy={AutoclaveProxy}
        position={[...LAYOUT.autoclave]}
        highlight={{ w: 1.1, h: 1.3, d: 1.0, y: 0.65 }}
      />
      {/* Glass storage shelving */}
      <group position={[15.5, 0, -5.5]}>
        <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 2.1, 0.42]} />
          <meshStandardMaterial color="#e2e6ea" roughness={0.48} metalness={0.06} />
        </mesh>
        {[0.45, 1.05, 1.65].map((y) => (
          <mesh key={y} position={[0, y, 0.08]}>
            <boxGeometry args={[2.2, 0.02, 0.35]} />
            <meshStandardMaterial color="#d8dee4" metalness={0.55} roughness={0.32} />
          </mesh>
        ))}
      </group>
    </group>
  );
});
