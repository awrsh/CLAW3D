"use client";

import { memo } from "react";
import { Edges } from "@react-three/drei";

type EquipmentHighlightProps = {
  active: boolean;
  width: number;
  height: number;
  depth: number;
  y?: number;
};

/** Subtle selection/hover outline for laboratory equipment. */
export const EquipmentHighlight = memo(function EquipmentHighlight({
  active,
  width,
  height,
  depth,
  y = height / 2,
}: EquipmentHighlightProps) {
  if (!active) return null;

  return (
    <mesh position={[0, y, 0]}>
      <boxGeometry args={[width, height, depth]} />
      <meshBasicMaterial visible={false} />
      <Edges threshold={15} color="#0ea5e9" linewidth={1} renderOrder={5} />
    </mesh>
  );
});
