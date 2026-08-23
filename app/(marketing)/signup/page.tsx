import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SignupForm } from "@/app/components/signup-form";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { canonicalMetadata } from "@/app/lib/seo/metadata";
import { isGoogleSignInEnabled } from "@/app/lib/integrations/google-oauth/repository";
import { isMicrosoftOAuthEnabled } from "@/app/lib/integrations/microsoft-oauth/repository";
import { isEmailPasswordAuthEnabled } from "@/app/lib/integrations/resend/client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return canonicalMetadata("/signup", {
    title: t("auth.signup.title", "Reģistrēties"),
    description: t(
      "auth.signup.subtitle",
      "Izveido kontu un sāc darbu ar komandu.",
    ),
    index: false,
  });
}

export default async function SignupPage() {
  const [googleSignInEnabled, microsoftSignInEnabled, emailPasswordEnabled] =
    await Promise.all([
      isGoogleSignInEnabled(),
      isMicrosoftOAuthEnabled(),
      isEmailPasswordAuthEnabled(),
    ]);

  if (!emailPasswordEnabled) {
    redirect("/login");
  }

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <Suspense>
        <SignupForm
          googleSignInEnabled={googleSignInEnabled}
          microsoftSignInEnabled={microsoftSignInEnabled}
          emailPasswordEnabled={emailPasswordEnabled}
        />
      </Suspense>
    </div>
  );
}
