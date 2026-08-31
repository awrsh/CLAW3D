"use client";

import { memo } from "react";
import { PipeSegment, Valve, PressureGauge } from "@/components/factory/equipment/shared";

/** Production spine pipe network along main manufacturing row */
export const FactoryPipes = memo(function FactoryPipes() {
  const y = 2.35;
  const y2 = 3.15;
  const mainZ = 1.2;

  const spine: [number, number, number][] = [
    [-48, y, mainZ],
    [-32, y, mainZ],
    [-16, y, mainZ],
    [0, y, mainZ],
    [16, y, mainZ],
    [32, y, mainZ],
    [48, y, mainZ],
  ];

  const spine2: [number, number, number][] = spine.map(([x, , z]) => [x, y2, z - 0.35]);

  const southWingX = [-48, -32, -16, 0, 16, 32, 48];

  return (
    <group name="factory-pipe-network">
      {/* Primary + secondary parallel spines */}
      {spine.slice(0, -1).map((from, i) => (
        <PipeSegment key={`s1-${i}`} from={from} to={spine[i + 1]} radius={0.055} />
      ))}
      {spine2.slice(0, -1).map((from, i) => (
        <PipeSegment key={`s2-${i}`} from={from} to={spine2[i + 1]} radius={0.04} />
      ))}

      {/* Cross-ties between parallel runs at each department */}
      {spine.map((pos, i) => (
        <PipeSegment
          key={`tie-${i}`}
          from={pos}
          to={[pos[0], y2, pos[2] - 0.35]}
          radius={0.03}
        />
      ))}

      {/* South wing branches — every production bay */}
      {southWingX.map((x) => (
        <PipeSegment key={`sw-${x}`} from={[x, y, mainZ]} to={[x, y, -14]} radius={0.042} />
      ))}

      {/* South wing secondary tier */}
      {[0, 16, 32, 48].map((x) => (
        <PipeSegment key={`sw2-${x}`} from={[x, y2, mainZ - 0.35]} to={[x, y2, -14]} radius={0.035} />
      ))}

      {/* East-west connector across filling row */}
      <PipeSegment from={[-48, y, -14]} to={[48, y, -14]} radius={0.045} />
      <PipeSegment from={[-48, y2, -14.35]} to={[48, y2, -14.35]} radius={0.038} />

      {/* Utility feed + R&D loop */}
      <PipeSegment from={[-18, y, -14]} to={[-18, y, mainZ]} radius={0.04} />
      <PipeSegment from={[-18, y, mainZ]} to={[0, y, mainZ]} radius={0.04} />
      <PipeSegment from={[-18, y, 18]} to={[-18, y, mainZ]} radius={0.035} />
      <PipeSegment from={[18, y, 18]} to={[18, y, mainZ]} radius={0.035} />

      {/* Vertical risers at key nodes */}
      {[-48, -16, 0, 16, 32, 48].map((x) => (
        <PipeSegment
          key={`rise-${x}`}
          from={[x, 0.6, mainZ]}
          to={[x, y, mainZ]}
          radius={0.038}
        />
      ))}

      {/* Valves at process nodes */}
      {spine.map((pos, i) => (
        <Valve key={`v-${i}`} position={pos} />
      ))}
      {southWingX.map((x, i) => (
        <Valve key={`vs-${i}`} position={[x, y, -8]} />
      ))}

      <PressureGauge position={[0, y + 0.15, mainZ + 0.2]} />
      <PressureGauge position={[32, y + 0.15, mainZ + 0.2]} />
      <PressureGauge position={[-16, y + 0.15, mainZ + 0.2]} />
      <PressureGauge position={[16, y + 0.15, -10]} />
    </group>
  );
});
