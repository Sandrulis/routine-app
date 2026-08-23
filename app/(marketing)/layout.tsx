import type { ReactNode } from "react";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteHeader } from "@/app/components/site-header";
import { getEnabledFrontendModuleKeys } from "@/app/lib/frontend-modules/repository";
import { FrontendModulesProvider } from "@/app/lib/frontend-modules/context";
import { getSiteSettings } from "@/app/lib/site-admin/repository";
import { isEmailPasswordAuthEnabled } from "@/app/lib/integrations/resend/client";
import { AuthHashRedirect } from "@/app/components/auth-session-from-url";

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const [settings, signupEnabled, enabledFrontendModuleKeys] = await Promise.all([
    getSiteSettings(),
    isEmailPasswordAuthEnabled(),
    getEnabledFrontendModuleKeys(),
  ]);

  return (
    <FrontendModulesProvider enabledKeys={[...enabledFrontendModuleKeys]}>
      <div className="flex min-h-dvh flex-col bg-zinc-50">
        <AuthHashRedirect />
        <SiteHeader
          logoUrl={settings.logoUrl}
          logoColor={settings.logoColor}
          systemName={settings.systemName}
          signupEnabled={signupEnabled}
        />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </FrontendModulesProvider>
  );
}
