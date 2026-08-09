"use client";

import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OfficeAgent } from "@/features/office/core/agents";
import {
  buildAgentLook,
  type AgentLook,
} from "@/features/office/core/agentLooks";
import { wrapCanvasText } from "@/features/office/core/speechUi";

type SpeechPhase = "idle" | "thinking" | "typing" | "holding";

type LiveAgent = OfficeAgent & {
  speechText?: string;
  speechPhase?: SpeechPhase;
};

type OfficeAgentModelProps = {
  agentId: string;
  agentsRef: React.MutableRefObject<LiveAgent[]>;
  selected?: boolean;
  onSelect?: (agentId: string) => void;
};

const STATE_SUBTITLE: Record<OfficeAgent["state"], string> = {
  idle: "آزاد",
  walking: "راه رفتن",
  working: "در حال انجام",
  sitting: "منتظر",
  chatting: "گفتگو",
};

function speechSubtitle(phase: SpeechPhase | undefined): string | null {
  if (phase === "thinking") return "فکر می‌کند…";
  if (phase === "typing") return "می‌نویسد…";
  if (phase === "holding") return "صحبت";
  return null;
}

function statusDotColor(state: OfficeAgent["state"], phase?: SpeechPhase): string {
  if (phase === "thinking") return "#c084fc";
  if (phase === "typing") return "#e879f9";
  switch (state) {
    case "walking":
      return "#22c55e";
    case "working":
      return "#38bdf8";
    case "sitting":
      return "#f59e0b";
    case "chatting":
      return "#e879f9";
    case "idle":
      return "#94a3b8";
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

/** Keep "Name (Role)" readable on the billboard. */
function formatNameplate(name: string): string {
  const normalized = name.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= 32) return normalized;
  return `${normalized.slice(0, 31)}…`;
}

function paintNameplate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  name: string,
  state: OfficeAgent["state"],
  accent: string,
  selected: boolean,
  phase?: SpeechPhase,
) {
  const subtitle = speechSubtitle(phase) ?? STATE_SUBTITLE[state];
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "rgba(8, 12, 20, 0.94)";
  roundRect(ctx, 2, 2, width - 4, height - 4, 6);
  ctx.fill();

  if (selected) {
    ctx.strokeStyle = "rgba(245, 158, 11, 0.7)";
    ctx.lineWidth = 3;
    roundRect(ctx, 2, 2, width - 4, height - 4, 6);
    ctx.stroke();
  } else {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 2;
    roundRect(ctx, 2, 2, width - 4, height - 4, 6);
    ctx.stroke();
  }

  ctx.fillStyle = accent;
  ctx.fillRect(2, 2, 8, height - 4);

  ctx.beginPath();
  ctx.arc(width - 22, height / 2, 7, 0, Math.PI * 2);
  ctx.fillStyle = statusDotColor(state, phase);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "rtl";
  ctx.fillStyle = "#e8dfc0";
  ctx.font = "700 22px Tahoma, 'Segoe UI', Estedad, sans-serif";
  ctx.fillText(name, width / 2 + 2, height / 2 - 11, width - 56);

  ctx.fillStyle =
    phase === "thinking" || phase === "typing" ? "#e9d5ff" : "#8ab4ff";
  ctx.font = "500 15px Tahoma, 'Segoe UI', Estedad, sans-serif";
  ctx.fillText(subtitle, width / 2 + 2, height / 2 + 14, width - 56);
}

