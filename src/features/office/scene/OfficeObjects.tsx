"use client";

import { memo } from "react";
import {
  getObjectWorldSize,
  isWallType,
  type ObjectType,
  type PlacedObject,
} from "@/features/office/core/objects";
import type { FurnitureItem } from "@/features/office/legacy/shim";
import { SCALE } from "@/features/office/legacy/shim";
import { JukeboxModel } from "@/features/office/legacy/objects/Jukebox";
import {
  DishwasherModel,
  MicrowaveModel,
  SinkModel,
  StoveModel,
  VendingMachineModel,
  WallCabinetModel,
} from "@/features/office/legacy/objects/kitchen";
import {
  AtmMachineModel,
  DeviceRackModel,
  DumbbellRackModel,
  EaselModel,
  ExerciseBikeModel,
  KettlebellRackModel,
  PhoneBoothModel,
  PingPongTableModel,
  PunchingBagModel,
  QaTerminalModel,
  RowingMachineModel,
  ServerRackModel,
  ServerTerminalModel,
  SmsBoothModel,
  TestBenchModel,
  TreadmillModel,
  WeightBenchModel,
  YogaMatModel,
} from "@/features/office/legacy/objects/machines";
import {
  ClockModel,
  KeyboardModel,
  MouseModel,
  MugModel,
  TrashCanModel,
} from "@/features/office/legacy/objects/primitives";
import {
  FurnitureGlbModel,
  hasFurnitureGlb,
} from "@/features/office/scene/FurnitureGlbModel";

type OfficeObjectsProps = {
  objects: PlacedObject[];
  selectedObjectId: string | null;
  onSelect?: (objectId: string) => void;
  onDragStart?: (objectId: string) => void;
  lampsOn?: boolean;
};

const noop = () => undefined;

function WallMesh({ object }: { object: PlacedObject }) {
  const size = getObjectWorldSize(object.type, object.length);
  const height = size.height;
  const thickness = size.depth;
  const length = object.length || size.width;
  const y = height / 2;
  const color =
    object.type === "wall_glass"
      ? "#90caf9"
      : object.type === "wall_brick"
        ? "#a1887f"
        : object.type === "wall_drywall"
          ? "#eceff1"
          : object.type === "wall_partition"
            ? "#b0bec5"
            : object.type === "door"
              ? "#6d4c41"
              : "#8d6e63";

  if (object.type === "door") {
    const frame = 0.08;
    return (
      <group>
        <mesh position={[-length / 2 + frame / 2, y, 0]} castShadow>
          <boxGeometry args={[frame, height, thickness]} />
          <meshStandardMaterial color="#4e342e" roughness={0.7} />
        </mesh>
        <mesh position={[length / 2 - frame / 2, y, 0]} castShadow>
          <boxGeometry args={[frame, height, thickness]} />
          <meshStandardMaterial color="#4e342e" roughness={0.7} />
        </mesh>
        <mesh position={[0, height - frame / 2, 0]} castShadow>
          <boxGeometry args={[length, frame, thickness]} />
          <meshStandardMaterial color="#4e342e" roughness={0.7} />
        </mesh>
        <mesh position={[-length * 0.15, y * 0.95, thickness * 0.15]} castShadow>
          <boxGeometry args={[length * 0.55, height * 0.92, thickness * 0.35]} />
          <meshStandardMaterial color={color} roughness={0.65} />
        </mesh>
      </group>
    );
  }

  const isGlass = object.type === "wall_glass";
  const isBrick = object.type === "wall_brick";

  return (
    <group>
      <mesh position={[0, y, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, height, thickness]} />
        <meshStandardMaterial
          color={color}
          roughness={isGlass ? 0.15 : isBrick ? 0.95 : 0.8}
          metalness={isGlass ? 0.35 : 0.05}
          transparent={isGlass}
          opacity={isGlass ? 0.35 : 1}
        />
      </mesh>
      {isBrick
        ? Array.from({ length: 4 }).map((_, row) => (
            <mesh
              key={row}
              position={[0, 0.25 + row * 0.48, thickness / 2 + 0.005]}
            >
              <planeGeometry args={[length * 0.96, 0.03]} />
              <meshBasicMaterial color="#6d4c41" transparent opacity={0.35} />
            </mesh>
          ))
        : null}
      {object.type === "wall_partition" ? (
        <mesh position={[0, height + 0.02, 0]}>
          <boxGeometry args={[length, 0.04, thickness * 1.2]} />
          <meshStandardMaterial color="#546e7a" metalness={0.4} roughness={0.4} />
        </mesh>
      ) : null}
    </group>
  );
}

/** Convert center-based PlacedObject → corner-based FurnitureItem for legacy meshes. */
export function toLegacyFurnitureItem(object: PlacedObject): FurnitureItem {
  const size = getObjectWorldSize(object.type, object.length);
  return {
    _uid: object.id,
    type: object.type,
    x: object.x - size.width / 2,
    y: object.z - size.depth / 2,
    w: size.width / SCALE,
    h: size.depth / SCALE,
    facing: object.rotationY,
    elevation: object.elevation,
  };
}

const interactiveProps = (object: PlacedObject, selected: boolean) => ({
  item: toLegacyFurnitureItem(object),
  isSelected: selected,
  isHovered: false,
  editMode: false,
  onPointerDown: noop,
  onPointerOver: noop,
  onPointerOut: noop,
});

const basicProps = (object: PlacedObject) => ({
  item: toLegacyFurnitureItem(object),
  editMode: false,
});

