"use server";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { sendTemplatedEmail } from "@/app/lib/email/send-templated";
import { getResendCredentials } from "@/app/lib/integrations/resend/client";
import { interpolate } from "@/app/lib/i18n/interpolate";
import { messages } from "@/app/lib/i18n/messages";
import { isLanguageCode, type LanguageCode } from "@/app/lib/i18n/language";
import type { AppNotification, NotificationKind } from "@/app/lib/notifications";
import { getPublicSiteUrl } from "@/app/lib/seo/site-url";
import {
  getSiteTranslationDictionary,
  listSiteLanguages,
} from "@/app/lib/site-admin/repository";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { logError } from "@/app/lib/security/log-error";

const EMAIL_NOTIFICATION_KINDS = new Set<NotificationKind>([
  "assigned",
  "unassigned",
  "comment",
  "due",
  "file",
  "status_changed",
  "task_updated",
  "team_invite_rejected",
]);

const NOTIFICATION_FALLBACK: Record<NotificationKind, string> = {
  assigned: "{name} piešķīra tev “{task}”",
  unassigned: "{name} noņēma tevi no “{task}”",
  comment: "{name} komentēja “{task}”",
  due: "Tuvojas termiņš: “{task}”",
  file: "{name} pievienoja failu pie “{task}”",
  status_changed: "{name} mainīja statusu “{task}”",
  task_updated: "{name} atjaunināja “{task}”",
  team_invite: "{name} uzaicināja tevi pievienoties komandai “{team}”",
  team_invite_rejected:
    "{email} noraidīja uzaicinājumu pievienoties komandai “{team}”",
};

function catalogText(languageCode: string, key: string, fallback: string): string {
  const code: LanguageCode = isLanguageCode(languageCode) ? languageCode : "lv";
  return messages[code]?.[key] || messages.lv[key] || fallback;
}

function notificationMessage(
  item: AppNotification,
  languageCode: string,
  overlay: Record<string, string>,
  actorName: string,
): string {
  const key = `notifications.item.${item.kind}`;
  const fallback = NOTIFICATION_FALLBACK[item.kind];
  const template = overlay[key]?.trim() || catalogText(languageCode, key, fallback);
  return interpolate(template, {
    name: actorName,
    task: item.taskTitle,
    team: item.taskTitle,
    email: item.href ?? "",
    assignee: "",
  });
}

export async function sendNotificationEmailsAction(input: {
  teamId: string;
  items: AppNotification[];
}): Promise<void> {
  if (!isSupabaseConfigured() || input.items.length === 0) return;
  if (!(await getResendCredentials())) return;

  const user = await getCurrentUser();
  if (!user) return;

  const teamId = input.teamId.trim();
  if (!teamId) return;

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return;

  const items = input.items.filter((item) => EMAIL_NOTIFICATION_KINDS.has(item.kind));
  if (items.length === 0) return;

  const memberIds = new Set<string>();
  const userIds = new Set<string>();
  for (const item of items) {
    if (item.actorId) memberIds.add(item.actorId);
    if (item.recipientId) memberIds.add(item.recipientId);
    if (item.targetUserId) userIds.add(item.targetUserId);
  }

  const [{ data: memberRows }, { data: teamRow }] = await Promise.all([
    memberIds.size > 0
      ? supabase
          .from("team_members")
          .select("id, user_id, name, email")
          .eq("team_id", teamId)
          .in("id", [...memberIds])
      : Promise.resolve({ data: [] as { id: string; user_id: string | null; name: string; email: string }[] }),
    supabase.from("teams").select("name").eq("id", teamId).maybeSingle(),
  ]);

  const members = memberRows ?? [];
  for (const member of members) {
    if (member.user_id) userIds.add(member.user_id);
  }

  const { data: userRows } =
    userIds.size > 0
      ? await supabase
          .from("users")
          .select("id, email, name, language_code")
          .in("id", [...userIds])
      : { data: [] as { id: string; email: string; name: string; language_code: string | null }[] };

  const usersById = new Map((userRows ?? []).map((row) => [row.id, row]));
  const membersById = new Map(members.map((row) => [row.id, row]));
  const languages = await listSiteLanguages();
  const defaultLang =
    languages.find((language) => language.isDefault)?.code ?? "lv";
  const origin = getPublicSiteUrl();
  const teamName = teamRow?.name?.trim() || "TASQIN";

  const overlayByLang = new Map<string, Record<string, string>>();

  async function overlayFor(code: string) {
    const existing = overlayByLang.get(code);
    if (existing) return existing;
    const overlay = await getSiteTranslationDictionary(code);
    overlayByLang.set(code, overlay);
    return overlay;
  }

  for (const item of items) {
    const recipientUserId =
      item.targetUserId ||
      (item.recipientId ? membersById.get(item.recipientId)?.user_id : null);
    const recipientUser = recipientUserId ? usersById.get(recipientUserId) : null;
    const recipientMember = item.recipientId
      ? membersById.get(item.recipientId)
      : null;
    const email = (recipientUser?.email || recipientMember?.email || "").trim().toLowerCase();
    if (!email) continue;

    const actorMember = item.actorId ? membersById.get(item.actorId) : null;
    const actorUser = actorMember?.user_id
      ? usersById.get(actorMember.user_id)
      : null;
    const actorName =
      actorUser?.name?.trim() ||
      actorMember?.name?.trim() ||
      actorMember?.email?.split("@")[0] ||
      "";

    const languageCode = recipientUser?.language_code?.trim() || defaultLang;
    const overlay = await overlayFor(languageCode);
    const message = notificationMessage(item, languageCode, overlay, actorName);
    const href = item.href?.startsWith("/")
      ? `${origin}${item.href}`
      : `${origin}/dashboard`;

    const sent = await sendTemplatedEmail({
      kind: "notification",
      to: email,
      languageCode,
      heading: item.taskTitle.trim() || teamName,
      params: {
        name:
          recipientUser?.name?.trim() ||
          recipientMember?.name?.trim() ||
          email.split("@")[0],
        team: teamName,
        title: item.taskTitle.trim() || teamName,
        message,
        link: href,
      },
    });
    if (!sent.ok) {
      logError("notification email failed", sent.error);
    }
  }
}
