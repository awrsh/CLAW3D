"use client";

import { memo } from "react";
import { CentrifugalPumpProxy } from "@/components/factory/equipment/Pump";
import {
  CardboardBox,
  CableTray,
  CeilingLight,
  ClutterGrid,
  DrumBarrel,
  FloorArrow,
  MaterialBin,
  PalletStack,
  ProcessPanel,
  StainlessTable,
  ToolCart,
  ZoneSign,
} from "@/components/factory/equipment/ClutterKit";
import { PipeFlange, SamplePort } from "@/components/factory/equipment/PipeFittings";
import { PipeSegment, Valve } from "@/components/factory/equipment/shared";
import { ChromatographyColumnProxy } from "@/components/factory/equipment/FiltrationSkid";
import { VialRackProxy } from "@/components/factory/equipment/WarehouseRacking";
import { IndustrialTankProxy, IbcTankProxy } from "@/components/factory/equipment/Tank";
import { GlasswareSetProxy } from "@/components/factory/equipment/WarehouseRacking";
import { useFactory } from "@/components/factory/context/FactoryContext";
import { resolveMachineStatus } from "@/components/factory/simulation/EquipmentState";
import type { FactoryAreaId } from "@/components/factory/simulation/ProductionState";

function useAreaBusy(areaId: FactoryAreaId) {
  const { state } = useFactory();
  const status = resolveMachineStatus(areaId, state.productionStage, state.isSimulating);
  return status === "active" || status === "processing" || status === "preparing";
}

export const FactoryDensity = memo(function FactoryDensity() {
  return (
    <group name="factory-density">
      <CorridorDensity />
      <RawMaterialsDensity />
      <WeighingDensity />
      <PreparationDensity />
      <UpstreamDensity />
      <DownstreamDensity />
      <PurificationDensity />
      <FormulationDensity />
      <FillingDensity />
      <QCDensity />
      <PackagingDensity />
      <FinishedGoodsDensity />
      <UtilitiesDensity />
      <RnDDensity />
      <ManagerOfficeDensity />
      <QAOfficeDensity />
      <OverheadInfrastructure />
    </group>
  );
});

function CorridorDensity() {
  return (
    <group>
      {[-40, -24, -8, 8, 24, 40].map((x) => (
        <ToolCart key={x} position={[x, 0, 5.5]} rotation={x * 0.02} />
      ))}
      {[-32, 0, 32].map((x) => (
        <FloorArrow key={`a-${x}`} position={[x, 0.025, 4]} rotation={Math.PI} />
      ))}
      <ZoneSign position={[0, 2.4, 6]} />
      <ZoneSign position={[-48, 2.2, 5]} color="#2563eb" />
      <ZoneSign position={[48, 2.2, 5]} color="#0d9488" />
      <MaterialBin position={[-12, 0, 4.5]} />
      <MaterialBin position={[12, 0, 4.2]} />
      <PalletStack position={[-56, 0, 5]} layers={1} />
    </group>
  );
}

function RawMaterialsDensity() {
  const busy = useAreaBusy("raw-materials");
  return (
    <group position={[-48, 0, 0]}>
      <ClutterGrid origin={[-5, 0, -4]} cols={3} rows={2} type="box" />
      <ClutterGrid origin={[2, 0, -5]} cols={2} rows={3} type="drum" />
      <PalletStack position={[5, 0, 4]} layers={3} />
      <PalletStack position={[-6, 0, 5]} layers={2} />
      <IbcTankProxy position={[-2, 0, -2]} scale={0.85} active={busy} />
      <IbcTankProxy position={[4, 0, 0]} scale={0.9} active={busy} />
      <DrumBarrel position={[1, 0, 4]} />
      <DrumBarrel position={[-4, 0, 1]} />
      <ToolCart position={[6, 0, -1]} rotation={0.5} />
      <ProcessPanel position={[-6, 0, -5]} active={busy} />
    </group>
  );
}

function WeighingDensity() {
  const busy = useAreaBusy("weighing");
  return (
    <group position={[-32, 0, 0]}>
      <StainlessTable position={[-3, 0, 2]} w={1.2} />
      <StainlessTable position={[3, 0, -2]} w={1} />
      <ClutterGrid origin={[-4, 0.85, -1]} cols={3} rows={1} type="bin" spacing={0.5} />
      <VialRackProxy position={[-2, 0.45, -3]} />
      <VialRackProxy position={[4, 0.45, 1]} count={8} />
      <MaterialBin position={[5, 0, -3]} color="#e2e8f0" />
      <ProcessPanel position={[-5, 0, 3]} active={busy} />
    </group>
  );
}

