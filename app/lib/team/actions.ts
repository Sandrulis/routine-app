"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import { createNotificationId } from "@/app/lib/notifications";
import { getClientIp } from "@/app/lib/security/client-ip";
import { logError } from "@/app/lib/security/log-error";
import { sha256Hex } from "@/app/lib/security/hash-token";
import { consumeRateLimit } from "@/app/lib/security/rate-limit";
import { decryptSecret, persistSecret } from "@/app/lib/security/secret-box";
import { createAdminClient } from "@/app/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/app/lib/supabase/env";
import { createClient } from "@/app/lib/supabase/server";
import {
  createMemberId,
  MEMBER_TEAM_ROLE,
  OWNER_TEAM_ROLE,
  toneForIndex,
} from "@/app/lib/team";
import { isPendingPaymentSeat } from "@/app/lib/billing/seats";
import { notifyOpenPaidSeats } from "@/app/lib/billing/open-seat-notice";
import { isResendEnabled } from "@/app/lib/integrations/resend/client";
import { normalizeTeamPermissionSet } from "@/app/lib/team-permissions";
import {
  resolveAuthUserIdByEmail,
  sendTeamInviteEmail,
  teamInvitePublicUrl,
} from "@/app/lib/team/send-invite-email";
import { resolveInviteSeatDecision } from "@/app/lib/billing/invite-gate";
import type { ActionResult } from "@/app/lib/actions/action-result";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createInvitationToken(): string {
  return randomBytes(24).toString("base64url");
}

function createInvitationId(): string {
  return `invite-${randomBytes(12).toString("hex")}`;
}

function revealInviteToken(stored: string) {
  return decryptSecret(stored) || stored;
}

async function rollbackPendingInvite(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invitationId: string,
  memberId: string,
) {
  await supabase.from("team_invitations").delete().eq("id", invitationId);
  await supabase.from("team_members").delete().eq("id", memberId);
}

async function assertCanInvite(teamId: string, userId: string) {
  const supabase = await createClient();
  const { data: member, error } = await supabase
    .from("team_members")
    .select("id, role, role_id, team_roles ( permissions )")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !member) {
    return { ok: false as const, error: "errors.auth_required" };
  }

  if (member.role === OWNER_TEAM_ROLE) {
    return { ok: true as const, memberId: member.id };
  }

  const roleRow = Array.isArray(member.team_roles)
    ? member.team_roles[0]
    : member.team_roles;
  const permissions = normalizeTeamPermissionSet(roleRow?.permissions);
  if (!permissions.actions["team.invite"]) {
    return { ok: false as const, error: "errors.team_invite_forbidden" };
  }

  return { ok: true as const, memberId: member.id };
}

async function assertCanRemoveMember(teamId: string, userId: string) {
  const supabase = await createClient();
  const { data: member, error } = await supabase
    .from("team_members")
    .select("id, role, role_id, team_roles ( permissions )")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !member) {
    return { ok: false as const, error: "errors.auth_required" };
  }

  if (member.role === OWNER_TEAM_ROLE) {
    return { ok: true as const, memberId: member.id };
  }

  const roleRow = Array.isArray(member.team_roles)
    ? member.team_roles[0]
    : member.team_roles;
  const permissions = normalizeTeamPermissionSet(roleRow?.permissions);
  if (!permissions.actions["team.members.remove"]) {
    return { ok: false as const, error: "errors.team_member_remove_forbidden" };
  }

  return { ok: true as const, memberId: member.id };
}

