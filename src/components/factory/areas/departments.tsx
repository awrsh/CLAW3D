"use client";

import { memo } from "react";
import { BioreactorProxy } from "@/components/laboratory/Bioreactor";
import { CentrifugeProxy } from "@/components/laboratory/Centrifuge";
import { ChromatographyProxy } from "@/components/laboratory/ChromatographySystem";
import { LaboratoryCabinetProxy } from "@/components/laboratory/LaboratoryCabinet";
import { MicroscopeProxy } from "@/components/laboratory/Microscope";
import { SingleUseMixerProxy } from "@/components/laboratory/SingleUseMixer";
import { FACTORY_ASSET_MAP } from "@/components/factory/assets/factoryAssets";
import { FactoryGlbEquipment } from "@/components/factory/equipment/FactoryGlbEquipment";
import { FiltrationSkidProxy } from "@/components/factory/equipment/FiltrationSkid";
import { FillingMachineProxy } from "@/components/factory/equipment/FillingMachine";
import { CentrifugalPumpProxy } from "@/components/factory/equipment/Pump";
import {
  ChemicalTankProxy,
  IbcTankProxy,
  IndustrialTankProxy,
  IsoTankProxy,
  PrepTankProxy,
  StainlessTankProxy,
} from "@/components/factory/equipment/Tank";
import { UtilitiesSkidProxy, WeighingStationProxy } from "@/components/factory/equipment/UtilitiesSkid";
import {
  GlasswareSetProxy,
  PackagingLineProxy,
  VialRackProxy,
  WarehouseRackingProxy,
} from "@/components/factory/equipment/WarehouseRacking";
import { ControlScreen, StatusLed } from "@/components/factory/equipment/shared";
import { useDepartmentActive } from "@/components/factory/areas/useDepartmentActive";

function pick(id: string) {
  return FACTORY_ASSET_MAP[id];
}

export const RawMaterialsArea = memo(function RawMaterialsArea() {
  const { active, selectEquipment } = useDepartmentActive("raw-materials");
  const click = (id: string) => () => selectEquipment(id);
  return (
    <group position={[-48, 0, 0]}>
      <WarehouseRackingProxy position={[-3, 0, -2]} bays={3} />
      <FactoryGlbEquipment
        modelPath={pick("ibc-01").path}
        proxy={IbcTankProxy}
        position={[-4, 0, 3]}
        active={active}
        onClick={click("ibc-01")}
      />
      <FactoryGlbEquipment
        modelPath={pick("ibc-01").path}
        proxy={IbcTankProxy}
        position={[3, 0, 2]}
        scale={0.95}
        active={active}
        onClick={click("ibc-01")}
      />
      <FactoryGlbEquipment
        modelPath={pick("iso-tank-01").path}
        proxy={IsoTankProxy}
        position={[5, 0, -3]}
        onClick={click("iso-tank-01")}
      />
      <FactoryGlbEquipment
        modelPath={pick("chemical-tank-01").path}
        proxy={ChemicalTankProxy}
        position={[-1, 0, 0]}
        active={active}
        onClick={click("chemical-tank-01")}
      />
      <StatusLed position={[-6, 2.5, 5]} active={active} />
    </group>
  );
});

export const WeighingArea = memo(function WeighingArea() {
  const { active, selectEquipment } = useDepartmentActive("weighing");
  return (
    <group position={[-32, 0, 0]}>
      <WeighingStationProxy
        position={[0, 0, 0]}
        active={active}
        onClick={() => selectEquipment("weigh-station-01")}
      />
      <VialRackProxy position={[3, 0.45, -2]} />
      <StatusLed position={[4, 1.5, 2]} active={active} />
    </group>
  );
});

export const PreparationArea = memo(function PreparationArea() {
  const { active, selectEquipment } = useDepartmentActive("preparation");
  return (
    <group position={[-16, 0, 0]}>
      <FactoryGlbEquipment
        modelPath={pick("mixer-01").path}
        proxy={SingleUseMixerProxy}
        proxyProps={{ scale: 1.1 }}
        position={[-3, 0, 0]}
        active={active}
        onClick={() => selectEquipment("mixer-01")}
      />
      <FactoryGlbEquipment
        modelPath={pick("prep-tank-01").path}
        proxy={PrepTankProxy}
        position={[2.5, 0, 0]}
        active={active}
        onClick={() => selectEquipment("prep-tank-01")}
      />
      <CentrifugalPumpProxy position={[0.5, 0, 2.5]} active={active} />
      <ControlScreen position={[0, 2, -3]} active={active} />
      <StatusLed position={[4, 2.2, 2]} active={active} />
    </group>
  );
});

