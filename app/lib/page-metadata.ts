import type { Metadata } from "next";
import { getServerTranslations } from "@/app/lib/i18n/server";

export async function translatedPageMetadata(
  key: string,
  fallback: string,
): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return { title: t(key, fallback) };
}

export async function resolvedPageMetadata(
  title: string | null | undefined,
  fallbackKey: string,
  fallback: string,
): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return { title: title?.trim() || t(fallbackKey, fallback) };
}