async function resolveInviteTargetUserId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string,
  invitedUserId: string | null,
): Promise<string | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (invitedUserId) {
    const { data: invitedRow } = await supabase
      .from("users")
      .select("id")
      .eq("id", invitedUserId)
      .maybeSingle();
    if (invitedRow?.id) return invitedRow.id;
  }

  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (existingUser?.id) return existingUser.id;

  if (!isSupabaseAdminConfigured()) return null;

  const admin = createAdminClient();
  const authId = await resolveAuthUserIdByEmail(admin, normalizedEmail);
  if (!authId) return null;

  const { data: authData, error: authError } =
    await admin.auth.admin.getUserById(authId);
  if (authError || !authData.user) return null;

  const authUser = authData.user;
  const metadata = authUser.user_metadata as Record<string, unknown> | undefined;
  const given =
    typeof metadata?.given_name === "string" ? metadata.given_name.trim() : "";
  const family =
    typeof metadata?.family_name === "string" ? metadata.family_name.trim() : "";
  const name =
    [given, family].filter(Boolean).join(" ") ||
    (typeof metadata?.name === "string" && metadata.name.trim()) ||
    (typeof metadata?.full_name === "string" && metadata.full_name.trim()) ||
    authUser.email?.split("@")[0] ||
    normalizedEmail;

  const { error: upsertError } = await admin.from("users").upsert(
    {
      id: authId,
      email: (authUser.email ?? normalizedEmail).toLowerCase(),
      name,
      avatar: typeof metadata?.avatar === "string" ? metadata.avatar : "",
    },
    { onConflict: "id" },
  );

  if (upsertError) {
    console.error("resolveInviteTargetUserId upsert failed:", upsertError.message);
    return null;
  }

  return authId;
}

async function ensureTeamInviteNotification(input: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  teamId: string;
  memberId: string;
  actorMemberId: string;
  targetUserId: string;
  invitationId: string;
  refreshExisting?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: existingNotification } = await input.supabase
    .from("app_notifications")
    .select("id")
    .eq("invitation_id", input.invitationId)
    .maybeSingle();

  if (existingNotification) {
    if (!input.refreshExisting) return { ok: true };
    const { error } = await input.supabase
      .from("app_notifications")
      .update({ read_at: null })
      .eq("id", existingNotification.id);
    if (error) {
      console.error("ensureTeamInviteNotification update failed:", error.message);
      return { ok: false, error: "errors.team_invite_failed" };
    }
    return { ok: true };
  }

  const { data: teamRow } = await input.supabase
    .from("teams")
    .select("name")
    .eq("id", input.teamId)
    .maybeSingle();

  const { data: prefRow } = await input.supabase
    .from("user_notification_preferences")
    .select("enabled")
    .eq("user_id", input.targetUserId)
    .eq("kind", "team_invite")
    .maybeSingle();

  if (prefRow && prefRow.enabled === false) {
    return { ok: true };
  }

  const now = new Date().toISOString();
  const { error: notificationError } = await input.supabase
    .from("app_notifications")
    .insert({
      id: createNotificationId(),
      team_id: input.teamId,
      kind: "team_invite",
      actor_id: input.actorMemberId,
      recipient_id: input.memberId,
      target_user_id: input.targetUserId,
      invitation_id: input.invitationId,
      task_title: teamRow?.name ?? "",
      href: null,
      created_at: now,
      read_at: null,
    });

  if (notificationError) {
    console.error(
      "ensureTeamInviteNotification insert failed:",
      notificationError.message,
    );
    return { ok: false, error: "errors.team_invite_failed" };
  }

  return { ok: true };
}

export async function inviteTeamMemberAction(input: {
  teamId: string;
  email: string;
  roleId: string;
}): Promise<
  ActionResult<{
    memberId: string;
    inviteUrl: string;
    emailSent: boolean;
    emailError?: string;
    awaitingPayment: boolean;
  }>
> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const teamId = input.teamId.trim();
  const email = input.email.trim().toLowerCase();
  const roleId = input.roleId.trim();

  if (!teamId) {
    return { ok: false, error: "errors.team_invite_failed" };
  }
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "errors.email_invalid" };
  }

  const access = await assertCanInvite(teamId, user.id);
  if (!access.ok) {
    return access;
  }

  const seatDecision = await resolveInviteSeatDecision(teamId);
  if (!seatDecision.ok) {
    return seatDecision;
  }
  const awaitingPayment = seatDecision.seatStatus === "pending_payment";

  const supabase = await createClient();

  const { data: existingMember } = await supabase
    .from("team_members")
    .select("id, user_id")
    .eq("team_id", teamId)
    .ilike("email", email)
    .maybeSingle();

  if (existingMember?.user_id) {
    return { ok: false, error: "errors.team_invite_already_member" };
  }

  const { data: pendingInvite } = await supabase
    .from("team_invitations")
    .select("id")
    .eq("team_id", teamId)
    .eq("status", "pending")
    .ilike("email", email)
    .maybeSingle();

  if (pendingInvite) {
    return { ok: false, error: "errors.team_invite_already_pending" };
  }

  let roleSlug = MEMBER_TEAM_ROLE;
  let resolvedRoleId = roleId;

  const { data: roleRow, error: roleError } = await supabase
    .from("team_roles")
    .select("id, slug")
    .eq("team_id", teamId)
    .eq("id", roleId)
    .maybeSingle();

  if (roleError || !roleRow) {
    const { data: fallbackRole } = await supabase
      .from("team_roles")
      .select("id, slug")
      .eq("team_id", teamId)
      .eq("slug", MEMBER_TEAM_ROLE)
      .maybeSingle();
    if (!fallbackRole) {
      return { ok: false, error: "errors.team_invite_failed" };
    }
    resolvedRoleId = fallbackRole.id;
    roleSlug = fallbackRole.slug;
  } else {
    resolvedRoleId = roleRow.id;
    roleSlug = roleRow.slug;
  }

  const { data: teamRow, error: teamError } = await supabase
    .from("teams")
    .select("name")
    .eq("id", teamId)
    .maybeSingle();

  if (teamError || !teamRow) {
    return { ok: false, error: "errors.team_invite_failed" };
  }

  const { count } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId);

  const memberId = createMemberId();
  const invitationId = createInvitationId();
  const token = createInvitationToken();
  const now = new Date().toISOString();

  const { data: existingUser } = await supabase
    .from("users")
    .select("id, name")
    .ilike("email", email)
    .maybeSingle();

  const pendingName = existingUser?.name?.trim() ?? "";

  if (!awaitingPayment && !(await isResendEnabled())) {
    const previewAuthId = existingUser?.id
      ? existingUser.id
      : await resolveAuthUserIdByEmail(null, email);
    if (!previewAuthId) {
      return { ok: false, error: "errors.team_invite_email_not_configured" };
    }
  }

  const { error: memberInsertError } = await supabase.from("team_members").insert({
    id: memberId,
    team_id: teamId,
    user_id: null,
    email,
    name: pendingName,
    role: roleSlug,
    role_id: resolvedRoleId,
    tone_class_name: toneForIndex(count ?? 0),
    avatar_url: null,
    last_online_at: null,
    seat_status: seatDecision.seatStatus,
  });

  if (memberInsertError) {
    return { ok: false, error: "errors.team_invite_failed" };
  }

  const { error: inviteInsertError } = await supabase.from("team_invitations").insert({
    id: invitationId,
    team_id: teamId,
    member_id: memberId,
    invited_by_member_id: access.memberId,
    invited_user_id: existingUser?.id ?? null,
    email,
    status: "pending",
    token: persistSecret(token),
    token_hash: sha256Hex(token),
    created_at: now,
  });

  if (inviteInsertError) {
    await supabase.from("team_members").delete().eq("id", memberId);
    return { ok: false, error: "errors.team_invite_failed" };
  }

  const targetUserId = await resolveInviteTargetUserId(
    supabase,
    email,
    existingUser?.id ?? null,
  );

  if (targetUserId && targetUserId !== (existingUser?.id ?? null)) {
    await supabase
      .from("team_invitations")
      .update({ invited_user_id: targetUserId })
      .eq("id", invitationId);
  }

  if (targetUserId && !awaitingPayment) {
    const notificationResult = await ensureTeamInviteNotification({
      supabase,
      teamId,
      memberId,
      actorMemberId: access.memberId,
      targetUserId,
      invitationId,
    });
    if (!notificationResult.ok) {
      await rollbackPendingInvite(supabase, invitationId, memberId);
      return notificationResult;
    }
  }

  let emailSent = false;
  let emailError: string | undefined;
  if (!awaitingPayment) {
    const inviterName = mapUserDisplay(user).name || user.email || "";
    const { data: inviterProfile } = await supabase
      .from("users")
      .select("language_code")
      .eq("id", user.id)
      .maybeSingle();
    const emailResult = await sendTeamInviteEmail({
      email,
      token,
      teamName: teamRow.name,
      inviterName,
      recipientName: pendingName || undefined,
      languageCode: inviterProfile?.language_code,
    });
    if (!emailResult.ok) {
      if (!targetUserId) {
        await rollbackPendingInvite(supabase, invitationId, memberId);
        return emailResult;
      }
      emailError = emailResult.error;
      logError("Invite email failed but user exists in-app, keeping invitation", emailResult.error);
    } else {
      emailSent = emailResult.emailSent;
    }
  }

  revalidatePath("/", "layout");
  return {
    ok: true,
    data: {
      memberId,
      inviteUrl: awaitingPayment ? "" : teamInvitePublicUrl(token),
      emailSent,
      emailError,
      awaitingPayment,
    },
  };
}

