import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/app/components/login-form";
import { getServerTranslations } from "@/app/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("auth.login.title", "Ienākt"),
  };
}

export default function LoginPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