function LegacyProceduralMesh({
  object,
  selected,
}: {
  object: PlacedObject;
  selected: boolean;
}) {
  const type = object.type;
  const interactive = interactiveProps(object, selected);
  const basic = basicProps(object);

  switch (type) {
    case "atm":
      return <AtmMachineModel {...interactive} />;
    case "phone_booth":
      return <PhoneBoothModel {...interactive} />;
    case "sms_booth":
      return <SmsBoothModel {...interactive} />;
    case "server_rack":
      return <ServerRackModel {...interactive} />;
    case "server_terminal":
      return <ServerTerminalModel {...interactive} />;
    case "qa_terminal":
      return <QaTerminalModel {...interactive} />;
    case "device_rack":
      return <DeviceRackModel {...interactive} />;
    case "test_bench":
      return <TestBenchModel {...interactive} />;
    case "pingpong":
      return <PingPongTableModel {...interactive} />;
    case "treadmill":
      return <TreadmillModel {...interactive} />;
    case "weight_bench":
      return <WeightBenchModel {...interactive} />;
    case "dumbbell_rack":
      return <DumbbellRackModel {...interactive} />;
    case "exercise_bike":
      return <ExerciseBikeModel {...interactive} />;
    case "punching_bag":
      return <PunchingBagModel {...interactive} />;
    case "rowing_machine":
      return <RowingMachineModel {...interactive} />;
    case "kettlebell_rack":
      return <KettlebellRackModel {...interactive} />;
    case "yoga_mat":
      return <YogaMatModel {...interactive} />;
    case "easel":
      return <EaselModel {...interactive} />;
    case "jukebox":
      return <JukeboxModel {...interactive} />;
    case "vending":
      return <VendingMachineModel {...basic} />;
    case "dishwasher":
      return <DishwasherModel {...basic} />;
    case "stove":
      return <StoveModel {...basic} />;
    case "microwave":
      return <MicrowaveModel {...basic} />;
    case "wall_cabinet":
      return <WallCabinetModel {...basic} />;
    case "sink":
      return <SinkModel {...basic} />;
    case "keyboard":
      return <KeyboardModel {...basic} />;
    case "mouse":
      return <MouseModel {...basic} />;
    case "trash":
      return <TrashCanModel {...basic} />;
    case "mug":
      return <MugModel {...basic} />;
    case "clock":
      return <ClockModel {...basic} />;
    default:
      return <FallbackBox type={object.type} />;
  }
}

function FallbackBox({ type }: { type: ObjectType }) {
  const size = getObjectWorldSize(type);
  return (
    <mesh position={[0, size.height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[size.width, size.height, size.depth]} />
      <meshStandardMaterial color="#8d6e63" roughness={0.8} />
    </mesh>
  );
}

function ObjectVisual({
  object,
  selected,
  lampsOn,
}: {
  object: PlacedObject;
  selected: boolean;
  lampsOn: boolean;
}) {
  if (isWallType(object.type)) {
    return <WallMesh object={object} />;
  }

  if (hasFurnitureGlb(object.type)) {
    return (
      <group>
        <FurnitureGlbModel type={object.type} />
        {object.type === "lamp" && lampsOn ? (
          <pointLight
            position={[0, 1.4, 0]}
            intensity={1.2}
            distance={8}
            color="#ffe0b2"
            castShadow={false}
          />
        ) : null}
      </group>
    );
  }

  return <LegacyProceduralMesh object={object} selected={selected} />;
}

export const OfficeObjects = memo(function OfficeObjects({
  objects,
  selectedObjectId,
  onSelect,
  onDragStart,
  lampsOn = true,
}: OfficeObjectsProps) {
  return (
    <group>
      {objects.map((object) => {
        const selected = object.id === selectedObjectId;
        const size = getObjectWorldSize(object.type, object.length);
        const wall = isWallType(object.type);
        const usesLegacyAbsolute = !wall && !hasFurnitureGlb(object.type);

        return (
          <group
            key={object.id}
            position={
              usesLegacyAbsolute
                ? [0, 0, 0]
                : [object.x, object.elevation, object.z]
            }
            rotation={
              usesLegacyAbsolute
                ? [0, 0, 0]
                : [0, (object.rotationY * Math.PI) / 180, 0]
            }
            scale={wall ? 1 : usesLegacyAbsolute ? 1 : object.scale}
            onPointerDown={(event) => {
              event.stopPropagation();
              onSelect?.(object.id);
              onDragStart?.(object.id);
            }}
          >
            <ObjectVisual
              object={object}
              selected={selected}
              lampsOn={lampsOn}
            />
            <mesh
              position={
                usesLegacyAbsolute
                  ? [object.x, Math.max(0.2, size.height * 0.5) + object.elevation, object.z]
                  : [0, Math.max(0.2, size.height * 0.5), 0]
              }
              visible={false}
            >
              <boxGeometry
                args={[
                  Math.max(wall ? object.length : size.width, 0.6),
                  Math.max(size.height, 0.5),
                  Math.max(size.depth, 0.6),
                ]}
              />
              <meshBasicMaterial />
            </mesh>
            {selected ? (
              <mesh
                position={
                  usesLegacyAbsolute
                    ? [object.x, 0.03 + object.elevation, object.z]
                    : [0, 0.03, 0]
                }
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <ringGeometry
                  args={[
                    Math.max(
                      wall ? object.length * 0.2 : size.width,
                      size.depth,
                    ) * 0.55,
                    Math.max(
                      wall ? object.length * 0.2 : size.width,
                      size.depth,
                    ) * 0.7,
                    28,
                  ]}
                />
                <meshBasicMaterial color="#c8a97e" transparent opacity={0.9} />
              </mesh>
            ) : null}
          </group>
        );
      })}
    </group>
  );
});
