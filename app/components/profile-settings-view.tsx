"use client";

import { Suspense } from "react";
import { SectionPage } from "@/app/components/section-page";
import { LoadingState } from "@/app/components/loading-state";
import { ProfileDisplayPreferencesForm } from "@/app/components/profile-display-preferences-form";
import { MfaSettingsCard } from "@/app/components/mfa-settings-card";
import { TeamLeaveSection } from "@/app/components/team-leave-section";
import { AccountDeletionSection } from "@/app/components/account-deletion-section";
import { UserAvatar } from "@/app/components/user-avatar";
import { useTranslations } from "@/app/components/translations-provider";
import type {
  SiteDisplayPreferences,
  UserDisplayPreferences,
} from "@/app/lib/site-admin/display-preferences";
import { useTeam } from "@/app/lib/team-store";
import { teamRankLabel } from "@/app/lib/team";

export function ProfileSettingsView({
  systemDefaults,
  initialUserPreferences,
}: {
  systemDefaults: SiteDisplayPreferences;
  initialUserPreferences: UserDisplayPreferences;
}) {
  const { t } = useTranslations();
  const { currentUser, teams, roles, isReady, members } = useTeam();
  const rank = teams.length === 0 ? null : teamRankLabel(currentUser.role, t, roles);
  const selfMember =
    members.find(
      (member) =>
        member.id === currentUser.id ||
        (member.userId && member.userId === currentUser.userId),
    ) ?? null;

  if (!isReady) {
    return (
      <SectionPage
        title={t("user_menu.settings", "Personīgie uzstādījumi")}
        subtitle={t(
          "profile.page.subtitle",
          "Tavs profils un datumu attēlojuma iestatījumi.",
        )}
      >
        <LoadingState />
      </SectionPage>
    );
  }

  return (
    <SectionPage
      title={t("user_menu.settings", "Personīgie uzstādījumi")}
      subtitle={t(
        "profile.page.subtitle",
        "Tavs profils un datumu attēlojuma iestatījumi.",
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
        </div>

        <ProfileDisplayPreferencesForm
          systemDefaults={systemDefaults}
          initialUserPreferences={initialUserPreferences}
        />

        <Suspense>
          <MfaSettingsCard />
        </Suspense>

        {selfMember ? <TeamLeaveSection member={selfMember} redirectTo="/" /> : null}

        <AccountDeletionSection />
      </div>
    </SectionPage>
  );
}
