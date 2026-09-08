import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllRows, fetchInChunks } from "@/app/lib/db/fetch-all-rows";
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
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export const EMAIL_NOTIFICATION_KIND_LIST = [
  "assigned",
  "unassigned",
  "comment",
  "due",
  "start",
  "file",
  "status_changed",
  "task_updated",
  "team_invite_rejected",
] as const satisfies readonly NotificationKind[];

export const EMAIL_NOTIFICATION_KINDS = new Set<NotificationKind>(
  EMAIL_NOTIFICATION_KIND_LIST,
);

/** Wait so rapid task edits (and other notifications) collapse into one email. */
export const NOTIFICATION_EMAIL_QUIET_MS = 20_000;

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

type PendingRow = {
  id: string;
  team_id: string;
  kind: string;
  actor_id: string | null;
  recipient_id: string | null;
  target_user_id: string | null;
  task_title: string;
  task_path: string | null;
  href: string | null;
  created_at: string;
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

export function digestNotificationKey(
  item: Pick<AppNotification, "kind" | "href" | "taskTitle">,
): string {
  return `${item.kind}:${item.href ?? ""}:${item.taskTitle.trim()}`;
}

export function dedupeDigestNotifications(
  items: AppNotification[],
): AppNotification[] {
  const seen = new Set<string>();
  const result: AppNotification[] = [];
  const sorted = [...items].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
  for (const item of sorted) {
    const key = digestNotificationKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function digestTitle(
  count: number,
  languageCode: string,
  overlay: Record<string, string>,
): string {
  const key = "email.notification.digest_title";
  const fallback =
    languageCode === "en" ? "{count} notifications" : "{count} paziņojumi";
  const template = overlay[key]?.trim() || catalogText(languageCode, key, fallback);
  return interpolate(template, { count: String(count) });
}

function buildCombinedMessage(
  items: AppNotification[],
  languageCode: string,
  overlay: Record<string, string>,
  membersById: Map<string, MemberRow>,
  usersById: Map<string, UserRow>,
  teamNameById: Map<string, string>,
): string {
  const teamIds = new Set(
    items.map((item) => item.teamId).filter((id): id is string => Boolean(id)),
  );
  const includeTeam = teamIds.size > 1;
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
      const text = notificationMessage(item, languageCode, overlay, actorName);
      const pathParts = [
        includeTeam && item.teamId
          ? teamNameById.get(item.teamId)?.trim() || null
          : null,
        item.taskPath?.trim() || null,
      ].filter((part): part is string => Boolean(part));
      const path = pathParts.join(" / ");
      return path ? `• ${text}\n${path}` : `• ${text}`;
    })
    .join("\n\n");
}

function resolveEmailLink(items: AppNotification[], origin: string): string {
  const hrefs = [
    ...new Set(
      items
        .map((item) => item.href?.trim())
        .filter((href): href is string => Boolean(href?.startsWith("/"))),
    ),
  ];
  if (hrefs.length === 1) {
    return `${origin}${hrefs[0]}`;
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

function rowToNotification(row: PendingRow): AppNotification | null {
  if (!EMAIL_NOTIFICATION_KINDS.has(row.kind as NotificationKind)) return null;
  const title = String(row.task_title ?? "").trim();
  if (!title) return null;
  return {
    id: row.id,
    kind: row.kind as NotificationKind,
    actorId: row.actor_id,
    recipientId: row.recipient_id,
    targetUserId: row.target_user_id,
    invitationId: null,
    taskTitle: title,
    taskPath: row.task_path?.trim() || null,
    href: row.href,
    createdAt: row.created_at,
    readAt: null,
    teamId: row.team_id,
    teamName: null,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function claimNotificationIds(
  supabase: SupabaseClient,
  ids: string[],
  claimedAt: string,
): Promise<string[]> {
  if (ids.length === 0) return [];
  const claimed: string[] = [];
  const chunkSize = 200;
  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize);
    const { data, error } = await supabase
      .from("app_notifications")
      .update({ email_sent_at: claimedAt })
      .in("id", chunk)
      .is("email_sent_at", null)
      .select("id");
    if (error) throw error;
    for (const row of data ?? []) {
      claimed.push(String((row as { id: string }).id));
    }
  }
  return claimed;
}

async function unclaimNotificationIds(
  supabase: SupabaseClient,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  const chunkSize = 200;
  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize);
    const { error } = await supabase
      .from("app_notifications")
      .update({ email_sent_at: null })
      .in("id", chunk);
    if (error) {
      logError("notification email unclaim failed", error);
    }
  }
}

export function scheduleNotificationEmailFlush(): void {
  const waitThenFlush = async () => {
    await sleep(NOTIFICATION_EMAIL_QUIET_MS);
    await flushPendingNotificationEmails({
      quietMs: NOTIFICATION_EMAIL_QUIET_MS,
    });
  };
  try {
    after(() => waitThenFlush());
  } catch {
    void waitThenFlush();
  }
}

export async function flushPendingNotificationEmails(input?: {
  supabase?: SupabaseClient;
  quietMs?: number;
}): Promise<number> {
  if (!isSupabaseAdminConfigured()) return 0;
  if (!(await getResendCredentials())) return 0;

  const supabase = input?.supabase ?? createAdminClient();
  const quietMs = input?.quietMs ?? 0;

  const pendingRows = (await fetchAllRows((from, to) =>
    supabase
      .from("app_notifications")
      .select(
        "id, team_id, kind, actor_id, recipient_id, target_user_id, task_title, task_path, href, created_at",
      )
      .is("email_sent_at", null)
      .in("kind", [...EMAIL_NOTIFICATION_KIND_LIST])
      .order("created_at", { ascending: true })
      .range(from, to),
  )) as PendingRow[];

  if (pendingRows.length === 0) return 0;

  const memberIds = new Set<string>();
  const userIds = new Set<string>();
  const teamIds = new Set<string>();
  for (const row of pendingRows) {
    if (row.team_id) teamIds.add(row.team_id);
    if (row.actor_id) memberIds.add(row.actor_id);
    if (row.recipient_id) memberIds.add(row.recipient_id);
    if (row.target_user_id) userIds.add(row.target_user_id);
  }

  const [memberRows, teamRows] = await Promise.all([
    fetchInChunks([...memberIds], (chunk) =>
      supabase
        .from("team_members")
        .select("id, user_id, name, email")
        .in("id", chunk),
    ) as Promise<MemberRow[]>,
    fetchInChunks([...teamIds], (chunk) =>
      supabase.from("teams").select("id, name").in("id", chunk),
    ) as Promise<{ id: string; name: string | null }[]>,
  ]);

  const membersById = new Map(memberRows.map((row) => [row.id, row]));
  const teamNameById = new Map(
    teamRows.map((row) => [row.id, String(row.name ?? "").trim()]),
  );
  for (const member of memberRows) {
    if (member.user_id) userIds.add(member.user_id);
  }

  const userRows =
    userIds.size > 0
      ? ((await fetchInChunks([...userIds], (chunk) =>
          supabase
            .from("users")
            .select("id, email, name, language_code")
            .in("id", chunk),
        )) as UserRow[])
      : [];
  const usersById = new Map(userRows.map((row) => [row.id, row]));

  const grouped = new Map<
    string,
    { user: UserRow; email: string; items: AppNotification[] }
  >();

  for (const row of pendingRows) {
    const item = rowToNotification(row);
    if (!item) continue;
    const member = item.recipientId ? membersById.get(item.recipientId) : null;
    const userId = item.targetUserId || member?.user_id || null;
    if (!userId) continue;
    const user = usersById.get(userId);
    const email = (user?.email || member?.email || "").trim().toLowerCase();
    if (!email) continue;
    const existing = grouped.get(userId);
    if (existing) {
      existing.items.push(item);
      continue;
    }
    grouped.set(userId, {
      user: user ?? {
        id: userId,
        email,
        name: member?.name ?? "",
        language_code: null,
      },
      email,
      items: [item],
    });
  }

  if (grouped.size === 0) return 0;

  const now = Date.now();
  const ready: Array<{
    user: UserRow;
    email: string;
    items: AppNotification[];
    claimIds: string[];
  }> = [];
  for (const entry of grouped.values()) {
    if (quietMs > 0) {
      const newest = entry.items.reduce(
        (latest, item) => Math.max(latest, Date.parse(item.createdAt) || 0),
        0,
      );
      if (newest > 0 && now - newest < quietMs) continue;
    }
    const items = dedupeDigestNotifications(entry.items);
    if (items.length === 0) continue;
    ready.push({
      ...entry,
      items,
      claimIds: entry.items.map((item) => item.id),
    });
  }

  if (ready.length === 0) return 0;

  const languages = await listSiteLanguages();
  const defaultLang =
    languages.find((language) => language.isDefault)?.code ?? "lv";
  const origin = getPublicSiteUrl();
  const overlayByLang = new Map<string, Record<string, string>>();

  async function overlayFor(code: string) {
    const existing = overlayByLang.get(code);
    if (existing) return existing;
    const overlay = await getSiteTranslationDictionary(code);
    overlayByLang.set(code, overlay);
    return overlay;
  }

  let sentCount = 0;
  for (const entry of ready) {
    const claimedAt = new Date().toISOString();
    let claimedIds: string[];
    try {
      claimedIds = await claimNotificationIds(
        supabase,
        entry.claimIds,
        claimedAt,
      );
    } catch (error) {
      logError("notification email claim failed", error);
      continue;
    }
    const claimedIdSet = new Set(claimedIds);
    const claimedItems = entry.items.filter((item) => claimedIdSet.has(item.id));
    if (claimedItems.length === 0) continue;

    const languageCode = entry.user.language_code?.trim() || defaultLang;
    const overlay = await overlayFor(languageCode);
    const teamName =
      (claimedItems[0]?.teamId
        ? teamNameById.get(claimedItems[0].teamId)
        : "") || "TASQIN";
    const heading = resolveEmailHeading(
      claimedItems,
      teamName,
      languageCode,
      overlay,
    );
    const sent = await sendTemplatedEmail({
      kind: "notification",
      to: entry.email,
      languageCode,
      heading,
      params: {
        name: entry.user.name?.trim() || entry.email.split("@")[0],
        team: teamName,
        title: heading,
        message: buildCombinedMessage(
          claimedItems,
          languageCode,
          overlay,
          membersById,
          usersById,
          teamNameById,
        ),
        link: resolveEmailLink(claimedItems, origin),
      },
    });
    if (!sent.ok) {
      logError("notification email failed", sent.error);
      await unclaimNotificationIds(supabase, claimedIds);
      continue;
    }
    sentCount += 1;
  }

  return sentCount;
}

export async function sendCronReminderEmails(
  supabase: SupabaseClient,
): Promise<number> {
  return flushPendingNotificationEmails({ supabase, quietMs: 0 });
}