export async function isTeamInviteEmailEnabledAction(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return isResendEnabled();
}

export async function acceptTeamInvitationAction(
  invitationId: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_team_invitation", {
    p_invitation_id: invitationId.trim(),
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("invitation_not_found")) {
      return { ok: false, error: "errors.team_invite_not_found" };
    }
    if (message.includes("invitation_forbidden")) {
      return { ok: false, error: "errors.team_invite_forbidden" };
    }
    if (message.includes("invitation_payment_required")) {
      return { ok: false, error: "errors.team_invite_awaiting_payment" };
    }
    return { ok: false, error: "errors.team_invite_accept_failed" };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function rejectTeamInvitationAction(
  invitationId: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_team_invitation", {
    p_invitation_id: invitationId.trim(),
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("invitation_not_found")) {
      return { ok: false, error: "errors.team_invite_not_found" };
    }
    if (message.includes("invitation_forbidden")) {
      return { ok: false, error: "errors.team_invite_forbidden" };
    }
    return { ok: false, error: "errors.team_invite_reject_failed" };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function acceptTeamInvitationByTokenAction(
  token: string,
): Promise<ActionResult<{ invitationId: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_team_invitation_by_token", {
    p_token: token.trim(),
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("invitation_not_found")) {
      return { ok: false, error: "errors.team_invite_not_found" };
    }
    if (message.includes("invitation_forbidden")) {
      return { ok: false, error: "errors.team_invite_forbidden" };
    }
    if (message.includes("invitation_payment_required")) {
      return { ok: false, error: "errors.team_invite_awaiting_payment" };
    }
    return { ok: false, error: "errors.team_invite_accept_failed" };
  }

  revalidatePath("/", "layout");
  return { ok: true, data: { invitationId: String(data) } };
}

