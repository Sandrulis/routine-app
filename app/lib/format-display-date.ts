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

/** Datums un laiks UI: dd.mm.yy hh:mm */
export function formatDisplayDateTimeDdMmYy(value: string): string {
  const date = parseDisplayDate(value);
  if (!date) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${formatDateParts(date, 2)} ${hours}:${minutes}`;
}

/** Šodienas datums glabāšanai (YYYY-MM-DD). */
export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Kalendārās dienas no šodienas līdz datumam (nākotne +, pagātne -). */
export function calendarDaysFromToday(value: string): number | null {
  const date = parseDisplayDate(value);
  if (!date) return null;
  const today = parseDisplayDate(`${todayIsoDate()}T12:00:00`);
  if (!today) return null;
  const target = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const current = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - current) / 86_400_000);
}
