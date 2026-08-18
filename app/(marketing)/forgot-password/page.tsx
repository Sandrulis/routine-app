import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/app/components/forgot-password-form";
import { getServerTranslations } from "@/app/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: `${t("auth.forgot.title", "Aizmirsi paroli")} — ${t("app.name", "Routine")}`,
  };
}

export default function ForgotPasswordPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <ForgotPasswordForm />
    </div>
  );
}
