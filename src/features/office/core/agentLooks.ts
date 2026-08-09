/** Deterministic face / body looks for procedural office agents. */

export type HairStyle =
  | "short"
  | "long"
  | "bun"
  | "buzz"
  | "side"
  | "bangs"
  | "ponytail"
  | "bald";

export type AccAccessory = "none" | "glasses" | "round_glasses" | "earring";
export type FacialHair = "none" | "mustache" | "beard" | "goatee";
export type MouthStyle = "smile" | "neutral" | "wide" | "small";
export type CollarStyle = "placket" | "vneck" | "crew" | "tie";

export type AgentLook = {
  skin: string;
  skinShade: string;
  hair: string;
  hairStyle: HairStyle;
  eye: string;
  browThick: number;
  mouth: MouthStyle;
  mouthColor: string;
  facialHair: FacialHair;
  accessory: AccAccessory;
  collar: CollarStyle;
  pants: string;
  headScale: number;
  bodyScale: number;
  noseScale: number;
};

const SKINS = [
  "#ffe0bd",
  "#f5c9a0",
  "#e8b896",
  "#d4a574",
  "#c68642",
  "#f1d0b0",
  "#e0a878",
  "#b9805a",
] as const;

const HAIRS = [
  "#1a1a1a",
  "#3e2723",
  "#5d4037",
  "#4a3728",
  "#2c1810",
  "#6d4c41",
  "#8d6e63",
  "#37474f",
  "#c9a227",
  "#b71c1c",
  "#455a64",
  "#efebe9",
] as const;

const EYES = [
  "#1a237e",
  "#33691e",
  "#3e2723",
  "#01579b",
  "#4a148c",
  "#006064",
  "#212121",
  "#5d4037",
] as const;

const PANTS = [
  "#37474f",
  "#263238",
  "#455a64",
  "#1a237e",
  "#3e2723",
  "#212121",
  "#546e7a",
] as const;

const HAIR_STYLES: HairStyle[] = [
  "short",
  "long",
  "bun",
  "buzz",
  "side",
  "bangs",
  "ponytail",
  "bald",
];

const ACCESSORIES: AccAccessory[] = [
  "none",
  "none",
  "glasses",
  "round_glasses",
  "earring",
  "none",
];

const FACIAL: FacialHair[] = [
  "none",
  "none",
  "none",
  "mustache",
  "beard",
  "goatee",
  "none",
];

const MOUTHS: MouthStyle[] = ["smile", "neutral", "wide", "small"];
const COLLARS: CollarStyle[] = ["placket", "vneck", "crew", "tie"];

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(list: readonly T[], n: number): T {
  return list[n % list.length]!;
}

function shadeHex(hex: string, amount: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return hex;
  const num = Number.parseInt(raw, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 255) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 255) + amount));
  const b = Math.min(255, Math.max(0, (num & 255) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Stable look from agent id + name so the same person always looks the same.
 */
export function buildAgentLook(
  agentId: string,
  name: string,
  shirtColor = "#4fc3f7",
): AgentLook {
  const h = hashString(`${agentId}|${name}|${shirtColor}`);
  const a = (h >>> 0) % 97;
  const b = (h >>> 8) % 89;
  const c = (h >>> 16) % 83;
  const d = (h >>> 24) % 79;

  const skin = pick(SKINS, a);
  const hairStyle = pick(HAIR_STYLES, b);
  const facialHair = hairStyle === "bun" || hairStyle === "ponytail"
    ? "none"
    : pick(FACIAL, c);

  return {
    skin,
    skinShade: shadeHex(skin, -18),
    hair: pick(HAIRS, c + a),
    hairStyle,
    eye: pick(EYES, d),
    browThick: 0.012 + (a % 4) * 0.004,
    mouth: pick(MOUTHS, b + d),
    mouthColor: pick(["#c62828", "#ad1457", "#6d4c41", "#b71c1c"], a),
    facialHair,
    accessory: pick(ACCESSORIES, d + b),
    collar: pick(COLLARS, a + c),
    pants: pick(PANTS, b),
    headScale: 0.92 + (a % 5) * 0.03,
    bodyScale: 0.94 + (b % 4) * 0.03,
    noseScale: 0.85 + (c % 5) * 0.08,
  };
}
