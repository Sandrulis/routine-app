import { NextResponse } from "next/server";
import { buildCalendarIcs } from "@/app/lib/calendar/ics";
import { loadCalendarFeedByToken } from "@/app/lib/calendar/repository";
import { normalizeCalendarFeedToken } from "@/app/lib/calendar/token";
import { requestClientIp } from "@/app/lib/security/client-ip";
import { consumeRateLimit } from "@/app/lib/security/rate-limit";

export const dynamic = "force-dynamic";

function icsResponse(body: string): NextResponse {
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="routine.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}

async function calendarFeedResponse(request: Request, tokenParam: string) {
  const limited = await consumeRateLimit(
    `calendar:${requestClientIp(request)}`,
    60,
    15 * 60 * 1000,
  );
  if (!limited.ok) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: { "Retry-After": String(limited.retryAfterSec) },
    });
  }

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
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  return calendarFeedResponse(request, token);
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const response = await calendarFeedResponse(request, token);
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
