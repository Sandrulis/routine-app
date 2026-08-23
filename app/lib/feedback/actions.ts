"use server";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { buildSimpleEmailHtml } from "@/app/lib/email/build-email-html";
import { interpolate } from "@/app/lib/i18n/interpolate";
import { allMessages as messages } from "@/app/lib/i18n/all-messages";
import {
  DEFAULT_LANGUAGE,
  resolveLanguageCode,
  type LanguageCode,
} from "@/app/lib/i18n/language";
import { getResendCredentials, sendResendEmail } from "@/app/lib/integrations/resend/client";
import { getClientIp } from "@/app/lib/security/client-ip";
import { logError } from "@/app/lib/security/log-error";
import { consumeRateLimit } from "@/app/lib/security/rate-limit";
import {
  getSiteSettings,
  listSiteLanguages,
} from "@/app/lib/site-admin/repository";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { createClient } from "@/app/lib/supabase/server";

export type FeedbackKind = "bug" | "feature" | "feedback";

export type FeatureRequestItem = {
  id: string;
  title: string;
  body: string;
  voteCount: number;
  votedByMe: boolean;
  createdAt: string;
};

const TITLE_MAX = 200;
const BODY_MAX = 4000;

function catalogText(
  languageCode: LanguageCode,
  key: string,
  fallback: string,
  params?: Record<string, string>,
): string {
  const template =
    messages[languageCode]?.[key] || messages.lv[key] || fallback;
  return interpolate(template, params);
}

async function defaultLanguageCode(): Promise<LanguageCode> {
  const languages = await listSiteLanguages();
  return resolveLanguageCode(
    languages.find((language) => language.isDefault)?.code ?? DEFAULT_LANGUAGE,
  );
}

function trimTitle(value: string): string {
  return value.trim().slice(0, TITLE_MAX);
}

function trimBody(value: string): string {
  return value.trim().slice(0, BODY_MAX);
}

export async function listFeatureRequestsAction(): Promise<
  { ok: true; items: FeatureRequestItem[] } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const supabase = await createClient();
  const [{ data: rows, error }, { data: votes, error: votesError }] =
    await Promise.all([
      supabase
        .from("site_user_feedback")
        .select("id, title, body, vote_count, created_at")
        .eq("kind", "feature")
        .order("vote_count", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("site_feature_votes")
        .select("request_id")
        .eq("user_id", user.id),
    ]);

  if (error || votesError) {
    logError("listFeatureRequests failed", error?.message ?? votesError?.message);
    return { ok: false, error: "errors.feedback_list_failed" };
  }

  const voted = new Set(
    (votes ?? []).map((row) => String((row as { request_id: string }).request_id)),
  );

  return {
    ok: true,
    items: (rows ?? []).map((row) => {
      const item = row as {
        id: string;
        title: string;
        body: string;
        vote_count: number | null;
        created_at: string;
      };
      return {
        id: item.id,
        title: item.title,
        body: item.body ?? "",
        voteCount: item.vote_count ?? 0,
        votedByMe: voted.has(item.id),
        createdAt: item.created_at,
      };
    }),
  };
}

export async function submitUserFeedbackAction(input: {
  kind: FeedbackKind;
  title: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const kind = input.kind;
  if (kind !== "bug" && kind !== "feature" && kind !== "feedback") {
    return { ok: false, error: "errors.feedback_save_failed" };
  }

  const title = trimTitle(input.title);
  const body = trimBody(input.body);
  if (!title) {
    return { ok: false, error: "errors.feedback_title_required" };
  }
  if (!body) {
    return { ok: false, error: "errors.feedback_body_required" };
  }

  const ip = await getClientIp();
  const userLimit = await consumeRateLimit(
    `feedback-user:${user.id}`,
    5,
    15 * 60 * 1000,
  );
  const ipLimit = await consumeRateLimit(`feedback-ip:${ip}`, 10, 15 * 60 * 1000);
  if (!userLimit.ok || !ipLimit.ok) {
    return { ok: false, error: "errors.feedback_rate_limited" };
  }

  const settings = await getSiteSettings();
  const legalEmail = settings.legalEmail.trim().toLowerCase();
  if (!legalEmail) {
    return { ok: false, error: "errors.feedback_legal_email_missing" };
  }
  const resend = await getResendCredentials();
  if (!resend) {
    return { ok: false, error: "errors.integrations_resend_not_enabled" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("site_user_feedback").insert({
    kind,
    title,
    body,
    user_id: user.id,
  });
  if (error) {
    logError("submitUserFeedback insert failed", error.message);
    return { ok: false, error: "errors.feedback_save_failed" };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", user.id)
    .maybeSingle();

  const senderEmail =
    (typeof profile?.email === "string" && profile.email.trim()) ||
    user.email?.trim() ||
    "";
  const senderName =
    (typeof profile?.name === "string" && profile.name.trim()) ||
    senderEmail.split("@")[0] ||
    senderEmail;

  const lang = await defaultLanguageCode();
  const kindLabel = catalogText(
    lang,
    `feedback.email.kind.${kind}`,
    kind,
  );
  const subject = catalogText(
    lang,
    `feedback.email.subject.${kind}`,
    "{title}",
    { title },
  );
  const bodyText = catalogText(
    lang,
    "feedback.email.body",
    "{name} ({email})\n\n{title}\n\n{body}",
    {
      name: senderName,
      email: senderEmail || "—",
      kind: kindLabel,
      title,
      body,
    },
  );

  const systemName = settings.systemName.trim() || "TASQIN";
  const html = buildSimpleEmailHtml({
    systemName,
    heading: subject,
    bodyText,
  });
  const sent = await sendResendEmail({
    to: legalEmail,
    subject,
    html,
    text: bodyText,
    fromName: systemName,
    replyTo: senderEmail || null,
  });

  if (!sent.ok) {
    logError("submitUserFeedback email failed", sent.error);
    if (kind !== "feature") {
      return { ok: false, error: sent.error };
    }
  }

  return { ok: true };
}

export async function toggleFeatureVoteAction(
  requestId: string,
): Promise<
  | { ok: true; voteCount: number; votedByMe: boolean }
  | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const id = requestId.trim();
  if (!id) {
    return { ok: false, error: "errors.feedback_vote_failed" };
  }

  const ip = await getClientIp();
  const voteLimit = await consumeRateLimit(
    `feedback-vote:${user.id}:${ip}`,
    40,
    15 * 60 * 1000,
  );
  if (!voteLimit.ok) {
    return { ok: false, error: "errors.feedback_rate_limited" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("toggle_feature_vote", {
    p_request_id: id,
  });

  if (error) {
    logError("toggleFeatureVote failed", error.message);
    return { ok: false, error: "errors.feedback_vote_failed" };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const parsed = row as { vote_count?: number; voted_by_me?: boolean } | null;
  return {
    ok: true,
    voteCount: parsed?.vote_count ?? 0,
    votedByMe: Boolean(parsed?.voted_by_me),
  };
}
