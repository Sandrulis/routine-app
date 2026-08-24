import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/app/components/login-form";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { canonicalMetadata } from "@/app/lib/seo/metadata";
import { isGoogleSignInEnabled } from "@/app/lib/integrations/google-oauth/repository";
import { isMicrosoftOAuthEnabled } from "@/app/lib/integrations/microsoft-oauth/repository";
import { isEmailPasswordAuthEnabled } from "@/app/lib/integrations/resend/client";
import { getPublicTurnstileConfig } from "@/app/lib/integrations/public-turnstile";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return canonicalMetadata("/login", {
    title: t("auth.login.title", "Ienākt"),
    description: t("auth.login.subtitle", "Pieslēdzies savam {SYSTEM_NAME} kontam."),
    index: false,
  });
}

export default async function LoginPage() {
  const [googleSignInEnabled, microsoftSignInEnabled, emailPasswordEnabled, turnstile] =
    await Promise.all([
      isGoogleSignInEnabled(),
      isMicrosoftOAuthEnabled(),
      isEmailPasswordAuthEnabled(),
      getPublicTurnstileConfig(),
    ]);

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <Suspense>
        <LoginForm
          googleSignInEnabled={googleSignInEnabled}
          microsoftSignInEnabled={microsoftSignInEnabled}
          emailPasswordEnabled={emailPasswordEnabled}
          turnstileSiteKey={turnstile?.enabled ? turnstile.siteKey : null}
        />
      </Suspense>
    </div>
  );
}
