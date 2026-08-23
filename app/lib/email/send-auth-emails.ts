import { sendTemplatedEmail } from "@/app/lib/email/send-templated";

export async function sendSignupConfirmation(options: {
  email: string;
  confirmLink: string;
  name?: string;
  languageCode?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return sendTemplatedEmail({
    kind: "signup",
    to: options.email,
    languageCode: options.languageCode,
    heading: undefined,
    params: {
      name: options.name?.trim() || options.email.split("@")[0] || options.email,
      link: options.confirmLink,
    },
  });
}

export async function sendPasswordResetEmail(options: {
  email: string;
  resetLink: string;
  name?: string;
  languageCode?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return sendTemplatedEmail({
    kind: "password_reset",
    to: options.email,
    languageCode: options.languageCode,
    params: {
      name: options.name?.trim() || options.email.split("@")[0] || options.email,
      link: options.resetLink,
    },
  });
}

export async function sendTeamInviteNotice(options: {
  email: string;
  inviteLink: string;
  teamName: string;
  inviterName: string;
  name?: string;
  languageCode?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const teamName = options.teamName.trim() || "TASQIN";
  return sendTemplatedEmail({
    kind: "invite",
    to: options.email,
    languageCode: options.languageCode,
    heading: teamName,
    params: {
      name: options.name?.trim() || options.email.split("@")[0] || options.email,
      team: teamName,
      inviter: options.inviterName.trim() || teamName,
      link: options.inviteLink,
    },
  });
}
