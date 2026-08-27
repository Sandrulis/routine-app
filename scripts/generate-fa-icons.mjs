import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const metadataPath = join(
  root,
  "node_modules/@fortawesome/fontawesome-free/metadata/icon-families.json",
);
const outPath = join(root, "app/lib/fontawesome-icons.ts");
const nameRe = /^[a-z0-9-]+$/;

const data = JSON.parse(readFileSync(metadataPath, "utf8"));
const icons = [];

for (const [name, meta] of Object.entries(data)) {
  if (!nameRe.test(name)) continue;
  const free = meta.familyStylesByLicense?.free ?? [];
  const styles = new Set(
    free.filter((entry) => entry.family === "classic").map((entry) => entry.style),
  );
  if (styles.has("solid")) icons.push(`fas fa-${name}`);
  if (styles.has("brands")) icons.push(`fab fa-${name}`);
}

icons.sort((a, b) => a.localeCompare(b));

const body = icons.map((icon) => `  ${JSON.stringify(icon)},`).join("\n");
const source = `/* Generated from @fortawesome/fontawesome-free metadata. Run: node scripts/generate-fa-icons.mjs */

export const FONT_AWESOME_ICON_OPTIONS = [
${body}
] as const;

export type FontAwesomeIconOption = (typeof FONT_AWESOME_ICON_OPTIONS)[number];
`;

writeFileSync(outPath, source);
console.log(`wrote ${icons.length} icons to app/lib/fontawesome-icons.ts`);
