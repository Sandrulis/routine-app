/**
 * Generate Gmail extension icons (static PNGs in manifest).
 * Matches siteInitialsFaviconDataUrl default: black (#18181b) + white "T".
 *
 * Usage: node extensions/gmail/scripts/generate-icons.mjs
 * Optional: node extensions/gmail/scripts/generate-icons.mjs --color black
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const COLORS = {
  black: { bg: "#18181b", fg: "#ffffff" },
  midnight: { bg: "#0f172a", fg: "#ffffff" },
  slate: { bg: "#334155", fg: "#ffffff" },
  zinc: { bg: "#71717a", fg: "#ffffff" },
  teal: { bg: "#0f766e", fg: "#ffffff" },
};

const scriptDir = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(scriptDir, "..", "icons");
const sizes = [16, 48, 128];

function parseColorArg() {
  const index = process.argv.indexOf("--color");
  const id = index >= 0 ? process.argv[index + 1] : "black";
  return COLORS[id] ? id : "black";
}

async function renderIcon(size, tone) {
  const fontSize = Math.round(size * 0.55);
  const radius = Math.round(size * 0.1875);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${tone.bg}"/>
  <text x="50%" y="50%" dy="0.36em" text-anchor="middle"
    font-family="ui-sans-serif,system-ui,sans-serif" font-size="${fontSize}" font-weight="800" fill="${tone.fg}">T</text>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

const colorId = parseColorArg();
const tone = COLORS[colorId];

await mkdir(iconsDir, { recursive: true });
for (const size of sizes) {
  const buffer = await renderIcon(size, tone);
  const path = join(iconsDir, `icon${size}.png`);
  await writeFile(path, buffer);
  console.log(`Wrote ${path}`);
}

console.log(`Done (${colorId}: ${tone.bg}). Reload extension in chrome://extensions.`);
