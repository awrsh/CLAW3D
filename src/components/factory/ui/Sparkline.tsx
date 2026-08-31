"use client";

import { useMemo } from "react";

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: string;
  strokeWidth?: number;
};

/** Minimal SVG sparkline for live telemetry trends. */
export function Sparkline({
  data,
  width = 72,
  height = 22,
  color = "#34d399",
  fill = "rgba(52,211,153,0.12)",
  strokeWidth = 1.5,
}: SparklineProps) {
  const { linePath, areaPath } = useMemo(() => {
    if (data.length < 2) {
      return { linePath: "", areaPath: "" };
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 2;
    const innerW = width - pad * 2;
    const innerH = height - pad * 2;

    const points = data.map((v, i) => {
      const x = pad + (i / (data.length - 1)) * innerW;
      const y = pad + innerH - ((v - min) / range) * innerH;
      return [x, y] as const;
    });

    const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const area = `${line} L${(pad + innerW).toFixed(1)},${(pad + innerH).toFixed(1)} L${pad},${(pad + innerH).toFixed(1)} Z`;

    return { linePath: line, areaPath: area };
  }, [data, width, height]);

  if (data.length < 2) {
    return (
      <svg width={width} height={height} className="opacity-40">
        <line
          x1={2}
          y1={height / 2}
          x2={width - 2}
          y2={height / 2}
          stroke={color}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      </svg>
    );
  }

  return (
    <svg width={width} height={height} aria-hidden>
      <path d={areaPath} fill={fill} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
