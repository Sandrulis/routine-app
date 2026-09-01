"use server";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { sendTeamNotificationEmails } from "@/app/lib/email/notification-email-sender";
import { getResendCredentials } from "@/app/lib/integrations/resend/client";
import type { AppNotification } from "@/app/lib/notifications";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

export async function sendNotificationEmailsAction(input: {
  teamId: string;
  items: AppNotification[];
}): Promise<void> {
  if (!isSupabaseConfigured() || input.items.length === 0) return;
  if (!(await getResendCredentials())) return;

  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  await sendTeamNotificationEmails({
    supabase,
    teamId: input.teamId,
    items: input.items,
    requireActorMembership: true,
  });
}
