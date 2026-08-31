"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { ProcessReading } from "@/components/laboratory/equipmentTelemetry";
import { formatReading } from "@/components/laboratory/equipmentTelemetry";

function drawMonitor(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  title: string,
  readings: ProcessReading[],
  status: "normal" | "warning" | "offline",
) {
  ctx.clearRect(0, 0, width, height);

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#0f172a");
  bg.addColorStop(1, "#1e293b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 11px system-ui, sans-serif";
  ctx.fillText(title.toUpperCase(), 10, 16);

  const statusColor =
    status === "normal" ? "#22c55e" : status === "warning" ? "#f59e0b" : "#64748b";
  ctx.fillStyle = statusColor;
  ctx.beginPath();
  ctx.arc(width - 14, 12, 4, 0, Math.PI * 2);
  ctx.fill();

  readings.forEach((reading, index) => {
    const y = 28 + index * 18;
    ctx.fillStyle = "#64748b";
    ctx.font = "10px system-ui, sans-serif";
    ctx.fillText(reading.label, 10, y);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 11px ui-monospace, monospace";
    ctx.fillText(formatReading(reading), 72, y);
  });
}

function useMonitorTexture(
  title: string,
  readings: ProcessReading[],
  status: "normal" | "warning" | "offline",
  size: { w: number; h: number },
) {
  const { canvas, ctx } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = size.w;
    c.height = size.h;
    return { canvas: c, ctx: c.getContext("2d")! };
  }, [size.h, size.w]);

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [canvas]);

  useEffect(() => {
    if (!ctx) return;
    drawMonitor(ctx, size.w, size.h, title, readings, status);
    texture.needsUpdate = true;
  }, [ctx, readings, size.h, size.w, status, texture, title]);

  useEffect(() => () => texture.dispose(), [texture]);

  return texture;
}

type ProcessMonitorProps = {
  title: string;
  readings: ProcessReading[];
  status?: "normal" | "warning" | "offline";
  width?: number;
  height?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  pixelScale?: number;
};

export function ProcessMonitor({
  title,
  readings,
  status = "normal",
  width = 0.38,
  height = 0.22,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  pixelScale = 512,
}: ProcessMonitorProps) {
  const aspect = width / height;
  const texW = Math.round(pixelScale * aspect);
  const texH = Math.round(pixelScale);
  const map = useMonitorTexture(title, readings, status, { w: texW, h: texH });

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.002]}>
        <boxGeometry args={[width + 0.02, height + 0.02, 0.012]} />
        <meshStandardMaterial color="#475569" metalness={0.55} roughness={0.35} />
      </mesh>
    </group>
  );
}

type ScadaWallDisplayProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  panels: Array<{
    title: string;
    readings: ProcessReading[];
    status?: "normal" | "warning" | "offline";
  }>;
};

export function ScadaWallDisplay({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  panels,
}: ScadaWallDisplayProps) {
  const texture = useScadaTexture(panels);

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.8, 1.55, 0.08]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.35} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[2.65, 1.38]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

function useScadaTexture(panels: ScadaWallDisplayProps["panels"]) {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 560;
    return c;
  }, []);

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [canvas]);

  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "700 22px system-ui, sans-serif";
    ctx.fillText("BIO-PROCESS MONITORING", 24, 36);
    ctx.fillStyle = "#64748b";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText("Pharmaceutical Manufacturing · Live Telemetry", 24, 56);

    const colW = (canvas.width - 48) / Math.min(panels.length, 3);
    panels.slice(0, 3).forEach((panel, col) => {
      const x = 24 + col * colW;
      const y = 72;
      ctx.fillStyle = "#111827";
      ctx.fillRect(x, y, colW - 12, canvas.height - 96);
      ctx.strokeStyle = "#1e293b";
      ctx.strokeRect(x, y, colW - 12, canvas.height - 96);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 14px system-ui, sans-serif";
      ctx.fillText(panel.title, x + 12, y + 22);

      panel.readings.slice(0, 5).forEach((reading, row) => {
        const ry = y + 44 + row * 28;
        ctx.fillStyle = "#475569";
        ctx.font = "12px system-ui, sans-serif";
        ctx.fillText(reading.label, x + 12, ry);
        ctx.fillStyle = "#f1f5f9";
        ctx.font = "600 14px ui-monospace, monospace";
        ctx.fillText(formatReading(reading), x + 12, ry + 16);
      });
    });

    texture.needsUpdate = true;
  }, [canvas, panels, texture]);

  useEffect(() => () => texture.dispose(), [texture]);

  return texture;
}
