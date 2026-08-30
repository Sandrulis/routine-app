import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DocsShell } from "@/app/components/docs-shell";
import { resolveSystemName } from "@/app/lib/document-title";
import { getPublicDocsTree } from "@/app/lib/docs/repository";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { localePath } from "@/app/lib/seo/locale-path";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export const dynamic = "force-dynamic";

export default async function DocsGroupLayout({ children }: { children: ReactNode }) {
  const [{ languageCode }, tree, settings] = await Promise.all([
    getServerTranslations(),
    getPublicDocsTree(),
    getSiteSettings(),
  ]);

  if (!tree.enabled) {
    redirect(localePath("/", languageCode));
  }

  return (
    <DocsShell
      categories={tree.categories}
      logoUrl={settings.logoUrl}
      logoColor={settings.logoColor}
      systemName={resolveSystemName(settings.systemName)}
      showLanguageSwitcher={tree.hasMultipleLanguages}
    >
      {children}
    </DocsShell>
  );
}