function PreparationDensity() {
  const busy = useAreaBusy("preparation");
  return (
    <group position={[-16, 0, 0]}>
      <IndustrialTankProxy position={[-4, 0, -3]} scale={0.75} active={busy} />
      <CentrifugalPumpProxy position={[-1, 0, -3]} active={busy} />
      <CentrifugalPumpProxy position={[4, 0, -2]} active={busy} />
      <CentrifugalPumpProxy position={[1, 0, 3]} active={busy} />
      <StainlessTable position={[4, 0, 3]} />
      <ClutterGrid origin={[-5, 0, 2]} cols={2} rows={2} type="bin" />
      <PipeSegment from={[-3, 1.5, 0]} to={[3, 1.5, 0]} radius={0.04} />
      <Valve position={[0, 1.5, 0]} />
      <ProcessPanel position={[-5, 0, -4]} active={busy} />
      <ProcessPanel position={[5, 0, 0]} active={busy} />
    </group>
  );
}

function UpstreamDensity() {
  const busy = useAreaBusy("bioreactor");
  return (
    <group position={[0, 0, 0]}>
      <CentrifugalPumpProxy position={[-6, 0, 2]} active={busy} />
      <CentrifugalPumpProxy position={[6, 0, 3]} active={busy} />
      <CentrifugalPumpProxy position={[0, 0, -4]} active={busy} />
      <IndustrialTankProxy position={[-6, 0, -1]} scale={0.6} active={busy} />
      <IndustrialTankProxy position={[6, 0, -2]} scale={0.65} active={busy} />
      <ProcessPanel position={[-4, 0, 4]} active={busy} />
      <ProcessPanel position={[4, 0, 4]} active={busy} />
      <ProcessPanel position={[0, 0, -5]} active={busy} />
      <PipeSegment from={[-4, 2.8, 0]} to={[4, 2.8, 0]} radius={0.05} />
      <PipeSegment from={[0, 2.8, 0]} to={[0, 2.8, -3]} radius={0.04} />
      <Valve position={[-2, 2.8, 0]} />
      <Valve position={[2, 2.8, 0]} />
      <StainlessTable position={[-5, 0, 3]} w={1} />
      <ToolCart position={[5, 0, -4]} />
    </group>
  );
}

function DownstreamDensity() {
  const busy = useAreaBusy("downstream");
  return (
    <group position={[16, 0, 0]}>
      <IndustrialTankProxy position={[4, 0, -3]} scale={0.8} active={busy} />
      <IndustrialTankProxy position={[-4, 0, 3]} scale={0.7} active={busy} />
      <CentrifugalPumpProxy position={[-2, 0, -3]} active={busy} />
      <CentrifugalPumpProxy position={[2, 0, 3]} active={busy} />
      <PipeSegment from={[-3, 2, 0]} to={[3, 2, 0]} />
      <PipeSegment from={[0, 2, 0]} to={[0, 2, 2.5]} radius={0.04} />
      <ProcessPanel position={[5, 0, 1]} active={busy} />
      <MaterialBin position={[-5, 0, -2]} />
      <DrumBarrel position={[5, 0, -2]} />
    </group>
  );
}

function PurificationDensity() {
  const busy = useAreaBusy("purification");
  return (
    <group position={[32, 0, 0]}>
      <ChromatographyColumnProxy position={[-2, 0, -2]} active={busy} />
      <ChromatographyColumnProxy position={[2, 0, -2]} active={busy} />
      <IndustrialTankProxy position={[4, 0, 2]} scale={0.75} active={busy} />
      <CentrifugalPumpProxy position={[-4, 0, 2]} active={busy} />
      <CentrifugalPumpProxy position={[0, 0, 3]} active={busy} />
      <StainlessTable position={[-3, 0, 3]} />
      <VialRackProxy position={[3, 0.45, 3]} count={12} />
      <PipeSegment from={[-2, 1.8, 0]} to={[2, 1.8, 0]} radius={0.035} />
      <ProcessPanel position={[0, 0, -4]} active={busy} />
    </group>
  );
}