function paintSpeechBubble(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
  phase: SpeechPhase,
) {
  ctx.clearRect(0, 0, width, height);
  if (!text && phase === "idle") return;

  const padX = 16;
  const padY = 14;
  const bodyH = height - 22;
  ctx.fillStyle =
    phase === "thinking"
      ? "rgba(40, 24, 55, 0.94)"
      : "rgba(255, 252, 245, 0.97)";
  roundRect(ctx, 4, 4, width - 8, bodyH, 12);
  ctx.fill();
  ctx.strokeStyle =
    phase === "thinking" ? "rgba(216, 180, 254, 0.35)" : "rgba(30, 20, 10, 0.18)";
  ctx.lineWidth = 2;
  roundRect(ctx, 4, 4, width - 8, bodyH, 12);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(width / 2 - 12, bodyH);
  ctx.lineTo(width / 2, height - 4);
  ctx.lineTo(width / 2 + 12, bodyH);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = phase === "thinking" ? "#f3e8ff" : "#1c1610";
  ctx.font = "600 20px Tahoma, 'Segoe UI', Estedad, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "rtl";

  const lines = wrapCanvasText(ctx, text || "…", width - padX * 2);
  const lineH = 24;
  const startY =
    padY + 8 + ((Math.min(lines.length, 5) - 1) * lineH) / -2 + bodyH / 2;
  lines.slice(0, 5).forEach((line, index) => {
    ctx.fillText(line, width / 2, startY + index * lineH, width - padX * 2);
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function HairMeshes({ look }: { look: AgentLook }) {
  const { hair, hairStyle } = look;
  switch (hairStyle) {
    case "bald":
      return (
        <mesh position={[0, 1.03, -0.02]}>
          <boxGeometry args={[0.18, 0.03, 0.16]} />
          <meshLambertMaterial color={hair} />
        </mesh>
      );
    case "buzz":
      return (
        <>
          <mesh position={[0, 1.03, 0]} castShadow>
            <boxGeometry args={[0.25, 0.05, 0.23]} />
            <meshLambertMaterial color={hair} />
          </mesh>
          <mesh position={[0, 0.94, -0.1]} castShadow>
            <boxGeometry args={[0.24, 0.12, 0.05]} />
            <meshLambertMaterial color={hair} />
          </mesh>
        </>
      );
    case "long":
      return (
        <>
          <mesh position={[0, 1.04, 0]} castShadow>
            <boxGeometry args={[0.27, 0.08, 0.24]} />
            <meshLambertMaterial color={hair} />
          </mesh>
          <mesh position={[0, 0.86, -0.12]} castShadow>
            <boxGeometry args={[0.26, 0.28, 0.08]} />
            <meshLambertMaterial color={hair} />
          </mesh>
          <mesh position={[-0.12, 0.88, 0.02]} castShadow>
            <boxGeometry args={[0.06, 0.22, 0.16]} />
            <meshLambertMaterial color={hair} />
          </mesh>
          <mesh position={[0.12, 0.88, 0.02]} castShadow>
            <boxGeometry args={[0.06, 0.22, 0.16]} />
            <meshLambertMaterial color={hair} />
          </mesh>
        </>
      );
    case "bun":
      return (
        <>
          <mesh position={[0, 1.03, 0]} castShadow>
            <boxGeometry args={[0.25, 0.06, 0.22]} />
            <meshLambertMaterial color={hair} />
          </mesh>
          <mesh position={[0, 1.12, -0.02]} castShadow>
            <boxGeometry args={[0.12, 0.1, 0.12]} />
            <meshLambertMaterial color={hair} />
          </mesh>
          <mesh position={[0, 0.94, -0.1]} castShadow>
            <boxGeometry args={[0.24, 0.14, 0.06]} />
            <meshLambertMaterial color={hair} />
          </mesh>
        </>
      );
    case "ponytail":
      return (
        <>
          <mesh position={[0, 1.04, 0]} castShadow>
            <boxGeometry args={[0.26, 0.07, 0.23]} />
            <meshLambertMaterial color={hair} />
          </mesh>
          <mesh position={[0, 0.92, -0.1]} castShadow>
            <boxGeometry args={[0.24, 0.14, 0.06]} />
            <meshLambertMaterial color={hair} />
          </mesh>
          <mesh position={[0, 0.78, -0.16]} castShadow>
            <boxGeometry args={[0.08, 0.22, 0.08]} />
            <meshLambertMaterial color={hair} />
          </mesh>
        </>
      );
    case "side":
      return (
        <>
          <mesh position={[0.02, 1.04, 0]} castShadow>
            <boxGeometry args={[0.26, 0.08, 0.24]} />
            <meshLambertMaterial color={hair} />
          </mesh>
          <mesh position={[0.1, 0.96, 0.04]} castShadow>
            <boxGeometry args={[0.1, 0.14, 0.2]} />
            <meshLambertMaterial color={hair} />
          </mesh>
          <mesh position={[0, 0.94, -0.1]} castShadow>
            <boxGeometry args={[0.24, 0.14, 0.06]} />
            <meshLambertMaterial color={hair} />
          </mesh>
        </>
      );
    case "bangs":
      return (
        <>
          <mesh position={[0, 1.04, 0]} castShadow>
            <boxGeometry args={[0.26, 0.07, 0.24]} />
            <meshLambertMaterial color={hair} />
          </mesh>
          <mesh position={[0, 0.98, 0.1]} castShadow>
            <boxGeometry args={[0.22, 0.05, 0.06]} />
            <meshLambertMaterial color={hair} />
          </mesh>
          <mesh position={[0, 0.92, -0.1]} castShadow>
            <boxGeometry args={[0.25, 0.16, 0.07]} />
            <meshLambertMaterial color={hair} />
          </mesh>
        </>
      );
    case "short":
    default:
      return (
        <>
          <mesh position={[0, 1.04, 0]} castShadow>
            <boxGeometry args={[0.26, 0.08, 0.24]} />
            <meshLambertMaterial color={hair} />
          </mesh>
          <mesh position={[0, 0.92, -0.1]} castShadow>
            <boxGeometry args={[0.25, 0.18, 0.08]} />
            <meshLambertMaterial color={hair} />
          </mesh>
          <mesh position={[-0.09, 1.0, 0.02]}>
            <boxGeometry args={[0.08, 0.06, 0.18]} />
            <meshLambertMaterial color={hair} />
          </mesh>
          <mesh position={[0.09, 1.0, 0.02]}>
            <boxGeometry args={[0.08, 0.06, 0.18]} />
            <meshLambertMaterial color={hair} />
          </mesh>
        </>
      );
  }
}

function CollarMeshes({
  look,
  shirt,
}: {
  look: AgentLook;
  shirt: string;
}) {
  switch (look.collar) {
    case "vneck":
      return (
        <mesh position={[0, 0.68, 0.095]}>
          <boxGeometry args={[0.1, 0.1, 0.02]} />
          <meshLambertMaterial color={look.skin} />
        </mesh>
      );
    case "crew":
      return (
        <mesh position={[0, 0.72, 0.095]}>
          <boxGeometry args={[0.14, 0.04, 0.02]} />
          <meshLambertMaterial color={shadeShirt(shirt, -30)} />
        </mesh>
      );
    case "tie":
      return (
        <>
          <mesh position={[0, 0.7, 0.095]}>
            <boxGeometry args={[0.12, 0.05, 0.02]} />
            <meshLambertMaterial color="#fff8e7" />
          </mesh>
          <mesh position={[0, 0.55, 0.1]}>
            <boxGeometry args={[0.04, 0.2, 0.02]} />
            <meshLambertMaterial color="#1a237e" />
          </mesh>
        </>
      );
    case "placket":
    default:
      return (
        <>
          <mesh position={[0, 0.7, 0.095]}>
            <boxGeometry args={[0.12, 0.06, 0.02]} />
            <meshLambertMaterial color="#fff8e7" />
          </mesh>
          <mesh position={[0, 0.58, 0.095]}>
            <boxGeometry args={[0.03, 0.16, 0.015]} />
            <meshLambertMaterial color="#fff8e7" />
          </mesh>
        </>
      );
  }
}

function shadeShirt(hex: string, amount: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return hex;
  const num = Number.parseInt(raw, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 255) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 255) + amount));
  const b = Math.min(255, Math.max(0, (num & 255) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Procedural character + canvas billboard nameplate (visible under ortho camera).
 * Face features (+Z) make front/back obvious under the orthographic camera.
 */
export const OfficeAgentModel = memo(function OfficeAgentModel({
  agentId,
  agentsRef,
  selected = false,
  onSelect,
}: OfficeAgentModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const target = useRef(new THREE.Vector3());
  const plateKeyRef = useRef("");
  const speechKeyRef = useRef("");

  const canvas = useMemo(() => {
    if (typeof document === "undefined") return null;
    const el = document.createElement("canvas");
    el.width = 384;
    el.height = 80;
    return el;
  }, []);

  const speechCanvas = useMemo(() => {
    if (typeof document === "undefined") return null;
    const el = document.createElement("canvas");
    el.width = 512;
    el.height = 180;
    return el;
  }, []);

  const texture = useMemo(() => {
    if (!canvas) return null;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [canvas]);

  const speechTexture = useMemo(() => {
    if (!speechCanvas) return null;
    const tex = new THREE.CanvasTexture(speechCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [speechCanvas]);

  useEffect(() => {
    return () => {
      texture?.dispose();
      speechTexture?.dispose();
    };
  }, [speechTexture, texture]);

  useFrame(({ clock }) => {
    const agent = agentsRef.current.find((entry) => entry.id === agentId);
    if (!agent || !groupRef.current) return;

    const phase = agent.speechPhase ?? "idle";
    const isTyping =
      agent.state === "working" ||
      phase === "typing" ||
      phase === "thinking";
    const seatY = agent.state === "sitting" ? -0.16 : 0;

    target.current.set(agent.x, seatY, agent.z);
    groupRef.current.position.lerp(target.current, 0.18);

    let rotDelta = agent.facing - groupRef.current.rotation.y;
    while (rotDelta > Math.PI) rotDelta -= Math.PI * 2;
    while (rotDelta < -Math.PI) rotDelta += Math.PI * 2;
    groupRef.current.rotation.y += rotDelta * 0.15;

    const t = clock.elapsedTime;

    if (agent.state === "walking") {
      const swing = Math.sin(t * 8) * 0.55;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = swing;
        leftArmRef.current.rotation.z = 0;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -swing;
        rightArmRef.current.rotation.z = 0;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = -swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = swing;
    } else if (isTyping) {
      // Keyboard work: arms lean forward, alternating taps.
      const tapL = Math.sin(t * 14);
      const tapR = Math.sin(t * 14 + 1.4);
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = 1.12 + tapL * 0.14;
        leftArmRef.current.rotation.z = 0.18;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = 1.05 + tapR * 0.2;
        rightArmRef.current.rotation.z = -0.16;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0.08;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0.08;
    } else if (agent.state === "sitting") {
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = 0.55;
        leftArmRef.current.rotation.z = 0.08;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = 0.55;
        rightArmRef.current.rotation.z = -0.08;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = -0.95;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -0.95;
    } else if (agent.state === "chatting") {
      const talk = Math.sin(t * 5.5) * 0.35;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = 0.25;
        leftArmRef.current.rotation.z = 0.05;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = 0.7 + Math.max(0, talk);
        rightArmRef.current.rotation.z = -0.2;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    } else {
      const idle = Math.sin(t * 1.6) * 0.05;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = idle;
        leftArmRef.current.rotation.z = 0;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -idle;
        rightArmRef.current.rotation.z = 0;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    }

    if (canvas && texture) {
      const name = formatNameplate(agent.name);
      const key = `${name}|${agent.state}|${agent.color}|${selected ? 1 : 0}|${phase}`;
      if (key !== plateKeyRef.current) {
        plateKeyRef.current = key;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          paintNameplate(
            ctx,
            canvas.width,
            canvas.height,
            name,
            agent.state as OfficeAgent["state"],
            agent.color,
            selected,
            phase,
          );
          texture.needsUpdate = true;
        }
      }
    }

    if (speechCanvas && speechTexture) {
      const speech = agent.speechText ?? "";
      const speechKey = `${phase}|${speech}`;
      if (speechKey !== speechKeyRef.current) {
        speechKeyRef.current = speechKey;
        const ctx = speechCanvas.getContext("2d");
        if (ctx) {
          paintSpeechBubble(
            ctx,
            speechCanvas.width,
            speechCanvas.height,
            speech,
            phase,
          );
          speechTexture.needsUpdate = true;
        }
      }
    }
  });

  const agent = agentsRef.current.find((entry) => entry.id === agentId);
  const color = agent?.color ?? "#4fc3f7";
  const name = agent?.name ?? agentId;
  const look = useMemo(
    () => buildAgentLook(agentId, name, color),
    [agentId, name, color],
  );
  const cursor = useMemo(() => (onSelect ? "pointer" : "default"), [onSelect]);

  const mouthW =
    look.mouth === "wide" ? 0.09 : look.mouth === "small" ? 0.045 : 0.07;
  const mouthY = look.mouth === "smile" ? 0.815 : 0.82;

  useEffect(() => {
    if (!canvas || !texture) return;
    const live = agentsRef.current.find((entry) => entry.id === agentId);
    const plateName = formatNameplate(live?.name ?? "Agent");
    const state: OfficeAgent["state"] = live?.state ?? "idle";
    const accent = live?.color ?? color;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    paintNameplate(
      ctx,
      canvas.width,
      canvas.height,
      plateName,
      state,
      accent,
      selected,
    );
    plateKeyRef.current = `${plateName}|${state}|${accent}|${selected ? 1 : 0}`;
    texture.needsUpdate = true;
  }, [agentId, agentsRef, canvas, color, selected, texture]);

  return (
    <group
      ref={groupRef}
      scale={1.35 * look.bodyScale}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.(agentId);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = cursor;
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      {selected ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.3, 28]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.85} />
        </mesh>
      ) : (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.14, 16]} />
          <meshBasicMaterial color="#000" transparent opacity={0.22} />
        </mesh>
      )}

      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.28, 0.38, 0.18]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <CollarMeshes look={look} shirt={color} />

      <group scale={look.headScale} position={[0, 0.9 * (1 - look.headScale) * 0.2, 0]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[0.24, 0.24, 0.22]} />
          <meshLambertMaterial color={look.skin} />
        </mesh>

        <HairMeshes look={look} />

        <mesh position={[-0.14, 0.9, 0]} castShadow>
          <boxGeometry args={[0.04, 0.07, 0.05]} />
          <meshLambertMaterial color={look.skinShade} />
        </mesh>
        <mesh position={[0.14, 0.9, 0]} castShadow>
          <boxGeometry args={[0.04, 0.07, 0.05]} />
          <meshLambertMaterial color={look.skinShade} />
        </mesh>

        <mesh position={[-0.055, 0.93, 0.115]}>
          <boxGeometry args={[0.055, 0.04, 0.02]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.055, 0.93, 0.115]}>
          <boxGeometry args={[0.055, 0.04, 0.02]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.055, 0.93, 0.125]}>
          <boxGeometry args={[0.028, 0.028, 0.02]} />
          <meshBasicMaterial color={look.eye} />
        </mesh>
        <mesh position={[0.055, 0.93, 0.125]}>
          <boxGeometry args={[0.028, 0.028, 0.02]} />
          <meshBasicMaterial color={look.eye} />
        </mesh>

        <mesh position={[-0.055, 0.97, 0.12]}>
          <boxGeometry args={[0.06, look.browThick, 0.015]} />
          <meshBasicMaterial color={look.hair} />
        </mesh>
        <mesh position={[0.055, 0.97, 0.12]}>
          <boxGeometry args={[0.06, look.browThick, 0.015]} />
          <meshBasicMaterial color={look.hair} />
        </mesh>

        <mesh position={[0, 0.88, 0.13]} castShadow scale={look.noseScale}>
          <boxGeometry args={[0.035, 0.04, 0.04]} />
          <meshLambertMaterial color={look.skinShade} />
        </mesh>
        <mesh position={[0, mouthY, 0.12]}>
          <boxGeometry args={[mouthW, look.mouth === "smile" ? 0.025 : 0.018, 0.02]} />
          <meshBasicMaterial color={look.mouthColor} />
        </mesh>

        {look.facialHair === "mustache" ? (
          <mesh position={[0, 0.845, 0.125]}>
            <boxGeometry args={[0.08, 0.018, 0.02]} />
            <meshBasicMaterial color={look.hair} />
          </mesh>
        ) : null}
        {look.facialHair === "goatee" ? (
          <mesh position={[0, 0.8, 0.12]}>
            <boxGeometry args={[0.045, 0.05, 0.03]} />
            <meshBasicMaterial color={look.hair} />
          </mesh>
        ) : null}
        {look.facialHair === "beard" ? (
          <>
            <mesh position={[0, 0.8, 0.11]}>
              <boxGeometry args={[0.18, 0.08, 0.06]} />
              <meshBasicMaterial color={look.hair} />
            </mesh>
            <mesh position={[-0.1, 0.86, 0.06]}>
              <boxGeometry args={[0.05, 0.1, 0.1]} />
              <meshBasicMaterial color={look.hair} />
            </mesh>
            <mesh position={[0.1, 0.86, 0.06]}>
              <boxGeometry args={[0.05, 0.1, 0.1]} />
              <meshBasicMaterial color={look.hair} />
            </mesh>
          </>
        ) : null}

        {look.accessory === "glasses" || look.accessory === "round_glasses" ? (
          <>
            <mesh position={[-0.055, 0.93, 0.135]}>
              <boxGeometry
                args={
                  look.accessory === "round_glasses"
                    ? [0.07, 0.07, 0.015]
                    : [0.07, 0.045, 0.015]
                }
              />
              <meshBasicMaterial color="#263238" transparent opacity={0.55} />
            </mesh>
            <mesh position={[0.055, 0.93, 0.135]}>
              <boxGeometry
                args={
                  look.accessory === "round_glasses"
                    ? [0.07, 0.07, 0.015]
                    : [0.07, 0.045, 0.015]
                }
              />
              <meshBasicMaterial color="#263238" transparent opacity={0.55} />
            </mesh>
            <mesh position={[0, 0.93, 0.135]}>
              <boxGeometry args={[0.03, 0.012, 0.012]} />
              <meshBasicMaterial color="#455a64" />
            </mesh>
          </>
        ) : null}
        {look.accessory === "earring" ? (
          <mesh position={[0.15, 0.86, 0.02]}>
            <boxGeometry args={[0.025, 0.025, 0.025]} />
            <meshBasicMaterial color="#ffd54f" />
          </mesh>
        ) : null}
      </group>

      <group ref={leftArmRef} position={[-0.2, 0.62, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.08, 0.28, 0.08]} />
          <meshLambertMaterial color={color} />
        </mesh>
        <mesh position={[0, -0.28, 0]} castShadow>
          <boxGeometry args={[0.07, 0.06, 0.07]} />
          <meshLambertMaterial color={look.skin} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.2, 0.62, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.08, 0.28, 0.08]} />
          <meshLambertMaterial color={color} />
        </mesh>
        <mesh position={[0, -0.28, 0]} castShadow>
          <boxGeometry args={[0.07, 0.06, 0.07]} />
          <meshLambertMaterial color={look.skin} />
        </mesh>
      </group>
      <group ref={leftLegRef} position={[-0.08, 0.28, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.09, 0.28, 0.09]} />
          <meshLambertMaterial color={look.pants} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.08, 0.28, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.09, 0.28, 0.09]} />
          <meshLambertMaterial color={look.pants} />
        </mesh>
      </group>

      {texture ? (
        <Billboard position={[0, 1.42, 0]} follow>
          <mesh renderOrder={20}>
            <planeGeometry args={[1.45, 0.3]} />
            <meshBasicMaterial
              map={texture}
              transparent
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </Billboard>
      ) : null}

      {speechTexture ? (
        <Billboard position={[0, 2.05, 0]} follow>
          <mesh renderOrder={21}>
            <planeGeometry args={[1.85, 0.65]} />
            <meshBasicMaterial
              map={speechTexture}
              transparent
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </Billboard>
      ) : null}
    </group>
  );
});
