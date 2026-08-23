import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { sha256Hex } from "@/app/lib/security/hash-token";

type MemoryBucket = { hits: number; resetAt: number };

const memoryBuckets = new Map<string, MemoryBucket>();

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_FAILURES = 8;
const LOCKOUT_MS = 15 * 60 * 1000;

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

function pruneMemory(now: number) {
  if (memoryBuckets.size < 2000) return;
  for (const [key, bucket] of memoryBuckets) {
    if (bucket.resetAt <= now) memoryBuckets.delete(key);
  }
}

function consumeMemory(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  pruneMemory(now);
  const current = memoryBuckets.get(key);
  if (!current || current.resetAt <= now) {
    memoryBuckets.set(key, { hits: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (current.hits >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  current.hits += 1;
  return { ok: true };
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs = DEFAULT_WINDOW_MS,
): Promise<RateLimitResult> {
  const memory = consumeMemory(key, limit, windowMs);
  if (!isSupabaseAdminConfigured()) return memory;

  try {
    const admin = createAdminClient();
    const nowIso = new Date().toISOString();
    const { data } = await admin
      .from("rate_limit_buckets")
      .select("hit_count, reset_at")
      .eq("bucket_key", key)
      .maybeSingle();

    const row = data as { hit_count?: number; reset_at?: string } | null;
    if (!row || !row.reset_at || row.reset_at <= nowIso) {
      await admin.from("rate_limit_buckets").upsert(
        {
          bucket_key: key,
          hit_count: 1,
          reset_at: new Date(Date.now() + windowMs).toISOString(),
        },
        { onConflict: "bucket_key" },
      );
      return memory.ok ? { ok: true } : memory;
    }

    const hits = Number(row.hit_count) || 0;
    if (hits >= limit) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((new Date(row.reset_at).getTime() - Date.now()) / 1000),
      );
      return { ok: false, retryAfterSec };
    }

    await admin
      .from("rate_limit_buckets")
      .update({ hit_count: hits + 1 })
      .eq("bucket_key", key);
    return { ok: true };
  } catch {
    return memory;
  }
}

function emailLockoutKey(email: string) {
  return sha256Hex(email.trim().toLowerCase());
}

export async function readAuthLockout(email: string): Promise<RateLimitResult> {
  if (!isSupabaseAdminConfigured()) return { ok: true };
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("auth_lockouts")
      .select("locked_until")
      .eq("email_hash", emailLockoutKey(email))
      .maybeSingle();
    const lockedUntil = (data as { locked_until?: string | null } | null)
      ?.locked_until;
    if (!lockedUntil) return { ok: true };
    const until = new Date(lockedUntil).getTime();
    if (until <= Date.now()) return { ok: true };
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((until - Date.now()) / 1000)),
    };
  } catch {
    return { ok: true };
  }
}

export async function recordAuthFailure(email: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  try {
    const admin = createAdminClient();
    const key = emailLockoutKey(email);
    const { data } = await admin
      .from("auth_lockouts")
      .select("failure_count, locked_until")
      .eq("email_hash", key)
      .maybeSingle();
    const row = data as {
      failure_count?: number;
      locked_until?: string | null;
    } | null;
    const lockedUntil = row?.locked_until
      ? new Date(row.locked_until).getTime()
      : 0;
    const previous =
      lockedUntil > Date.now() ? Number(row?.failure_count) || 0 : 0;
    const nextCount = previous + 1;
    const nextLock =
      nextCount >= LOCKOUT_FAILURES
        ? new Date(Date.now() + LOCKOUT_MS).toISOString()
        : null;
    await admin.from("auth_lockouts").upsert(
      {
        email_hash: key,
        failure_count: nextCount,
        locked_until: nextLock,
      },
      { onConflict: "email_hash" },
    );
  } catch {
    // Memory rate limit still applies.
  }
}

export async function clearAuthFailures(email: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  try {
    const admin = createAdminClient();
    await admin.from("auth_lockouts").delete().eq("email_hash", emailLockoutKey(email));
  } catch {
    // ignore
  }
}
