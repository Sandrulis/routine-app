import { NextResponse } from "next/server";
import { buildCalendarIcs } from "@/app/lib/calendar/ics";
import { loadCalendarFeedByToken } from "@/app/lib/calendar/repository";
import { normalizeCalendarFeedToken } from "@/app/lib/calendar/token";

export const dynamic = "force-dynamic";

function icsResponse(body: string): NextResponse {
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="routine.ics"',
      "Cache-Control": "public, max-age=300",
    },
  });
}

async function calendarFeedResponse(tokenParam: string) {
  const token = normalizeCalendarFeedToken(tokenParam);
  if (!token) {
    return new NextResponse("Not found", { status: 404 });
  }

  const feed = await loadCalendarFeedByToken(token);
  if (!feed) {
    return new NextResponse("Not found", { status: 404 });
  }

  return icsResponse(
    buildCalendarIcs({
      calendarName: feed.calendarName,
      events: feed.events,
    }),
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  return calendarFeedResponse(token);
}

export async function HEAD(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const response = await calendarFeedResponse(token);
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
