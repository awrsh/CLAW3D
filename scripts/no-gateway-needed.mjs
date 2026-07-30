#!/usr/bin/env node

/**
 * Friendly stub for old-version scripts (demo-gateway, hermes-adapter, …).
 * This sample is a standalone 3D office — no OpenClaw gateway is required.
 */
const script = process.argv[2] || "that command";

console.log(`
┌─────────────────────────────────────────────────────────┐
│  Claw3D Sample — gateway لازم نیست                      │
└─────────────────────────────────────────────────────────┘

  «${script}» مربوط به old-version است و اینجا وجود ندارد.

  برای دیدن آفیس فقط این را بزنید:

    npm run dev

  بعد مرورگر: http://localhost:3000
  ابعاد اتاق را از پنل Tools (پایین چپ) عوض کنید.
`);

process.exit(0);
