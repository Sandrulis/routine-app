import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "app/lib/i18n");
const catalogDir = path.join(root, "_catalog");
const extraLangs = ["de", "fr", "es", "nl", "da", "no", "fi", "pl", "lt", "et", "it", "sv"];

function catalogToTs(lang, catalog) {
  const body = Object.entries(catalog)
    .map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)},`)
    .join("\n");
  return `export const ${lang}: Record<string, string> = {\n${body}\n};\n`;
}

function placeholders(value) {
  return [...String(value).matchAll(/\{[A-Za-z0-9_]+\}/g)].map((match) => match[0]).sort();
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function main() {
  const mode = process.argv[2] ?? "from-json";
  const en = loadJson(path.join(catalogDir, "en.json"));
  fs.mkdirSync(catalogDir, { recursive: true });

  if (mode === "stubs") {
    for (const lang of extraLangs) {
      const jsonPath = path.join(catalogDir, `${lang}.json`);
      if (!fs.existsSync(jsonPath)) {
        fs.writeFileSync(jsonPath, `${JSON.stringify(en, null, 2)}\n`);
      }
      const catalog = loadJson(jsonPath);
      fs.writeFileSync(path.join(root, `messages-${lang}.ts`), catalogToTs(lang, catalog));
      console.log(`stub ${lang} ${Object.keys(catalog).length} keys`);
    }
    return;
  }

  let failed = false;
  for (const lang of extraLangs) {
    const jsonPath = path.join(catalogDir, `${lang}.json`);
    if (!fs.existsSync(jsonPath)) {
      console.error(`missing ${jsonPath}`);
      failed = true;
      continue;
    }
    const catalog = loadJson(jsonPath);
    const missing = Object.keys(en).filter((key) => !(key in catalog));
    const extra = Object.keys(catalog).filter((key) => !(key in en));
    const placeholderMismatches = [];
    for (const key of Object.keys(en)) {
      if (!(key in catalog)) continue;
      const left = placeholders(en[key]).join(",");
      const right = placeholders(catalog[key]).join(",");
      if (left !== right) placeholderMismatches.push(key);
    }
    if (missing.length || extra.length || placeholderMismatches.length) {
      failed = true;
      console.error(
        `${lang}: missing=${missing.length} extra=${extra.length} placeholders=${placeholderMismatches.length}`,
      );
      if (missing.length) console.error("  missing", missing.slice(0, 15).join(", "));
      if (extra.length) console.error("  extra", extra.slice(0, 15).join(", "));
      if (placeholderMismatches.length) {
        console.error("  placeholders", placeholderMismatches.slice(0, 15).join(", "));
      }
    }
    fs.writeFileSync(path.join(root, `messages-${lang}.ts`), catalogToTs(lang, catalog));
    console.log(`wrote messages-${lang}.ts (${Object.keys(catalog).length} keys)`);
  }
  if (failed) process.exit(1);
}

main();
