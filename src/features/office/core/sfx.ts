/** Lightweight Web Audio beeps + toast helpers (no asset files required). */

export type OfficeToast = {
  id: string;
  message: string;
  createdAt: number;
};

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

export function playBeep(
  kind: "place" | "preset" | "sit" | "undo",
  muted: boolean,
) {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  void ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  const table: Record<typeof kind, { f: number; d: number; type: OscillatorType }> =
    {
      place: { f: 520, d: 0.06, type: "sine" },
      preset: { f: 660, d: 0.12, type: "triangle" },
      sit: { f: 380, d: 0.08, type: "sine" },
      undo: { f: 280, d: 0.07, type: "sine" },
    };
  const tone = table[kind];
  osc.type = tone.type;
  osc.frequency.setValueAtTime(tone.f, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.d);
  osc.start(now);
  osc.stop(now + tone.d + 0.02);
}
