import type { Metadata } from "next";
import { SignupForm } from "@/app/components/signup-form";
import { getServerTranslations } from "@/app/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("auth.signup.title", "Reģistrēties"),
  };
}

export default function SignupPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <SignupForm />
    </div>
  );
}
