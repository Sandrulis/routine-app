import { NextResponse } from "next/server";
import { isCronJobKey } from "@/app/lib/cron-jobs/types";
import { findEnabledCronJobByToken } from "@/app/lib/cron-jobs/repository";
import { executeCronJob } from "@/app/lib/cron-jobs/run";
import { requestClientIp } from "@/app/lib/security/client-ip";
import { consumeRateLimit } from "@/app/lib/security/rate-limit";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleCronRequest(
  request: Request,
  jobKeyParam: string,
): Promise<NextResponse> {
  const limited = await consumeRateLimit(
    `cron:${requestClientIp(request)}`,
    60,
    15 * 60 * 1000,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  if (!isCronJobKey(jobKeyParam)) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "not_configured" },
      { status: 503 },
    );
  }

  // Auth: per-job secret token (query or Bearer) — no session cookie.
  const urlToken = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  const auth = request.headers.get("authorization") ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  const token = urlToken || bearer;
  const found = await findEnabledCronJobByToken(jobKeyParam, token);
  if (!found || !found.matched) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!found.enabled) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 403 });
  }

  const result = await executeCronJob(jobKeyParam);
  return NextResponse.json(
    {
      ok: result.ok,
      notifiedCount: result.notifiedCount,
      scannedCount: result.scannedCount,
      message: result.message,
    },
    { status: result.ok ? 200 : 500 },
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ jobKey: string }> },
) {
  const { jobKey } = await context.params;
  return handleCronRequest(request, jobKey);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ jobKey: string }> },
) {
  const { jobKey } = await context.params;
  return handleCronRequest(request, jobKey);
}
