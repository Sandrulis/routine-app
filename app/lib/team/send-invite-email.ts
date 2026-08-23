import { findAuthUserByEmailExact } from "@/app/lib/auth/find-auth-user-by-email";
import { sendTeamInviteNotice } from "@/app/lib/email/send-auth-emails";
import { isResendEnabled } from "@/app/lib/integrations/resend/client";
import { getPublicSiteUrl } from "@/app/lib/seo/site-url";
import { logError } from "@/app/lib/security/log-error";

export function teamInvitePublicUrl(token: string): string {
  return `${getPublicSiteUrl()}/invite/${token}`;
}

export async function resolveAuthUserIdByEmail(
  _admin: unknown,
  email: string,
): Promise<string | null> {
  const found = await findAuthUserByEmailExact(email);
  return found?.id ?? null;
}

export async function sendTeamInviteEmail(input: {
  email: string;
  token: string;
  teamName: string;
  inviterName: string;
  recipientName?: string;
  languageCode?: string | null;
}): Promise<
  { ok: true; emailSent: true } | { ok: true; emailSent: false } | { ok: false; error: string }
> {
  const email = input.email.trim().toLowerCase();
  const inviteLink = teamInvitePublicUrl(input.token);

  if (!(await isResendEnabled())) {
    return { ok: true, emailSent: false };
  }

  try {
    const sent = await sendTeamInviteNotice({
      email,
      inviteLink,
      teamName: input.teamName,
      inviterName: input.inviterName,
      name: input.recipientName,
      languageCode: input.languageCode,
    });
    if (!sent.ok) {
      return { ok: false, error: sent.error };
    }
    return { ok: true, emailSent: true };
  } catch (error) {
    logError(
      "sendTeamInviteNotice failed",
      error instanceof Error ? error.message : "unknown error",
    );
    return { ok: false, error: "errors.integrations_resend_send_failed" };
  }
}
