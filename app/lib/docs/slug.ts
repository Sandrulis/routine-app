const LATVIAN_MAP: Record<string, string> = {
  ā: "a",
  č: "c",
  ē: "e",
  ģ: "g",
  ī: "i",
  ķ: "k",
  ļ: "l",
  ņ: "n",
  š: "s",
  ū: "u",
  ž: "z",
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugifyDocsTitle(value: string): string {
  const mapped = value
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => LATVIAN_MAP[char] ?? char)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return mapped || "page";
}

export function normalizeDocsSlug(value: string, fallbackTitle = ""): string {
  const trimmed = value.trim().toLowerCase();
  if (SLUG_RE.test(trimmed) && trimmed.length <= 80) return trimmed;
  return slugifyDocsTitle(trimmed || fallbackTitle);
}

export function isValidDocsSlug(value: string): boolean {
  return SLUG_RE.test(value) && value.length <= 80;
}

/** Public URL slug from the article/category title in the active language. */
export function localizedDocsSlug(title: string, canonicalSlug: string): string {
  const fromTitle = slugifyDocsTitle(title);
  return isValidDocsSlug(fromTitle) ? fromTitle : canonicalSlug;
}

export function uniqueDocsSlug(
  desired: string,
  canonicalSlug: string,
  used: Set<string>,
): string {
  const primary = isValidDocsSlug(desired) ? desired : canonicalSlug;
  if (!used.has(primary)) return primary;
  if (canonicalSlug !== primary && !used.has(canonicalSlug)) return canonicalSlug;
  let n = 2;
  while (used.has(`${primary}-${n}`)) n += 1;
  return `${primary}-${n}`;
}