export async function resendTeamInvitationAction(
  memberId: string,
): Promise<ActionResult<{ inviteUrl: string; emailSent: boolean; emailError?: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const trimmedMemberId = memberId.trim();
  if (!trimmedMemberId) {
    return { ok: false, error: "errors.team_invite_not_found" };
  }

  const supabase = await createClient();

  const { data: member, error: memberError } = await supabase
    .from("team_members")
    .select("id, team_id, user_id, email, seat_status")
    .eq("id", trimmedMemberId)
    .maybeSingle();

  if (memberError || !member) {
    return { ok: false, error: "errors.team_invite_not_found" };
  }

  if (member.user_id) {
    return { ok: false, error: "errors.team_invite_not_pending" };
  }

  if (member.seat_status === "pending_payment") {
    return { ok: false, error: "errors.team_invite_awaiting_payment" };
  }

  const access = await assertCanInvite(member.team_id, user.id);
  if (!access.ok) {
    return access;
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const { data: invitation, error: invitationError } = await createAdminClient()
    .from("team_invitations")
    .select("id, email, token, invited_user_id, status")
    .eq("member_id", trimmedMemberId)
    .eq("status", "pending")
    .maybeSingle();

  if (invitationError || !invitation) {
    return { ok: false, error: "errors.team_invite_not_found" };
  }

  const targetUserId = await resolveInviteTargetUserId(
    supabase,
    invitation.email,
    invitation.invited_user_id,
  );

  if (!(await isResendEnabled()) && !targetUserId) {
    return { ok: false, error: "errors.team_invite_email_not_configured" };
  }

  if (targetUserId && targetUserId !== invitation.invited_user_id) {
    await supabase
      .from("team_invitations")
      .update({ invited_user_id: targetUserId })
      .eq("id", invitation.id);
  }

  if (targetUserId) {
    const notificationResult = await ensureTeamInviteNotification({
      supabase,
      teamId: member.team_id,
      memberId: member.id,
      actorMemberId: access.memberId,
      targetUserId,
      invitationId: invitation.id,
      refreshExisting: true,
    });
    if (!notificationResult.ok) {
      return notificationResult;
    }
  }

  let emailSent = false;
  let emailError: string | undefined;
  const { data: teamRow } = await supabase
    .from("teams")
    .select("name")
    .eq("id", member.team_id)
    .maybeSingle();
  const { data: inviterProfile } = await supabase
    .from("users")
    .select("language_code")
    .eq("id", user.id)
    .maybeSingle();
  const emailResult = await sendTeamInviteEmail({
    email: invitation.email,
    token: revealInviteToken(invitation.token),
    teamName: teamRow?.name ?? "",
    inviterName: mapUserDisplay(user).name || user.email || "",
    languageCode: inviterProfile?.language_code,
  });
  if (!emailResult.ok) {
    if (!targetUserId) {
      return emailResult;
    }
    emailError = emailResult.error;
    logError(
      "Resend email failed but user exists in-app, continuing",
      emailResult.error,
    );
  } else {
    emailSent = emailResult.emailSent;
  }

  revalidatePath("/", "layout");
  return {
    ok: true,
    data: {
      inviteUrl: teamInvitePublicUrl(revealInviteToken(invitation.token)),
      emailSent,
      emailError,
    },
  };
}

export async function getTeamInviteLinkAction(
  memberId: string,
): Promise<ActionResult<{ inviteUrl: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const trimmedMemberId = memberId.trim();
  if (!trimmedMemberId) {
    return { ok: false, error: "errors.team_invite_not_found" };
  }

  const supabase = await createClient();
  const { data: member, error: memberError } = await supabase
    .from("team_members")
    .select("id, team_id, user_id, seat_status")
    .eq("id", trimmedMemberId)
    .maybeSingle();

  if (memberError || !member) {
    return { ok: false, error: "errors.team_invite_not_found" };
  }

  if (member.user_id) {
    return { ok: false, error: "errors.team_invite_not_pending" };
  }

  if (member.seat_status === "pending_payment") {
    return { ok: false, error: "errors.team_invite_awaiting_payment" };
  }

  const access = await assertCanInvite(member.team_id, user.id);
  if (!access.ok) {
    return access;
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const { data: invitation, error: invitationError } = await createAdminClient()
    .from("team_invitations")
    .select("token")
    .eq("member_id", trimmedMemberId)
    .eq("status", "pending")
    .maybeSingle();

  if (invitationError || !invitation?.token) {
    return { ok: false, error: "errors.team_invite_not_found" };
  }

  return {
    ok: true,
    data: { inviteUrl: teamInvitePublicUrl(revealInviteToken(invitation.token)) },
  };
}

export async function removeTeamMemberAction(
  memberId: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const trimmedMemberId = memberId.trim();
  if (!trimmedMemberId) {
    return { ok: false, error: "errors.team_member_remove_failed" };
  }

  const supabase = await createClient();

  const { data: member, error: memberError } = await supabase
    .from("team_members")
    .select("id, team_id, user_id, role, seat_status")
    .eq("id", trimmedMemberId)
    .maybeSingle();

  if (memberError || !member) {
    return { ok: false, error: "errors.team_member_remove_failed" };
  }

  if (member.role === OWNER_TEAM_ROLE) {
    return { ok: false, error: "errors.team_member_leave_owner" };
  }

  const isSelfLeave = member.user_id === user.id;

  if (!isSelfLeave) {
    const isPending = !member.user_id;
    const removeAccess = await assertCanRemoveMember(member.team_id, user.id);
    const inviteAccess = isPending
      ? await assertCanInvite(member.team_id, user.id)
      : { ok: false as const, error: "errors.team_member_remove_forbidden" };
    if (!removeAccess.ok && !inviteAccess.ok) {
      return { ok: false, error: "errors.team_member_remove_forbidden" };
    }
  }

  await supabase
    .from("app_notifications")
    .delete()
    .eq("recipient_id", trimmedMemberId);

  if (isSelfLeave) {
    await supabase
      .from("app_notifications")
      .delete()
      .eq("target_user_id", user.id)
      .eq("team_id", member.team_id);
  }

  const { error: deleteError } = await supabase
    .from("team_members")
    .delete()
    .eq("id", trimmedMemberId);

  if (deleteError) {
    return { ok: false, error: "errors.team_member_remove_failed" };
  }

  if (!isPendingPaymentSeat(member.seat_status)) {
    try {
      await notifyOpenPaidSeats(member.team_id);
    } catch (error) {
      logError(
        "notifyOpenPaidSeats",
        error instanceof Error ? error.message : "failed",
      );
    }
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function getTeamInvitationByTokenAction(token: string): Promise<
  ActionResult<{
    invitationId: string;
    teamName: string;
    inviterName: string;
    email: string;
    accountExists: boolean;
    awaitingPayment: boolean;
  }>
> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const limited = await consumeRateLimit(
    `invite-preview:${await getClientIp()}`,
    30,
    15 * 60 * 1000,
  );
  if (!limited.ok) {
    return { ok: false, error: "errors.auth_rate_limited" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("preview_team_invitation", {
    p_token: token.trim(),
  });

  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) {
    return { ok: false, error: "errors.team_invite_not_found" };
  }

  return {
    ok: true,
    data: {
      invitationId: String(row.invitation_id),
      teamName: String(row.team_name ?? ""),
      inviterName: String(row.inviter_name ?? ""),
      email: String(row.email ?? ""),
      accountExists: Boolean(row.account_exists),
      awaitingPayment: Boolean(row.awaiting_payment),
    },
  };
}

/** Full invite email for signup (token from e-mail link). */
export async function getInviteSignupContextAction(token: string): Promise<
  ActionResult<{
    email: string;
    teamName: string;
    inviterName: string;
    nextPath: string;
  }>
> {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const trimmed = token.trim();
  if (!trimmed) {
    return { ok: false, error: "errors.team_invite_not_found" };
  }

  const limited = await consumeRateLimit(
    `invite-signup:${await getClientIp()}`,
    20,
    15 * 60 * 1000,
  );
  if (!limited.ok) {
    return { ok: false, error: "errors.auth_rate_limited" };
  }

  const admin = createAdminClient();
  const tokenHash = sha256Hex(trimmed);
  let { data: invitation, error } = await admin
    .from("team_invitations")
    .select("id, email, invited_user_id, status, team_id, invited_by_member_id, member_id")
    .eq("token_hash", tokenHash)
    .eq("status", "pending")
    .maybeSingle();
  if (!invitation) {
    const fallback = await admin
      .from("team_invitations")
      .select("id, email, invited_user_id, status, team_id, invited_by_member_id, member_id")
      .eq("token", trimmed)
      .eq("status", "pending")
      .maybeSingle();
    invitation = fallback.data;
    error = fallback.error;
  }

  if (error || !invitation) {
    return { ok: false, error: "errors.team_invite_not_found" };
  }

  const email = String(invitation.email ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    return { ok: false, error: "errors.team_invite_not_found" };
  }

  if (invitation.invited_user_id) {
    return { ok: false, error: "errors.team_invite_account_exists" };
  }

  const { data: seatRow } = await admin
    .from("team_members")
    .select("seat_status")
    .eq("id", invitation.member_id)
    .maybeSingle();
  if (seatRow?.seat_status === "pending_payment") {
    return { ok: false, error: "errors.team_invite_awaiting_payment" };
  }

  const { data: existingUser } = await admin
    .from("users")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (existingUser?.id) {
    return { ok: false, error: "errors.team_invite_account_exists" };
  }

  const [{ data: teamRow }, { data: inviterRow }] = await Promise.all([
    admin.from("teams").select("name").eq("id", invitation.team_id).maybeSingle(),
    admin
      .from("team_members")
      .select("name")
      .eq("id", invitation.invited_by_member_id)
      .maybeSingle(),
  ]);

  return {
    ok: true,
    data: {
      email,
      teamName: String(teamRow?.name ?? ""),
      inviterName: String(inviterRow?.name ?? ""),
      nextPath: `/invite/${trimmed}`,
    },
  };
}
