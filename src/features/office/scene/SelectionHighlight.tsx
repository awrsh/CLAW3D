"use client";

type SelectionHighlightProps = {
  width: number;
  height: number;
  depth: number;
  selected?: boolean;
  hovered?: boolean;
  yOffset?: number;
  position?: [number, number, number];
};

/**
 * Ground ring + wireframe box for selected / hovered scene objects.
 */
export function SelectionHighlight({
  width,
  height,
  depth,
  selected = false,
  hovered = false,
  yOffset = 0,
  position,
}: SelectionHighlightProps) {
  if (!selected && !hovered) return null;

  const active = selected;
  const color = active ? "#fbbf24" : "#c8a97e";
  const ringInner = Math.max(width, depth) * 0.52;
  const ringOuter = Math.max(width, depth) * 0.68;
  const cy = height / 2 + yOffset;

  return (
    <group position={position}>
      <mesh position={[0, 0.03 + yOffset, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ringInner, ringOuter, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={active ? 0.92 : 0.48}
        />
      </mesh>
      <mesh position={[0, cy, 0]}>
        <boxGeometry args={[width * 1.02, height * 1.02, depth * 1.02]} />
        <meshBasicMaterial
          color={color}
          wireframe
          transparent
          opacity={active ? 0.72 : 0.38}
        />
      </mesh>
    </group>
  );
}