function FormulationDensity() {
  const busy = useAreaBusy("formulation");
  return (
    <group position={[48, 0, 0]}>
      <IndustrialTankProxy position={[-3, 0, -2]} scale={0.85} active={busy} />
      <IndustrialTankProxy position={[3, 0, 2]} scale={0.8} active={busy} />
      <CentrifugalPumpProxy position={[-2, 0, 3]} active={busy} />
      <CentrifugalPumpProxy position={[2, 0, -3]} active={busy} />
      <ClutterGrid origin={[-4, 0, 0]} cols={2} rows={2} type="bin" />
      <ProcessPanel position={[0, 0, 4]} active={busy} />
      <PipeSegment from={[-3, 2.2, 0]} to={[3, 2.2, 0]} />
    </group>
  );
}

function FillingDensity() {
  const busy = useAreaBusy("filling");
  return (
    <group position={[0, 0, -16]}>
      <VialRackProxy position={[-4, 0.45, 2]} count={20} />
      <VialRackProxy position={[4, 0.45, -2]} count={16} />
      <VialRackProxy position={[-2, 0.45, -4]} />
      <StainlessTable position={[-5, 0, 0]} />
      <ProcessPanel position={[5, 0, 3]} active={busy} />
      <ProcessPanel position={[-5, 0, -3]} active={busy} />
      <MaterialBin position={[3, 0, 4]} />
      <CardboardBox position={[-3, 0.22, 4]} size={[0.6, 0.45, 0.5]} />
      <ToolCart position={[6, 0, 0]} rotation={-0.3} />
    </group>
  );
}

function QCDensity() {
  const busy = useAreaBusy("quality-control");
  return (
    <group position={[16, 0, -16]}>
      <StainlessTable position={[-4, 0, 1]} w={1.6} />
      <StainlessTable position={[2, 0, 2]} w={1.4} />
      <StainlessTable position={[0, 0, -4]} w={1.2} />
      <GlasswareSetProxy position={[-3, 0.45, 2]} />
      <GlasswareSetProxy position={[-1, 0.45, 3]} />
      <GlasswareSetProxy position={[3, 0.45, 1]} />
      <GlasswareSetProxy position={[4, 0.45, -3]} />
      <VialRackProxy position={[-5, 0.45, -1]} count={16} />
      <VialRackProxy position={[5, 0.45, 0]} count={12} />
      <VialRackProxy position={[0, 0.45, 0]} />
      <ClutterGrid origin={[-2, 0.85, -2]} cols={4} rows={1} type="bin" spacing={0.45} />
      <ProcessPanel position={[5, 0, -4]} active={busy} />
      <ProcessPanel position={[-5, 0, 3]} active={busy} />
      <SamplePort position={[3, 2.2, -14]} />
      <SamplePort position={[12, 2.2, -14]} />
      <PipeFlange position={[16, 2.35, -15.5]} />
    </group>
  );
}

function PackagingDensity() {
  const busy = useAreaBusy("packaging");
  return (
    <group position={[32, 0, -16]}>
      <PalletStack position={[-4, 0, 3]} layers={3} />
      <PalletStack position={[4, 0, -3]} layers={2} />
      <ClutterGrid origin={[-3, 0, -4]} cols={4} rows={2} type="box" spacing={0.55} />
      <CardboardBox position={[3, 0.35, 3]} size={[0.55, 0.45, 0.45]} />
      <CardboardBox position={[4, 0.75, 3]} size={[0.5, 0.4, 0.4]} />
      <ToolCart position={[-5, 0, 0]} />
      <ProcessPanel position={[0, 0, 4]} active={busy} />
      <MaterialBin position={[5, 0, 1]} />
    </group>
  );
}

function FinishedGoodsDensity() {
  const busy = useAreaBusy("finished-goods");
  return (
    <group position={[48, 0, -16]}>
      <PalletStack position={[-4, 0, 2]} layers={3} />
      <PalletStack position={[2, 0, -3]} layers={3} />
      <PalletStack position={[5, 0, 2]} layers={2} />
      <ClutterGrid origin={[-2, 0, -5]} cols={3} rows={2} type="box" />
      <CardboardBox position={[0, 0.5, 0]} size={[0.7, 0.5, 0.55]} />
      <CardboardBox position={[1, 0.95, 0]} size={[0.65, 0.45, 0.5]} />
      <ToolCart position={[-6, 0, -1]} rotation={0.2} />
      <ProcessPanel position={[4, 0, -4]} active={busy} />
    </group>
  );
}

