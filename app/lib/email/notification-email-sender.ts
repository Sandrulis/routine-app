import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTemplatedEmail } from "@/app/lib/email/send-templated";
import { getResendCredentials } from "@/app/lib/integrations/resend/client";
import { interpolate } from "@/app/lib/i18n/interpolate";
import { allMessages as messages } from "@/app/lib/i18n/all-messages";
import { isLanguageCode, type LanguageCode } from "@/app/lib/i18n/language";
import type { AppNotification, NotificationKind } from "@/app/lib/notifications";
import { getPublicSiteUrl } from "@/app/lib/seo/site-url";
import {
  getSiteTranslationDictionary,
  listSiteLanguages,
} from "@/app/lib/site-admin/repository";
import { logError } from "@/app/lib/security/log-error";

export const EMAIL_NOTIFICATION_KINDS = new Set<NotificationKind>([
  "assigned",
  "unassigned",
  "comment",
  "due",
  "start",
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
  start: "Jāuzsāk: “{task}”",
  file: "{name} pievienoja failu pie “{task}”",
  status_changed: "{name} mainīja statusu “{task}”",
  task_updated: "{name} atjaunināja “{task}”",
  team_invite: "{name} uzaicināja tevi pievienoties komandai “{team}”",
  team_invite_rejected:
    "{email} noraidīja uzaicinājumu pievienoties komandai “{team}”",
  seat_open: "Komandā ir brīva apmaksāta vieta līdz {until}.",
  billing_due: "No nākamā mēneša ({until}) būs jāmaksā par komandas lietotājiem.",
};

type MemberRow = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  language_code: string | null;
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
    until: item.taskTitle,
  });
}

function resolveRecipientUserId(
  item: AppNotification,
  membersById: Map<string, MemberRow>,
): string | null {
  if (item.targetUserId) return item.targetUserId;
  if (!item.recipientId) return null;
  return membersById.get(item.recipientId)?.user_id ?? null;
}

function groupItemsByRecipientUser(
  items: AppNotification[],
  membersById: Map<string, MemberRow>,
): Map<string, AppNotification[]> {
  const grouped = new Map<string, AppNotification[]>();
  for (const item of items) {
    const userId = resolveRecipientUserId(item, membersById);
    if (!userId) continue;
    const list = grouped.get(userId) ?? [];
    list.push(item);
    grouped.set(userId, list);
  }
  return grouped;
}

function digestTitle(
  count: number,
  languageCode: string,
  overlay: Record<string, string>,
): string {
  const key = "email.notification.reminder_digest_title";
  const fallback =
    languageCode === "en" ? "{count} reminders" : "{count} atgādinājumi";
  const template = overlay[key]?.trim() || catalogText(languageCode, key, fallback);
  return interpolate(template, { count: String(count) });
}

function buildCombinedMessage(
  items: AppNotification[],
  languageCode: string,
  overlay: Record<string, string>,
  membersById: Map<string, MemberRow>,
  usersById: Map<string, UserRow>,
): string {
  return items
    .map((item) => {
      const actorMember = item.actorId ? membersById.get(item.actorId) : null;
      const actorUser = actorMember?.user_id
        ? usersById.get(actorMember.user_id)
        : null;
      const actorName =
        actorUser?.name?.trim() ||
        actorMember?.name?.trim() ||
        actorMember?.email?.split("@")[0] ||
        "";
      return `• ${notificationMessage(item, languageCode, overlay, actorName)}`;
    })
    .join("\n\n");
}

function resolveEmailLink(items: AppNotification[], origin: string): string {
  if (items.length === 1) {
    const href = items[0].href?.trim();
    if (href?.startsWith("/")) {
      return `${origin}${href}`;
    }
  }
  return `${origin}/dashboard`;
}

function resolveEmailHeading(
  items: AppNotification[],
  teamName: string,
  languageCode: string,
  overlay: Record<string, string>,
): string {
  if (items.length === 1) {
    return items[0].taskTitle.trim() || teamName;
  }
  return digestTitle(items.length, languageCode, overlay);
}

