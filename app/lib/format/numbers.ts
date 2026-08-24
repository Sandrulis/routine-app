/** Insert space thousand separators into an already-formatted numeric string. */
export function addThousandSeparators(formatted: string): string {
  const [integer, fraction] = formatted.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

/** Non-negative integer with space thousand separators (e.g. vote counts). */
export function formatInteger(value: number): string {
  return addThousandSeparators(String(Math.max(0, Math.trunc(value))));
}

/** Euro amount with space thousand separators: `€ 1 234.56`. */
export function formatEuro(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return `€ ${addThousandSeparators(rounded.toFixed(2))}`;
}
