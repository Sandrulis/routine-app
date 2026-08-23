import { LANGUAGE_CODES } from "@/app/lib/i18n/language";
import {
  listSiteLanguages,
  updateSiteTranslation,
} from "@/app/lib/site-admin/repository";
import type { SiteLanguageSummary } from "@/app/lib/site-admin/types";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import {
  EMAIL_TEMPLATE_KINDS,
  TEMPLATE_KEYS,
  fallbackButton,
  fallbackFor,
  type EmailTemplateDraft,
} from "@/app/lib/email/templates";

function parseValues(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [code, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string") {
      out[code] = value;
    }
  }
  return out;
}

export async function listEmailTemplateDrafts(
  languages?: SiteLanguageSummary[],
): Promise<EmailTemplateDraft[]> {
  const langs = languages ?? (await listSiteLanguages());
  const languageCodes = langs.map((language) => language.code);
  if (languageCodes.length === 0) {
    languageCodes.push(...LANGUAGE_CODES);
  }

  const allKeys = EMAIL_TEMPLATE_KINDS.flatMap((kind) => {
    const keys = TEMPLATE_KEYS[kind];
    return [keys.subjectKey, keys.bodyKey, keys.buttonKey];
  });

  const valuesByKey = new Map<string, Record<string, string>>();

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_translations")
      .select("translation_key, values")
      .in("translation_key", allKeys);

    for (const row of data ?? []) {
      const key =
        typeof row.translation_key === "string" ? row.translation_key : "";
      if (!key) continue;
      valuesByKey.set(key, parseValues(row.values));
    }
  }

  return EMAIL_TEMPLATE_KINDS.map((kind) => {
    const { subjectKey, bodyKey, buttonKey } = TEMPLATE_KEYS[kind];
    const subjectValues = valuesByKey.get(subjectKey) ?? {};
    const bodyValues = valuesByKey.get(bodyKey) ?? {};
    const buttonValues = valuesByKey.get(buttonKey) ?? {};
    const subjects: Record<string, string> = {};
    const bodies: Record<string, string> = {};
    const buttons: Record<string, string> = {};
    for (const code of languageCodes) {
      subjects[code] =
        subjectValues[code]?.trim() || fallbackFor(kind, code, "subject");
      bodies[code] = bodyValues[code]?.trim() || fallbackFor(kind, code, "body");
      buttons[code] = buttonValues[code]?.trim() || fallbackButton(kind, code);
    }
    return {
      kind,
      subjectKey,
      bodyKey,
      buttonKey,
      subjects,
      bodies,
      buttons,
    };
  });
}

export async function saveEmailTemplateDrafts(
  drafts: EmailTemplateDraft[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  for (const draft of drafts) {
    const keys = TEMPLATE_KEYS[draft.kind];
    if (!keys) {
      return { ok: false, error: "errors.email_templates_unknown" };
    }

    const subjectResult = await updateSiteTranslation(keys.subjectKey, {
      key: keys.subjectKey,
      namespace: "email",
      description: `Email template subject (${draft.kind})`,
      values: draft.subjects,
    });
    if (!subjectResult.ok) return subjectResult;

    const bodyResult = await updateSiteTranslation(keys.bodyKey, {
      key: keys.bodyKey,
      namespace: "email",
      description: `Email template body (${draft.kind})`,
      values: draft.bodies,
    });
    if (!bodyResult.ok) return bodyResult;

    const buttonResult = await updateSiteTranslation(keys.buttonKey, {
      key: keys.buttonKey,
      namespace: "email",
      description: `Email template button (${draft.kind})`,
      values: draft.buttons,
    });
    if (!buttonResult.ok) return buttonResult;
  }

  return { ok: true };
}
