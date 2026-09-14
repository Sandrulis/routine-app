"use client";

import { useTranslations } from "@/app/components/translations-provider";

export const ALPHABET_LETTERS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
] as const;

export type AlphabetLetter = (typeof ALPHABET_LETTERS)[number];
export type AlphabetFilterValue = "all" | AlphabetLetter | "#";

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function alphabetKeyFromName(name: string): AlphabetLetter | "#" | null {
  const first = name.trim().charAt(0);
  if (!first) return null;
  if (first >= "0" && first <= "9") return "#";
  const letter = stripDiacritics(first).toLocaleUpperCase("en-US");
  if (letter >= "A" && letter <= "Z") return letter as AlphabetLetter;
  return null;
}

export function alphabetCounts(names: string[]): Record<string, number> {
  const counts: Record<string, number> = { "#": 0 };
  for (const letter of ALPHABET_LETTERS) counts[letter] = 0;
  for (const name of names) {
    const key = alphabetKeyFromName(name);
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function AlphabetFilter({
  value,
  counts,
  onChange,
}: {
  value: AlphabetFilterValue;
  counts: Record<string, number>;
  onChange: (next: AlphabetFilterValue) => void;
}) {
  const { t } = useTranslations();
  const items: { id: AlphabetFilterValue; label: string; ariaLabel?: string }[] = [
    { id: "all", label: t("common.all", "Visi") },
    ...ALPHABET_LETTERS.map((letter) => ({ id: letter as AlphabetFilterValue, label: letter })),
    {
      id: "#",
      label: "#",
      ariaLabel: t("admin.alphabet.digits", "Cipari"),
    },
  ];

  return (
    <div
      className="inline-flex max-w-full flex-wrap rounded-2xl border border-zinc-200 bg-zinc-50 p-1"
      role="group"
      aria-label={t("admin.alphabet.label", "Filtrēt pēc sākuma burta")}
    >
      {items.map((item) => {
        const active = item.id === value;
        const empty = item.id !== "all" && (counts[item.id] ?? 0) === 0;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            aria-label={item.ariaLabel}
            disabled={empty}
            onClick={() => onChange(item.id)}
            className={`min-w-8 rounded-xl px-2.5 py-1.5 text-[13px] font-semibold transition ${
              active
                ? "bg-white text-zinc-900 shadow-sm"
                : empty
                  ? "cursor-not-allowed text-zinc-300"
                  : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
