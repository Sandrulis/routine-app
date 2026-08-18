"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SectionPage } from "@/app/components/section-page";
import { TeamInviteModal } from "@/app/components/team-invite-modal";
import { MemberLastOnline } from "@/app/components/member-last-online";
import { UserAvatar } from "@/app/components/user-avatar";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { useTeam } from "@/app/lib/team-store";
import { teamRankLabel } from "@/app/lib/team";

export default function TeamPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const { members, currentTeam, inviteMember, isReady, roles } = useTeam();
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <SectionPage
      title={t("nav.team", "Komanda")}
      subtitle={t(
        "team.page.subtitle",
        "Visi komandas biedri. Uzaicini jaunu biedru ar pluszīmi.",
      )}
      actions={
        currentTeam ? (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            <i className="fas fa-plus text-xs" aria-hidden="true" />
            {t("team.invite.button", "Uzaicināt")}
          </button>
        ) : null
      }
    >
      <div className="grid gap-3">
        {isReady && members.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
            {currentTeam
              ? t("team.empty", "Komandā vēl nav biedru.")
              : t("teams.required.empty_members", "Vispirms izveido komandu.")}
          </div>
        ) : (
          members.map((member) => (
            <Link
              key={member.id}
              href={`/team/${member.id}`}
              className="flex items-center gap-3 rounded-3xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <UserAvatar member={member} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900">{member.name}</p>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {[teamRankLabel(member.role, t, roles), member.email]
                    .filter(Boolean)
                    .join(" - ")}
                </p>
              </div>
              <MemberLastOnline lastOnlineAt={member.lastOnlineAt} />
            </Link>
          ))
        )}
      </div>

      <TeamInviteModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvite={(input) => {
          const member = inviteMember(input);
          showFeedback({
            type: "success",
            text: t("team.invited", "Uzaicinājums nosūtīts."),
          });
          router.push(`/team/${member.id}`);
        }}
      />
    </SectionPage>
  );
}
