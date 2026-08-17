"use client";

import { SectionPage } from "@/app/components/section-page";
import { UserAvatar } from "@/app/components/user-avatar";
import { useTranslations } from "@/app/components/translations-provider";
import { useTeam } from "@/app/lib/team-store";
import { teamRankLabel } from "@/app/lib/team";

export default function ProfileSettingsPage() {
  const { t } = useTranslations();
  const { currentUser, teams } = useTeam();
  const rank = teams.length === 0 ? null : teamRankLabel(currentUser.role, t);

  return (
    <SectionPage
      title={t("user_menu.settings", "Personīgie uzstādījumi")}
      subtitle={t(
        "profile.page.subtitle",
        "Tavs profils, valoda un paziņojumi.",
      )}
    >
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
    </SectionPage>
  );
}
