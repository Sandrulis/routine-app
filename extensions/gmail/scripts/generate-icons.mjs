/**
 * Chrome toolbar icons (`icon16/48/128.png`).
 * Uses `icons/logo.png` when present (uploaded TASQIN mark); otherwise the
 * same initials avatar as the site favicon fallback (black + system name).
 *
 * Usage: node extensions/gmail/scripts/generate-icons.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(scriptDir, "..", "icons");
const sourcePath = join(iconsDir, "logo.png");
const sizes = [16, 48, 128];
const INITIALS_BG = "#18181b";
const INITIALS_FG = "#ffffff";

function initialsSvg(size) {
  const radius = Math.round(size * 0.1875);
  const fontSize = Math.round(size * 0.55);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${INITIALS_BG}"/>
  <text x="50%" y="50%" dy="0.36em" text-anchor="middle"
    font-family="ui-sans-serif,system-ui,sans-serif" font-size="${fontSize}" font-weight="800" fill="${INITIALS_FG}">T</text>
</svg>`;
}

await mkdir(iconsDir, { recursive: true });

let source = null;
try {
  source = await readFile(sourcePath);
} catch {
  source = null;
}

for (const size of sizes) {
  const buffer = source
    ? await sharp(source)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer()
    : await sharp(Buffer.from(initialsSvg(size))).png().toBuffer();
  const path = join(iconsDir, `icon${size}.png`);
  await writeFile(path, buffer);
  console.log(`Wrote ${path}${source ? " (logo)" : " (initials)"}`);
}

console.log("Done. Reload the extension in chrome://extensions.");
