import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/app/components/forgot-password-form";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { isEmailPasswordAuthEnabled } from "@/app/lib/integrations/resend/client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("auth.forgot.title", "Aizmirsi paroli"),
  };
}

export default async function ForgotPasswordPage() {
  const emailPasswordEnabled = await isEmailPasswordAuthEnabled();
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <ForgotPasswordForm emailPasswordEnabled={emailPasswordEnabled} />
    </div>
  );
}
