export type CalendarFeedEvent = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  url: string;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatUtcStamp(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}` +
    `T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`
  );
}

function isoDateToIcs(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

function addOneDayIso(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-${pad2(next.getUTCDate())}`;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\n|\r/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function foldIcsLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const chunks: string[] = [];
  let start = 0;
  while (start < bytes.length) {
    const limit = start === 0 ? 75 : 74;
    let end = Math.min(start + limit, bytes.length);
    while (end > start && (bytes[end] & 0b1100_0000) === 0b1000_0000) {
      end -= 1;
    }
    if (end === start) end = Math.min(start + limit, bytes.length);
    const slice = new TextDecoder().decode(bytes.slice(start, end));
    chunks.push(start === 0 ? slice : ` ${slice}`);
    start = end;
  }
  return chunks.join("\r\n");
}

function icsLines(lines: string[]): string {
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

export function buildCalendarIcs(input: {
  calendarName: string;
  events: CalendarFeedEvent[];
}): string {
  const stamp = formatUtcStamp(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TASQIN//Calendar Feed//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(input.calendarName)}`,
  ];

  for (const event of input.events) {
    const start = event.startDate <= event.dueDate ? event.startDate : event.dueDate;
    const inclusiveEnd = event.dueDate >= event.startDate ? event.dueDate : event.startDate;
    const exclusiveEnd = addOneDayIso(inclusiveEnd);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@routine.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${isoDateToIcs(start)}`,
      `DTEND;VALUE=DATE:${isoDateToIcs(exclusiveEnd)}`,
      `SUMMARY:${escapeIcsText(event.title)}`,
    );
    if (event.description.trim()) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description.trim())}`);
    }
    if (event.url) {
      lines.push(`URL:${event.url}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return icsLines(lines);
}
