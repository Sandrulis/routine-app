import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/app/components/update-password-form";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { NO_INDEX_ROBOTS } from "@/app/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("auth.update_password.title", "Jauna parole"),
    robots: NO_INDEX_ROBOTS,
  };
}

export default function UpdatePasswordPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <UpdatePasswordForm />
    </div>
  );
}
