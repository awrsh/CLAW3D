"use client";

import { memo } from "react";
import { PipeElbow, PipeFlange, PipeJunctionBox, PipeManifold, PipeTee, SamplePort } from "@/components/factory/equipment/PipeFittings";
import { PipeSegment, Valve, PressureGauge } from "@/components/factory/equipment/shared";
import { useFactory } from "@/components/factory/context/FactoryContext";

/** Process pipe connections linking production, utilities, QC and QA offices */
export const FactoryPipeConnections = memo(function FactoryPipeConnections() {
  const { state } = useFactory();
  const active = state.isSimulating;

  const y = 2.35;
  const yHigh = 3.4;
  const mainZ = 1.2;

  return (
    <group name="factory-pipe-connections">
      {/* ── Utilities manifold → main spine ── */}
      <PipeManifold position={[-18, y, -10]} />
      <PipeFlange position={[-18, y, -5]} />
      <PipeTee position={[-8, y, mainZ]} axis="z" />
      <Valve position={[-12, y, mainZ]} />
      <PressureGauge position={[-18, y + 0.2, -6]} />

      {/* ── WFI loop: utilities → prep → upstream ── */}
      <PipeSegment from={[-18, yHigh, -10]} to={[-18, yHigh, mainZ]} radius={0.038} />
      <PipeSegment from={[-18, yHigh, mainZ]} to={[-16, yHigh, mainZ]} radius={0.038} />
      <PipeElbow position={[-16, yHigh, mainZ]} rotation={0} radius={0.038} />
      <PipeSegment from={[-16, yHigh, mainZ]} to={[0, yHigh, mainZ]} radius={0.035} />
      <PipeFlange position={[-16, yHigh, mainZ]} />
      <PipeFlange position={[0, yHigh, mainZ]} />
      <PipeJunctionBox position={[-16, yHigh, mainZ]} active={active} />

      {/* ── Product transfer: upstream → downstream → purification ── */}
      <PipeSegment from={[0, y + 0.5, mainZ + 0.5]} to={[16, y + 0.5, mainZ + 0.5]} radius={0.048} />
      <PipeSegment from={[16, y + 0.5, mainZ + 0.5]} to={[32, y + 0.5, mainZ + 0.5]} radius={0.045} />
      <PipeTee position={[16, y + 0.5, mainZ + 0.5]} axis="z" />
      <Valve position={[8, y + 0.5, mainZ + 0.5]} />
      <Valve position={[24, y + 0.5, mainZ + 0.5]} />

      {/* ── Filling → QC sample line ── */}
      <PipeSegment from={[0, y, -14]} to={[16, y, -14]} radius={0.032} />
      <PipeSegment from={[16, y, -14]} to={[16, y, -16]} radius={0.032} />
      <PipeElbow position={[16, y, -14]} rotation={Math.PI / 2} radius={0.032} />
      <SamplePort position={[8, y, -14]} />
      <SamplePort position={[12, y, -14]} />
      <PipeFlange position={[16, y, -15]} />
      <PipeJunctionBox position={[16, y, -14.5]} active={active} />
      <Valve position={[4, y, -14]} />

      {/* ── QA office sample receipt line (from QC) ── */}
      <PipeSegment from={[16, yHigh, -16]} to={[36, yHigh, -16]} radius={0.028} />
      <PipeSegment from={[36, yHigh, -16]} to={[36, yHigh, 18]} radius={0.028} />
      <PipeElbow position={[36, yHigh, -16]} rotation={0} radius={0.028} />
      <PipeElbow position={[36, yHigh, 18]} rotation={Math.PI / 2} radius={0.028} />
      <PipeSegment from={[36, yHigh, 18]} to={[36, yHigh, 22]} radius={0.028} />
      <SamplePort position={[36, yHigh, 20]} />
      <SamplePort position={[28, yHigh, -16]} />
      <PipeFlange position={[36, yHigh, 22]} />
      <PipeJunctionBox position={[36, yHigh, 20]} active={active} />

      {/* ── Manager office — facility monitoring taps ── */}
      <PipeSegment from={[0, yHigh, mainZ]} to={[0, yHigh, 18]} radius={0.03} />
      <PipeSegment from={[0, yHigh, 18]} to={[-36, yHigh, 18]} radius={0.03} />
      <PipeSegment from={[-36, yHigh, 18]} to={[-36, yHigh, 22]} radius={0.03} />
      <PipeTee position={[0, yHigh, 18]} axis="x" />
      <PipeFlange position={[-36, yHigh, 22]} />
      <PressureGauge position={[-36, yHigh + 0.15, 20]} />

      {/* ── CIP/SIP return: formulation → utilities ── */}
      <PipeSegment from={[48, y, mainZ]} to={[48, y, -14]} radius={0.04} />
      <PipeSegment from={[48, y, -14]} to={[-18, y, -14]} radius={0.04} />
      <PipeElbow position={[48, y, -14]} rotation={Math.PI / 2} radius={0.04} />
      <Valve position={[32, y, -14]} />
      <Valve position={[0, y, -14]} />

      {/* ── Vertical drops with flanges at department entries ── */}
      {[
        [-48, mainZ],
        [-32, mainZ],
        [-16, mainZ],
        [0, mainZ],
        [16, mainZ],
        [32, mainZ],
        [48, mainZ],
        [0, -14],
        [16, -14],
        [16, -16],
      ].map(([x, z], i) => (
        <group key={`drop-${i}`}>
          <PipeSegment from={[x, 0.8, z]} to={[x, y, z]} radius={0.035} />
          <PipeFlange position={[x, 0.8, z]} />
        </group>
      ))}
    </group>
  );
});
