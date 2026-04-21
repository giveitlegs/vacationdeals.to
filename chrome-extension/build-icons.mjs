#!/usr/bin/env node
/**
 * Generate icon16/48/128 PNGs from icons/icon.svg using sharp.
 * Usage:  node build-icons.mjs
 *
 * Requires sharp:  npm i -g sharp  OR  pnpm add -w sharp
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICON_DIR = resolve(__dirname, "icons");
const SVG = readFileSync(resolve(ICON_DIR, "icon.svg"));

const sizes = [16, 48, 128];

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("sharp is required. Install it first:\n  pnpm add -w sharp");
  process.exit(1);
}

for (const size of sizes) {
  const out = resolve(ICON_DIR, `icon${size}.png`);
  await sharp(SVG).resize(size, size).png().toFile(out);
  console.log(`wrote ${out}`);
}
