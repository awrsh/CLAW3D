"use client";

import { memo } from "react";
import type { FactoryAreaId } from "@/components/factory/simulation/ProductionState";
import { FACTORY_AREA_MAP, FACTORY_COLORS } from "@/components/factory/simulation/factoryLayout";
import { useFactory } from "@/components/factory/context/FactoryContext";
import {
  ControlRoomArea,
  DownstreamArea,
  EntranceArea,
  FillingArea,
  FinishedGoodsArea,
  FormulationArea,
  PackagingArea,
  PreparationArea,
  PurificationArea,
  QualityControlArea,
  RawMaterialsArea,
  RnDArea,
  UpstreamArea,
  UtilitiesArea,
  WeighingArea,
} from "@/components/factory/areas/departments";
import {
  ManagerOfficeArea,
  QAOfficeArea,
  QCReviewAnnex,
} from "@/components/factory/areas/OfficeRooms";

export const AreaHighlight = memo(function AreaHighlight({
  areaId,
}: {
  areaId: FactoryAreaId;
}) {
  const { state } = useFactory();
  const isActive =
    state.activeAreaId === areaId || state.selectedAreaId === areaId;
  if (!isActive) return null;

  const area = FACTORY_AREA_MAP[areaId];
  const [w, d] = area.size;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[area.center[0], 0.025, area.center[2]]}
    >
      <planeGeometry args={[w - 0.6, d - 0.6]} />
      <meshBasicMaterial
        color={FACTORY_COLORS.zoneHighlight}
        transparent
        opacity={0.22}
        depthWrite={false}
      />
    </mesh>
  );
});

const AllAreaHighlights = memo(function AllAreaHighlights() {
  const { state } = useFactory();
  const id = state.activeAreaId ?? state.selectedAreaId;
  if (!id) return null;
  return <AreaHighlight areaId={id} />;
});

export const FactoryAreas = memo(function FactoryAreas() {
  return (
    <group name="factory-departments">
      <EntranceArea />
      <ManagerOfficeArea />
      <QAOfficeArea />
      <RnDArea />
      <ControlRoomArea />
      <QCReviewAnnex />
      <RawMaterialsArea />
      <WeighingArea />
      <PreparationArea />
      <UpstreamArea />
      <DownstreamArea />
      <PurificationArea />
      <FormulationArea />
      <FillingArea />
      <QualityControlArea />
      <PackagingArea />
      <FinishedGoodsArea />
      <UtilitiesArea />
      <AllAreaHighlights />
    </group>
  );
});
