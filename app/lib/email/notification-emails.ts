"use server";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { scheduleNotificationEmailFlush } from "@/app/lib/email/notification-email-sender";
import { getResendCredentials } from "@/app/lib/integrations/resend/client";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

export async function sendNotificationEmailsAction(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  if (!(await getResendCredentials())) return;

  const user = await getCurrentUser();
  if (!user) return;

  scheduleNotificationEmailFlush();
}
