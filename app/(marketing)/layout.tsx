import type { ReactNode } from "react";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteHeader } from "@/app/components/site-header";
import { getSiteSettings } from "@/app/lib/site-admin/repository";
import { isEmailPasswordAuthEnabled } from "@/app/lib/integrations/resend/client";

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const [settings, signupEnabled] = await Promise.all([
    getSiteSettings(),
    isEmailPasswordAuthEnabled(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50">
      <SiteHeader
        logoUrl={settings.logoUrl}
        logoColor={settings.logoColor}
        systemName={settings.systemName}
        signupEnabled={signupEnabled}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