export const UpstreamArea = memo(function UpstreamArea() {
  const { active, selectEquipment } = useDepartmentActive("bioreactor");
  return (
    <group position={[0, 0, 0]}>
      <FactoryGlbEquipment
        modelPath={pick("bioreactor-01").path}
        proxy={BioreactorProxy}
        proxyProps={{ variant: "main", scale: 1.15 }}
        position={[-3.5, 0, 0]}
        active={active}
        onClick={() => selectEquipment("bioreactor-01")}
      />
      <FactoryGlbEquipment
        modelPath={pick("bioreactor-02").path}
        proxy={BioreactorProxy}
        proxyProps={{ variant: "secondary", scale: 1.05 }}
        position={[3.5, 0, 1]}
        active={active}
        onClick={() => selectEquipment("bioreactor-02")}
      />
      <CentrifugalPumpProxy position={[-5.5, 0, -3]} active={active} />
      <CentrifugalPumpProxy position={[5.5, 0, -3]} active={active} />
      <ControlScreen position={[0, 2.5, -4]} active={active} />
      <StatusLed position={[-5, 3, 4]} active={active} />
      <StatusLed position={[5, 3, 4]} active={active} />
    </group>
  );
});

export const DownstreamArea = memo(function DownstreamArea() {
  const { active, selectEquipment } = useDepartmentActive("downstream");
  return (
    <group position={[16, 0, 0]}>
      <FactoryGlbEquipment
        modelPath={pick("filtration-skid-01").path}
        proxy={FiltrationSkidProxy}
        position={[0, 0, 0]}
        active={active}
        onClick={() => selectEquipment("filtration-skid-01")}
      />
      <FactoryGlbEquipment
        modelPath={pick("industrial-tank-01").path}
        proxy={IndustrialTankProxy}
        position={[-3.5, 0, -2]}
        active={active}
        onClick={() => selectEquipment("industrial-tank-01")}
      />
      <FactoryGlbEquipment
        modelPath={pick("pump-main-01").path}
        proxy={CentrifugalPumpProxy}
        position={[3, 0, 2]}
        active={active}
        onClick={() => selectEquipment("pump-main-01")}
      />
      <ControlScreen position={[0, 2.2, -3]} active={active} />
      <StatusLed position={[4, 2.5, 3]} active={active} />
    </group>
  );
});

export const PurificationArea = memo(function PurificationArea() {
  const { active, selectEquipment } = useDepartmentActive("purification");
  return (
    <group position={[32, 0, 0]}>
      <FactoryGlbEquipment
        modelPath={pick("hplc-01").path}
        proxy={ChromatographyProxy}
        proxyProps={{ scale: 1.1 }}
        position={[0, 0, 0]}
        active={active}
        onClick={() => selectEquipment("hplc-01")}
      />
      <IndustrialTankProxy position={[-3.5, 0, 2]} scale={0.9} active={active} />
      <ControlScreen position={[2, 2, -3]} active={active} />
      <StatusLed position={[4, 2.5, 3]} active={active} />
    </group>
  );
});

export const FormulationArea = memo(function FormulationArea() {
  const { active, selectEquipment } = useDepartmentActive("formulation");
  return (
    <group position={[48, 0, 0]}>
      <FactoryGlbEquipment
        modelPath={pick("form-tank-01").path}
        proxy={StainlessTankProxy}
        position={[0, 0, 0]}
        active={active}
        onClick={() => selectEquipment("form-tank-01")}
      />
      <CentrifugalPumpProxy position={[-3, 0, 2]} active={active} />
      <StatusLed position={[3, 2, 2]} active={active} />
    </group>
  );
});

export const FillingArea = memo(function FillingArea() {
  const { active, selectEquipment } = useDepartmentActive("filling");
  return (
    <group position={[0, 0, -16]}>
      <FactoryGlbEquipment
        modelPath={pick("filler-01").path}
        proxy={FillingMachineProxy}
        position={[0, 0, 0]}
        active={active}
        onClick={() => selectEquipment("filler-01")}
      />
      <VialRackProxy position={[4, 0, -3]} count={16} />
      <StatusLed position={[-4, 2.5, 3]} active={active} />
    </group>
  );
});

