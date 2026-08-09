/** Shared helpers for multi-line speech bubbles (canvas). */

export function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let current = words[0]!;
  for (let i = 1; i < words.length; i += 1) {
    const word = words[i]!;
    const trial = `${current} ${word}`;
    if (ctx.measureText(trial).width <= maxWidth) {
      current = trial;
    } else {
      lines.push(current);
      current = word;
    }
  }
  lines.push(current);
  return lines;
}

export function thinkingDots(elapsedMs: number): string {
  const n = Math.floor(elapsedMs / 400) % 3;
  return `در حال فکر${".".repeat(n + 1)}`;
}
