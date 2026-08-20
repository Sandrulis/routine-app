import { cache } from "react";
import { cookies } from "next/headers";
import {
  getSiteTranslationDictionary,
  listSiteLanguages,
} from "@/app/lib/site-admin/repository";
import {
  DEFAULT_LANGUAGE,
  interpolate,
  messages,
  type LanguageCode,
} from "@/app/lib/i18n/messages";
import {
  hasExplicitLanguageChoice,
  isLanguageCode,
  LANGUAGE_CHOSEN_COOKIE,
  LANGUAGE_COOKIE,
  resolveLanguageCode,
  type UiLanguageOption,
} from "@/app/lib/i18n/language";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

type TranslateFn = (
  key: string,
  fallback: string,
  params?: Record<string, string | number>,
) => string;

export type ServerTranslations = {
  languageCode: LanguageCode;
  overlay: Record<string, string>;
  table: Record<string, string>;
  t: TranslateFn;
};

function activeUiLanguages(
  languages: Awaited<ReturnType<typeof listSiteLanguages>>,
): UiLanguageOption[] {
  return languages.flatMap((language) =>
    language.isActive && isLanguageCode(language.code)
      ? [{ code: language.code, name: language.name }]
      : [],
  );
}

export const getActiveUiLanguages = cache(async function getActiveUiLanguages(): Promise<
  UiLanguageOption[]
> {
  return activeUiLanguages(await listSiteLanguages());
});

export async function getRequestLanguageCode(): Promise<LanguageCode> {
  const languages = await listSiteLanguages();
  const active = activeUiLanguages(languages);
  const activeCodes = new Set(active.map((language) => language.code));
  const systemDefault = resolveLanguageCode(
    languages.find((language) => language.isDefault && language.isActive)?.code ??
      active[0]?.code,
  );

  function pick(value: string | null | undefined): LanguageCode | null {
    if (!value || !isLanguageCode(value) || !activeCodes.has(value)) {
      return null;
    }
    return value;
  }

  const cookieStore = await cookies();
  const explicitCookie = hasExplicitLanguageChoice(
    cookieStore.get(LANGUAGE_CHOSEN_COOKIE)?.value,
  )
    ? pick(cookieStore.get(LANGUAGE_COOKIE)?.value)
    : null;

  if (isSupabaseConfigured()) {
    try {
      const user = await getCurrentUser();
      if (user) {
        const supabase = await createClient();
        const { data } = await supabase
          .from("users")
          .select("language_code")
          .eq("id", user.id)
          .maybeSingle();
        return pick(data?.language_code) ?? explicitCookie ?? systemDefault;
      }
    } catch (error) {
      console.error("getRequestLanguageCode profile failed:", error);
    }
  }

  return explicitCookie ?? systemDefault;
}

export const getServerTranslations = cache(async function getServerTranslations(): Promise<ServerTranslations> {
  const languageCode = await getRequestLanguageCode();
  const overlay = await getSiteTranslationDictionary(languageCode);
  const table = messages[languageCode] ?? messages[DEFAULT_LANGUAGE];

  return {
    languageCode,
    overlay,
    table,
    t(key, fallback, params) {
      const fromOverlay = overlay[key]?.trim();
      return interpolate(fromOverlay || table[key] || fallback, params);
    },
  };
});
