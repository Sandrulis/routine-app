import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/app/components/login-form";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { isGoogleSignInEnabled } from "@/app/lib/integrations/google-oauth/repository";
import { isMicrosoftOAuthEnabled } from "@/app/lib/integrations/microsoft-oauth/repository";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("auth.login.title", "Ienākt"),
  };
}

export default async function LoginPage() {
  const [googleSignInEnabled, microsoftSignInEnabled] = await Promise.all([
    isGoogleSignInEnabled(),
    isMicrosoftOAuthEnabled(),
  ]);

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <Suspense>
        <LoginForm
          googleSignInEnabled={googleSignInEnabled}
          microsoftSignInEnabled={microsoftSignInEnabled}
        />
      </Suspense>
    </div>
  );
}
