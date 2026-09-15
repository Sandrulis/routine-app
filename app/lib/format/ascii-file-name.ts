/**
 * Transliterate letters with diacritics (ā→a, č→c, ü→u, ß→ss, …) to ASCII.
 * Used for Gmail plugin uploads and Content-Disposition filename fallbacks
 * so names stay readable instead of turning into `_` / other symbols.
 */

/** Letters that do not become ASCII from Unicode NFKD + combining-mark strip. */
const LETTER_MAP: Record<string, string> = {
  ß: "ss",
  ẞ: "Ss",
  æ: "ae",
  Æ: "Ae",
  œ: "oe",
  Œ: "Oe",
  ø: "o",
  Ø: "O",
  ł: "l",
  Ł: "L",
  đ: "d",
  Đ: "D",
  ð: "d",
  Ð: "D",
  þ: "th",
  Þ: "Th",
  ı: "i",
  ħ: "h",
  Ħ: "H",
  ŋ: "n",
  Ŋ: "N",
  ŧ: "t",
  Ŧ: "T",
  ĸ: "k",
  ſ: "s",
  ŉ: "n",
  "\u00a0": " ",
  "\u2013": "-",
  "\u2014": "-",
  "\u2018": "'",
  "\u2019": "'",
  "\u201c": "",
  "\u201d": "",
  "\u2026": "...",
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "j",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "sh",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  і: "i",
  ї: "i",
  є: "ie",
  ґ: "g",
  ў: "u",
  ђ: "dj",
  ј: "j",
  љ: "lj",
  њ: "nj",
  ћ: "c",
  џ: "dz",
  А: "A",
  Б: "B",
  В: "V",
  Г: "G",
  Д: "D",
  Е: "E",
  Ё: "E",
  Ж: "Zh",
  З: "Z",
  И: "I",
  Й: "J",
  К: "K",
  Л: "L",
  М: "M",
  Н: "N",
  О: "O",
  П: "P",
  Р: "R",
  С: "S",
  Т: "T",
  У: "U",
  Ф: "F",
  Х: "H",
  Ц: "C",
  Ч: "Ch",
  Ш: "Sh",
  Щ: "Sh",
  Ъ: "",
  Ы: "Y",
  Ь: "",
  Э: "E",
  Ю: "Yu",
  Я: "Ya",
  І: "I",
  Ї: "I",
  Є: "Ie",
  Ґ: "G",
  Ў: "U",
  Ђ: "Dj",
  Ј: "J",
  Љ: "Lj",
  Њ: "Nj",
  Ћ: "C",
  Џ: "Dz",
  α: "a",
  β: "b",
  γ: "g",
  δ: "d",
  ε: "e",
  ζ: "z",
  η: "i",
  θ: "th",
  ι: "i",
  κ: "k",
  λ: "l",
  μ: "m",
  ν: "n",
  ξ: "x",
  ο: "o",
  π: "p",
  ρ: "r",
  σ: "s",
  ς: "s",
  τ: "t",
  υ: "y",
  φ: "f",
  χ: "ch",
  ψ: "ps",
  ω: "o",
  Α: "A",
  Β: "B",
  Γ: "G",
  Δ: "D",
  Ε: "E",
  Ζ: "Z",
  Η: "I",
  Θ: "Th",
  Ι: "I",
  Κ: "K",
  Λ: "L",
  Μ: "M",
  Ν: "N",
  Ξ: "X",
  Ο: "O",
  Π: "P",
  Ρ: "R",
  Σ: "S",
  Τ: "T",
  Υ: "Y",
  Φ: "F",
  Χ: "Ch",
  Ψ: "Ps",
  Ω: "O",
};

const UNSAFE_FILE_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;

export function transliterateToAscii(value: string): string {
  const folded = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  return Array.from(folded, (char) => LETTER_MAP[char] ?? char).join("");
}

function cleanAsciiSegment(value: string): string {
  return transliterateToAscii(value)
    .replace(UNSAFE_FILE_CHARS, " ")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/["\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Readable ASCII file name: `rēķins.pdf` → `rekins.pdf`, `Straße.pdf` → `Strasse.pdf`. */
export function asciiSafeFileName(name: string, fallback = "file"): string {
  const trimmed = String(name || "")
    .replace(/[\r\n]+/g, " ")
    .trim();
  if (!trimmed) return fallback;

  const lastDot = trimmed.lastIndexOf(".");
  const hasExt = lastDot > 0 && lastDot < trimmed.length - 1;
  const base = hasExt ? trimmed.slice(0, lastDot) : trimmed;
  const ext = hasExt ? trimmed.slice(lastDot + 1) : "";

  const asciiBase = cleanAsciiSegment(base) || fallback;
  const asciiExt = cleanAsciiSegment(ext).replace(/\s+/g, "");
  const joined = asciiExt ? `${asciiBase}.${asciiExt}` : asciiBase;
  return joined.slice(0, 180) || fallback;
}
