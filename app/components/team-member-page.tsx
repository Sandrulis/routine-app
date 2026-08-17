"use client";

import Link from "next/link";
import { SectionPage } from "@/app/components/section-page";
import { UserAvatar } from "@/app/components/user-avatar";
import { useTranslations } from "@/app/components/translations-provider";
import { useTeam } from "@/app/lib/team-store";

export function TeamMemberPage({ memberId }: { memberId: string }) {
  const { t } = useTranslations();
  const { members, isReady } = useTeam();
  const member = members.find((item) => item.id === memberId) ?? null;

  if (!isReady) {
    return (
      <SectionPage
        title={t("team.detail.loading", "Ielādē biedru")}
        subtitle={t("team.page.subtitle", "Visi komandas biedri.")}
      >
        <div className="h-32 rounded-3xl border border-zinc-200 bg-white" />
      </SectionPage>
    );
  }

  if (!member) {
    return (
      <SectionPage
        title={t("team.detail.missing", "Biedrs nav atrasts")}
        subtitle={t(
          "team.detail.missing_description",
          "Šis komandas biedrs vairs nav pieejams.",
        )}
      >
        <Link
          href="/team"
          className="inline-flex min-h-10 items-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
        >
          {t("team.back", "Atpakaļ uz komandu")}
        </Link>
      </SectionPage>
    );
  }

  return (
    <SectionPage title={member.name} subtitle={member.role || member.email}>
      <div className="flex items-start gap-4 rounded-3xl border border-zinc-200 bg-white px-5 py-6">
        <UserAvatar member={member} />
        <div className="min-w-0 text-sm text-zinc-500">
          {member.email ? <p>{member.email}</p> : null}
          <p className="mt-2">
            {t(
              "team.detail.placeholder",
              "Biedra profilu šeit pielāgosi nākamajā solī.",
            )}
          </p>
        </div>
      </div>
    </SectionPage>
  );
}
