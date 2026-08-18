"use client";

import { SectionPage } from "@/app/components/section-page";
import { LanguageSwitcher } from "@/app/components/language-switcher";
import { UserAvatar } from "@/app/components/user-avatar";
import { useTranslations } from "@/app/components/translations-provider";
import { useTeam } from "@/app/lib/team-store";
import { teamRankLabel } from "@/app/lib/team";

export default function ProfileSettingsPage() {
  const { t } = useTranslations();
  const { currentUser, teams, roles } = useTeam();
  const rank = teams.length === 0 ? null : teamRankLabel(currentUser.role, t, roles);

  return (
    <SectionPage
      title={t("user_menu.settings", "Personīgie uzstādījumi")}
      subtitle={t(
        "profile.page.subtitle",
        "Tavs profils, valoda un paziņojumi.",
      )}
    >
      <div className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-6">
          <div className="flex items-center gap-3">
            <UserAvatar member={currentUser} />
            <div>
              <p className="text-sm font-semibold text-zinc-900">{currentUser.name}</p>
              <p className="text-sm text-zinc-500">
                {[rank, currentUser.email].filter(Boolean).join(" - ")}
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm text-zinc-500">
            {t(
              "profile.page.placeholder",
              "Profila rediģēšanu šeit pielāgosi nākamajā solī.",
            )}
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-6">
          <h2 className="text-sm font-semibold text-zinc-900">
            {t("settings.language.title", "Valoda")}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {t("settings.language.description", "Lietotnes saskarnes valoda.")}
          </p>
          <div className="mt-4 max-w-sm">
            <LanguageSwitcher variant="stacked" />
          </div>
        </div>
      </div>
    </SectionPage>
  );
}