export async function sendTeamNotificationEmails(input: {
  supabase: SupabaseClient;
  teamId: string;
  items: AppNotification[];
  requireActorMembership?: boolean;
}): Promise<number> {
  if (input.items.length === 0) return 0;
  if (!(await getResendCredentials())) return 0;

  const teamId = input.teamId.trim();
  if (!teamId) return 0;

  const items = input.items.filter((item) => EMAIL_NOTIFICATION_KINDS.has(item.kind));
  if (items.length === 0) return 0;

  if (input.requireActorMembership) {
    const {
      data: { user },
    } = await input.supabase.auth.getUser();
    if (!user) return 0;
    const { data: membership } = await input.supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) return 0;
  }

  const memberIds = new Set<string>();
  const userIds = new Set<string>();
  for (const item of items) {
    if (item.actorId) memberIds.add(item.actorId);
    if (item.recipientId) memberIds.add(item.recipientId);
    if (item.targetUserId) userIds.add(item.targetUserId);
  }

  const [{ data: memberRows }, { data: teamRow }] = await Promise.all([
    memberIds.size > 0
      ? input.supabase
          .from("team_members")
          .select("id, user_id, name, email")
          .eq("team_id", teamId)
          .in("id", [...memberIds])
      : Promise.resolve({ data: [] as MemberRow[] }),
    input.supabase.from("teams").select("name").eq("id", teamId).maybeSingle(),
  ]);

  const members = memberRows ?? [];
  for (const member of members) {
    if (member.user_id) userIds.add(member.user_id);
  }

  const { data: userRows } =
    userIds.size > 0
      ? await input.supabase
          .from("users")
          .select("id, email, name, language_code")
          .in("id", [...userIds])
      : { data: [] as UserRow[] };

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

  const grouped = groupItemsByRecipientUser(items, membersById);
  let sentCount = 0;

  for (const [recipientUserId, recipientItems] of grouped) {
    const recipientUser = usersById.get(recipientUserId);
    const recipientMember = recipientItems[0]?.recipientId
      ? membersById.get(recipientItems[0].recipientId)
      : null;
    const email = (recipientUser?.email || recipientMember?.email || "")
      .trim()
      .toLowerCase();
    if (!email) continue;

    const languageCode = recipientUser?.language_code?.trim() || defaultLang;
    const overlay = await overlayFor(languageCode);
    const message = buildCombinedMessage(
      recipientItems,
      languageCode,
      overlay,
      membersById,
      usersById,
    );
    const heading = resolveEmailHeading(
      recipientItems,
      teamName,
      languageCode,
      overlay,
    );
    const link = resolveEmailLink(recipientItems, origin);

    const sent = await sendTemplatedEmail({
      kind: "notification",
      to: email,
      languageCode,
      heading,
      params: {
        name:
          recipientUser?.name?.trim() ||
          recipientMember?.name?.trim() ||
          email.split("@")[0],
        team: teamName,
        title: heading,
        message,
        link,
      },
    });
    if (!sent.ok) {
      logError("notification email failed", sent.error);
      continue;
    }
    sentCount += 1;
  }

  return sentCount;
}

export async function sendCronReminderEmails(
  supabase: SupabaseClient,
  rows: Array<{ teamId: string; item: AppNotification }>,
): Promise<number> {
  if (rows.length === 0) return 0;

  const byTeam = new Map<string, AppNotification[]>();
  for (const row of rows) {
    const list = byTeam.get(row.teamId) ?? [];
    list.push(row.item);
    byTeam.set(row.teamId, list);
  }

  let sentCount = 0;
  for (const [teamId, items] of byTeam) {
    sentCount += await sendTeamNotificationEmails({
      supabase,
      teamId,
      items,
      requireActorMembership: false,
    });
  }
  return sentCount;
}