export const QualityControlArea = memo(function QualityControlArea() {
  const { active, selectEquipment } = useDepartmentActive("quality-control");
  return (
    <group position={[16, 0, -16]}>
      <FactoryGlbEquipment
        modelPath={pick("microscope-01").path}
        proxy={MicroscopeProxy}
        proxyProps={{ scale: 0.95 }}
        position={[-3, 0, 0]}
        onClick={() => selectEquipment("microscope-01")}
      />
      <MicroscopeProxy position={[1, 0, 2]} scale={0.85} />
      <MicroscopeProxy position={[3.5, 0, -1]} scale={0.8} />
      <FactoryGlbEquipment
        modelPath={pick("centrifuge-01").path}
        proxy={CentrifugeProxy}
        position={[-1, 0, 3]}
        onClick={() => selectEquipment("centrifuge-01")}
      />
      <LaboratoryCabinetProxy position={[4, 0, -2]} />
      <LaboratoryCabinetProxy position={[-5, 0, -2]} />
      <GlasswareSetProxy position={[0, 0.45, 1.5]} />
      <GlasswareSetProxy position={[2, 0.45, 0]} />
      <VialRackProxy position={[-2, 0.45, -3]} count={20} />
      <VialRackProxy position={[2, 0.45, -3]} />
      <ControlScreen position={[0, 1.8, -3]} active={active} />
    </group>
  );
});

export const PackagingArea = memo(function PackagingArea() {
  const { active, selectEquipment } = useDepartmentActive("packaging");
  return (
    <group position={[32, 0, -16]}>
      <FactoryGlbEquipment
        modelPath={null}
        proxy={PackagingLineProxy}
        proxyProps={{ active }}
        onClick={() => selectEquipment("pack-line-01")}
      />
      <StatusLed position={[4, 2, 3]} active={active} />
    </group>
  );
});

export const FinishedGoodsArea = memo(function FinishedGoodsArea() {
  const { active } = useDepartmentActive("finished-goods");
  return (
    <group position={[48, 0, -16]}>
      <WarehouseRackingProxy position={[0, 0, 0]} bays={3} withPallets />
      <StatusLed position={[-5, 2.5, 4]} active={active} />
    </group>
  );
});

export const UtilitiesArea = memo(function UtilitiesArea() {
  const { active, selectEquipment } = useDepartmentActive("utilities");
  return (
    <group position={[-18, 0, -16]}>
      <FactoryGlbEquipment
        modelPath={pick("ro-uv-01").path}
        proxy={UtilitiesSkidProxy}
        position={[0, 0, 0]}
        active={active}
        onClick={() => selectEquipment("ro-uv-01")}
      />
    </group>
  );
});

export const RnDArea = memo(function RnDArea() {
  const { selectEquipment } = useDepartmentActive("rnd");
  return (
    <group position={[-18, 0, 18]} scale={0.85}>
      <BioreactorProxy
        variant="secondary"
        position={[-4, 0, -2]}
        onClick={() => selectEquipment("bioreactor-02")}
      />
      <SingleUseMixerProxy position={[2, 0, -1]} scale={0.9} />
      <MicroscopeProxy position={[5, 0, 2]} scale={0.85} />
      <LaboratoryCabinetProxy position={[-6, 0, 3]} />
      <GlasswareSetProxy position={[0, 0.45, 1]} />
      <ControlScreen position={[0, 1.8, -5]} active />
    </group>
  );
});

export const EntranceArea = memo(function EntranceArea() {
  return (
    <group position={[0, 0, 24]}>
      <mesh position={[0, 0.5, 3]} castShadow receiveShadow>
        <boxGeometry args={[4, 1, 0.8]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.2, -2]} castShadow>
        <boxGeometry args={[6, 2.4, 0.15]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>
      <ControlScreen position={[3, 1.8, -3.5]} active />
    </group>
  );
});

export const ControlRoomArea = memo(function ControlRoomArea() {
  const { isSimulating } = useDepartmentActive("control-room");
  const screens: [number, number, number][] = [
    [-4, 1.8, -2],
    [-1.5, 1.8, -2],
    [1.5, 1.8, -2],
    [4, 1.8, -2],
    [0, 2.2, -3.5],
  ];
  return (
    <group position={[18, 0, 18]}>
      <mesh position={[0, 0.4, 1]} castShadow>
        <boxGeometry args={[6, 0.8, 1.4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
      <mesh position={[-4, 0.4, 2.5]} castShadow>
        <boxGeometry args={[1.8, 0.8, 0.7]} />
        <meshStandardMaterial color="#334155" roughness={0.72} />
      </mesh>
      <mesh position={[4, 0.4, 2.5]} castShadow>
        <boxGeometry args={[1.8, 0.8, 0.7]} />
        <meshStandardMaterial color="#334155" roughness={0.72} />
      </mesh>
      {screens.map((pos, i) => (
        <ControlScreen key={i} position={pos} active={isSimulating} />
      ))}
    </group>
  );
});
