import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "app/lib/i18n");
const catalogDir = path.join(root, "_catalog");
const extraLangs = [
  "ru",
  "de",
  "fr",
  "es",
  "nl",
  "da",
  "no",
  "fi",
  "pl",
  "lt",
  "et",
  "it",
  "sv",
];

function catalogToTs(lang, catalog) {
  const body = Object.entries(catalog)
    .map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)},`)
    .join("\n");
  return `export const ${lang}: Record<string, string> = {\n${body}\n};\n`;
}

function placeholders(value) {
  return [...String(value).matchAll(/\{[A-Za-z0-9_]+\}/g)].map((match) => match[0]).sort();
}

function parseQuotedStringMap(text) {
  const map = {};
  const re = /"((?:\\.|[^"\\])+)"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let match;
  while ((match = re.exec(text))) {
    const key = JSON.parse(`"${match[1]}"`);
    const value = JSON.parse(`"${match[2]}"`);
    map[key] = value;
  }
  return map;
}

function parseMessagesTs(source) {
  const lvStart = source.indexOf("\n  lv: {");
  const enStart = source.indexOf("\n  en: {");
  if (lvStart < 0 || enStart < 0) {
    throw new Error("Could not find lv/en catalogs in messages.ts");
  }
  return {
    lv: parseQuotedStringMap(source.slice(lvStart, enStart)),
    en: parseQuotedStringMap(source.slice(enStart)),
  };
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function reportDiff(label, canonicalKeys, catalog, en) {
  const missing = canonicalKeys.filter((key) => !(key in catalog));
  const extra = Object.keys(catalog).filter((key) => !canonicalKeys.includes(key));
  const placeholderMismatches = canonicalKeys.filter((key) => {
    if (!(key in catalog)) return false;
    return placeholders(en[key]).join(",") !== placeholders(catalog[key]).join(",");
  });
  if (missing.length || extra.length || placeholderMismatches.length) {
    console.error(
      `${label}: missing=${missing.length} extra=${extra.length} placeholders=${placeholderMismatches.length}`,
    );
    if (missing.length) console.error("  missing", missing.join(", "));
    if (extra.length) console.error("  extra", extra.join(", "));
    if (placeholderMismatches.length) {
      console.error("  placeholders", placeholderMismatches.join(", "));
    }
    return false;
  }
  return true;
}

function main() {
  const messagesSource = fs.readFileSync(path.join(root, "messages.ts"), "utf8");
  const { lv, en } = parseMessagesTs(messagesSource);
  const lvKeys = Object.keys(lv);
  const enKeys = Object.keys(en);
  fs.mkdirSync(catalogDir, { recursive: true });

  let ok = true;
  const lvMissing = enKeys.filter((key) => !(key in lv));
  const enMissing = lvKeys.filter((key) => !(key in en));
  const lvEnPlaceholder = enKeys.filter((key) => {
    if (!(key in lv)) return false;
    return placeholders(en[key]).join(",") !== placeholders(lv[key]).join(",");
  });
  if (lvMissing.length || enMissing.length || lvEnPlaceholder.length) {
    ok = false;
    console.error(
      `messages.ts lv/en: lvMissing=${lvMissing.length} enMissing=${enMissing.length} placeholders=${lvEnPlaceholder.length}`,
    );
    if (lvMissing.length) console.error("  lv missing", lvMissing.join(", "));
    if (enMissing.length) console.error("  en missing", enMissing.join(", "));
    if (lvEnPlaceholder.length) {
      console.error("  placeholders", lvEnPlaceholder.join(", "));
    }
  }

  writeJson(path.join(catalogDir, "en.json"), en);
  console.log(`wrote _catalog/en.json (${enKeys.length} keys)`);

  const mode = process.argv[2] ?? "check";
  if (mode === "stubs") {
    for (const lang of extraLangs) {
      const jsonPath = path.join(catalogDir, `${lang}.json`);
      if (!fs.existsSync(jsonPath)) {
        writeJson(jsonPath, en);
      }
      const catalog = loadJson(jsonPath);
      fs.writeFileSync(path.join(root, `messages-${lang}.ts`), catalogToTs(lang, catalog));
      console.log(`stub ${lang} ${Object.keys(catalog).length} keys`);
    }
    return;
  }

  let generatedChanged = false;
  for (const lang of extraLangs) {
    const jsonPath = path.join(catalogDir, `${lang}.json`);
    if (!fs.existsSync(jsonPath)) {
      console.error(`missing ${jsonPath}`);
      ok = false;
      continue;
    }
    const catalog = loadJson(jsonPath);
    if (!reportDiff(lang, enKeys, catalog, en)) ok = false;
    const next = catalogToTs(lang, catalog);
    const outPath = path.join(root, `messages-${lang}.ts`);
    const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";
    if (prev !== next) {
      generatedChanged = true;
      fs.writeFileSync(outPath, next);
    }
    console.log(`wrote messages-${lang}.ts (${Object.keys(catalog).length} keys)`);
  }

  if (generatedChanged && process.env.GITHUB_ACTIONS) {
    ok = false;
    console.error(
      "Generated messages-*.ts files were out of date. Run npm run i18n:check locally and commit the result.",
    );
  }

  if (!ok) {
    console.error(
      "\ni18n check failed. Add the same keys to messages.ts (lv+en) and every language in app/lib/i18n/_catalog/{lang}.json (do not copy English as a filler), then run npm run i18n:check.",
    );
    process.exit(1);
  }
}

main();