function UtilitiesDensity() {
  const busy = useAreaBusy("utilities");
  return (
    <group position={[-18, 0, -16]}>
      <CentrifugalPumpProxy position={[-4, 0, 2]} active={busy} />
      <CentrifugalPumpProxy position={[4, 0, -2]} active={busy} />
      <CentrifugalPumpProxy position={[0, 0, 3]} active={busy} />
      <IndustrialTankProxy position={[5, 0, 1]} scale={0.7} active={busy} />
      <PipeSegment from={[-4, 2.5, 0]} to={[4, 2.5, 0]} />
      <PipeSegment from={[0, 2.5, 0]} to={[0, 2.5, 3]} />
      <Valve position={[-2, 2.5, 0]} />
      <Valve position={[2, 2.5, 0]} />
      <ProcessPanel position={[-3, 0, -3]} active={busy} />
      <ProcessPanel position={[3, 0, 3]} active={busy} />
      <DrumBarrel position={[-2, 0, -2]} />
    </group>
  );
}

function RnDDensity() {
  return (
    <group position={[-18, 0, 18]} scale={0.85}>
      <StainlessTable position={[-2, 0, 3]} w={1.5} />
      <StainlessTable position={[4, 0, -3]} />
      <GlasswareSetProxy position={[-4, 0.45, 0]} />
      <GlasswareSetProxy position={[0, 0.45, 2]} />
      <GlasswareSetProxy position={[3, 0.45, 1]} />
      <VialRackProxy position={[-5, 0.45, -3]} />
      <VialRackProxy position={[6, 0.45, 0]} count={10} />
      <MaterialBin position={[1, 0, -4]} />
      <ToolCart position={[-6, 0, 1]} />
    </group>
  );
}

function ManagerOfficeDensity() {
  return (
    <group position={[-36, 0, 24]}>
      <MaterialBin position={[-4, 0, 3]} color="#e2e8f0" />
      <CardboardBox position={[4, 0.22, 2]} size={[0.4, 0.3, 0.35]} />
      <ProcessPanel position={[-4, 0, -4]} active />
      <PipeFlange position={[-36, 3.4, 22]} />
      <SamplePort position={[-36, 3.2, 20]} />
    </group>
  );
}

function QAOfficeDensity() {
  return (
    <group position={[36, 0, 24]}>
      <MaterialBin position={[-3, 0, 3]} color="#dbeafe" />
      <CardboardBox position={[3, 0.22, 2.5]} size={[0.45, 0.35, 0.38]} />
      <CardboardBox position={[3.5, 0.6, 2.5]} size={[0.4, 0.3, 0.35]} />
      <ProcessPanel position={[0, 0, -4]} active />
      <PipeFlange position={[36, 3.4, 22]} />
      <SamplePort position={[36, 3.2, 20]} />
      <SamplePort position={[34, 3.2, 20]} />
    </group>
  );
}

function OverheadInfrastructure() {
  const lights: [number, number, number][] = [
    [-48, 5.2, 0], [-32, 5.2, 0], [-16, 5.2, 0], [0, 5.2, 0],
    [16, 5.2, 0], [32, 5.2, 0], [48, 5.2, 0],
    [0, 5.2, -16], [16, 5.2, -16], [32, 5.2, -16], [48, 5.2, -16],
    [-18, 5.2, 18], [18, 5.2, 18], [0, 5.2, 24],
    [-36, 5.2, 24], [36, 5.2, 24], [-18, 5.2, -16],
  ];
  return (
    <group>
      {lights.map((pos, i) => (
        <CeilingLight key={`l-${i}`} position={pos} />
      ))}
      <CableTray from={[-55, 5.5, -20]} to={[55, 5.5, -20]} />
      <CableTray from={[-55, 5.5, 20]} to={[55, 5.5, 20]} />
      <CableTray from={[-58, 5.5, -20]} to={[-58, 5.5, 20]} />
      <CableTray from={[58, 5.5, -20]} to={[58, 5.5, 20]} />
    </group>
  );
}
