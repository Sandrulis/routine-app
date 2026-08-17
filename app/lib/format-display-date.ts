function parseDisplayDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const date = new Date(
    trimmed.includes("T") ? trimmed : `${trimmed}T12:00:00`,
  );
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function formatDateParts(date: Date, yearDigits: 2 | 4): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year =
    yearDigits === 2
      ? String(date.getFullYear()).slice(-2)
      : String(date.getFullYear());

  return `${day}.${month}.${year}`;
}

/** Noklusējuma datuma attēlojums UI: dd.mm.yy */
export function formatDisplayDateDdMmYy(value: string): string {
  const date = parseDisplayDate(value);
  if (!date) return "";
  return formatDateParts(date, 2);
}

/** Šodienas datums glabāšanai (YYYY-MM-DD). */
export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
