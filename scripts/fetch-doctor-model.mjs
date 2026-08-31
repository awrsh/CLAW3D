#!/usr/bin/env node
/**
 * Place the Sketchfab "Doctor Walking" GLB at public/models/factory/doctor-walking.glb
 *
 * Sketchfab: https://sketchfab.com/3d-models/doctor-walking-1af72132dfd0473a920e4d09497231e7
 * Author: 3DTree
 *
 * This model is NOT publicly downloadable via API (isDownloadable: false).
 * Purchase / license from 3DTree and export GLB, then copy to:
 *   public/models/factory/doctor-walking.glb
 *
 * Optional: set SKETCHFAB_API_TOKEN if your account has download access.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MODEL_UID = "1af72132dfd0473a920e4d09497231e7";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "models", "factory", "doctor-walking.glb");

async function trySketchfabDownload(token) {
  const res = await fetch(
    `https://api.sketchfab.com/v3/models/${MODEL_UID}/download`,
    { headers: { Authorization: `Token ${token}` } },
  );
  if (!res.ok) {
    throw new Error(`Sketchfab download failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const glb = data.glb ?? data.gltf ?? data.source;
  const url = typeof glb === "string" ? glb : glb?.url;
  if (!url) throw new Error("No GLB URL in Sketchfab response");

  const fileRes = await fetch(url);
  if (!fileRes.ok) throw new Error(`GLB fetch failed: ${fileRes.status}`);
  const buf = Buffer.from(await fileRes.arrayBuffer());
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log(`Saved ${OUT} (${buf.length} bytes)`);
}

async function main() {
  if (fs.existsSync(OUT) && fs.statSync(OUT).size > 10_000) {
    console.log(`Already present: ${OUT}`);
    return;
  }

  const token = process.env.SKETCHFAB_API_TOKEN;
  if (token) {
    await trySketchfabDownload(token);
    return;
  }

  console.log(`
Doctor Walking GLB not found at:
  ${OUT}

This Sketchfab model cannot be auto-downloaded without a license token.

Steps:
  1. Open https://sketchfab.com/3d-models/doctor-walking-1af72132dfd0473a920e4d09497231e7
  2. Download GLB from 3DTree / Sketchfab (if licensed)
  3. Save as: public/models/factory/doctor-walking.glb

Or set SKETCHFAB_API_TOKEN and re-run:
  npm run fetch:doctor-model

Until the GLB exists, workers fall back to procedural capsules.
`);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
