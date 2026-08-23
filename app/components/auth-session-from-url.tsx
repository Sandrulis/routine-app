"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import type { EmailOtpType, Session, SupabaseClient } from "@supabase/supabase-js";
import { useTranslations } from "@/app/components/translations-provider";
import {
  parseRememberSession,
  REMEMBER_SESSION_COOKIE,
  serializeBrowserAuthCookie,
  withAuthCookieOptions,
} from "@/app/lib/auth/remember-session";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";
import { getSupabasePublicEnv } from "@/app/lib/supabase/env";

const OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

let confirmInFlight: Promise<"ok" | "fail" | "noop"> | null = null;

function readDocumentCookies() {
  if (typeof document === "undefined" || !document.cookie) {
    return [];
  }

  return document.cookie.split("; ").flatMap((part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return [];

    try {
      return [
        {
          name: decodeURIComponent(part.slice(0, separator)),
          value: decodeURIComponent(part.slice(separator + 1)),
        },
      ];
    } catch {
      return [
        {
          name: part.slice(0, separator),
          value: part.slice(separator + 1),
        },
      ];
    }
  });
}

function parseHashParams(): URLSearchParams | null {
  const raw = window.location.hash.replace(/^#/, "").trim();
  if (!raw) {
    return null;
  }
  return new URLSearchParams(raw);
}

function urlHasRecoverableAuth(): boolean {
  const hash = window.location.hash;
  if (hash.includes("access_token=") || hash.includes("error=")) {
    return true;
  }
  return new URLSearchParams(window.location.search).has("token_hash");
}

function createConfirmClient(): SupabaseClient {
  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error("Supabase env is missing.");
  }

  return createBrowserClient(env.url, env.anonKey, {
    auth: {
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
    cookies: {
      getAll() {
        return readDocumentCookies();
      },
      setAll(cookiesToSet) {
        const remember = parseRememberSession(
          readDocumentCookies().find(
            (cookie) => cookie.name === REMEMBER_SESSION_COOKIE,
          )?.value,
        );
        const secure =
          typeof window !== "undefined" && window.location.protocol === "https:";

        withAuthCookieOptions(cookiesToSet, remember).forEach(
          ({ name, value, options }) => {
            serializeBrowserAuthCookie(name, value, {
              ...options,
              secure: options?.secure ?? secure,
            });
          },
        );
      },
    },
  });
}

async function establishSession(
  supabase: SupabaseClient,
): Promise<Session | null> {
  const hashParams = parseHashParams();
  const searchParams = new URLSearchParams(window.location.search);

  const authError = hashParams?.get("error") ?? searchParams.get("error");
  if (authError) {
    return null;
  }

  const accessToken = hashParams?.get("access_token");
  const refreshToken = hashParams?.get("refresh_token");
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type") ?? hashParams?.get("type");

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error || !data.session) {
      return null;
    }
    return data.session;
  }

  if (tokenHash && typeParam && OTP_TYPES.has(typeParam)) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: typeParam as EmailOtpType,
    });
    if (error || !data.session) {
      return null;
    }

    const { data: persisted, error: persistError } =
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    if (!persistError && persisted.session) {
      return persisted.session;
    }

    return data.session;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

async function runConfirmOnce(): Promise<"ok" | "fail" | "noop"> {
  if (confirmInFlight) {
    return confirmInFlight;
  }

  confirmInFlight = (async () => {
    try {
      if (!urlHasRecoverableAuth()) {
        const supabase = createConfirmClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        return session ? "ok" : "noop";
      }

      const supabase = createConfirmClient();
      const session = await establishSession(supabase);
      return session ? "ok" : "fail";
    } catch {
      return "fail";
    } finally {
      queueMicrotask(() => {
        confirmInFlight = null;
      });
    }
  })();

  return confirmInFlight;
}

function redirectAfterAuth(next: string) {
  const redirectTo = getSafeRedirectPath(
    new URLSearchParams(window.location.search).get("next") ?? next,
  );
  window.location.replace(redirectTo);
}

export function AuthSessionFromUrl({
  next = "/dashboard",
  mode = "confirm",
}: {
  next?: string;
  mode?: "confirm" | "recover";
}) {
  const { t } = useTranslations();
  const [phase, setPhase] = useState<"idle" | "working" | "failed">(
    mode === "confirm" ? "working" : "idle",
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (mode === "recover" && !urlHasRecoverableAuth()) {
        const result = await runConfirmOnce();
        if (cancelled) {
          return;
        }
        if (result === "ok") {
          redirectAfterAuth(next);
        }
        return;
      }

      if (!cancelled) {
        setPhase("working");
      }

      const result = await runConfirmOnce();
      if (cancelled) {
        return;
      }

      if (result === "ok") {
        redirectAfterAuth(next);
        return;
      }

      if (result === "noop" && mode === "recover") {
        setPhase("idle");
        return;
      }

      setPhase("failed");
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [mode, next]);

  if (phase === "idle") {
    return null;
  }

  if (phase === "failed") {
    if (mode === "recover") {
      return null;
    }

    return (
      <main className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold text-zinc-900">
            {t("auth.confirm.failed_title", "Apstiprināšana neizdevās")}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {t(
              "auth.confirm.failed",
              "Saites derīgums ir beidzies vai tā nav derīga. Pieprasi jaunu e-pastu un atver to tajā pašā pārlūkā.",
            )}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-semibold text-blue-700 underline decoration-blue-200 underline-offset-2"
          >
            {t("auth.login.title", "Ienākt")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[50vh] items-center justify-center px-4">
      <p className="text-sm font-medium text-zinc-900">
        {t("auth.confirm.loading", "Pabeidz apstiprināšanu…")}
      </p>
    </main>
  );
}

export function AuthHashRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token=")) {
      return;
    }
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const next =
      params.get("type") === "recovery" ? "?next=/update-password" : "";
    window.location.replace(`/auth/confirm${next}${hash}`);
  }, []);

  return null;
}
