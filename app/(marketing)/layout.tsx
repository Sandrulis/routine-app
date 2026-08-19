import type { ReactNode } from "react";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteHeader } from "@/app/components/site-header";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50">
      <SiteHeader
        logoUrl={settings.logoUrl}
        logoColor={settings.logoColor}
        systemName={settings.systemName}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
