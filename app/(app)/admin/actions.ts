"use server";

import { revalidatePath } from "next/cache";
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import {
  createAdminTeam,
  createAdminUser,
  createSiteLanguage,
  createSiteTranslation,
  deleteAdminTeam,
  deleteAdminUser,
  deleteSiteLanguage,
  deleteSiteTranslation,
  createTaskStatus,
  deleteTaskStatus,
  listAdminTeamMembers,
  listTaskStatuses,
  reorderTaskStatuses,
  saveSiteSettings,
  updateTaskStatus,
  createSystemDefaultRole,
  deleteSystemDefaultRole,
  listSystemDefaultRoles,
  reorderSystemDefaultRoles,
  updateSystemDefaultRole,
  setDefaultSiteLanguage,
  updateAdminTeam,
  updateAdminUser,
  updateSiteLanguageActiveStatus,
  updateSiteLanguageName,
  updateSiteTranslation,
} from "@/app/lib/site-admin/repository";
import type {
  AdminTeamInput,
  AdminTeamMemberSummary,
  AdminUserInput,
  TaskStatusInput,
  TaskStatusSummary,
  SiteLanguageInput,
  SiteSettingsInput,
  SiteTranslationInput,
  SystemDefaultRoleInput,
} from "@/app/lib/site-admin/types";
import { requireAdmin } from "@/app/lib/users/require-admin";

function refreshAdmin() {
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

export async function createAdminUserAction(input: AdminUserInput) {
  await requireAdmin();
  const result = await createAdminUser(input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function updateAdminUserAction(userId: string, input: AdminUserInput) {
  const actor = await requireAdmin();
  const result = await updateAdminUser(userId, input, actor.id);
  if (result.ok) refreshAdmin();
  return result;
}

export async function deleteAdminUserAction(userId: string) {
  const actor = await requireAdmin();
  const result = await deleteAdminUser(userId, actor.id);
  if (result.ok) refreshAdmin();
  return result;
}

export async function createAdminTeamAction(input: AdminTeamInput) {
  const user = await requireAdmin();
  const display = mapUserDisplay(user);
  const result = await createAdminTeam(input, {
    id: user.id,
    name: display.name,
    email: display.email,
    avatarUrl: display.avatarUrl,
  });
  if (result.ok) refreshAdmin();
  return result;
}

export async function updateAdminTeamAction(teamId: string, input: AdminTeamInput) {
  await requireAdmin();
  const result = await updateAdminTeam(teamId, input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function deleteAdminTeamAction(teamId: string) {
  await requireAdmin();
  const result = await deleteAdminTeam(teamId);
  if (result.ok) refreshAdmin();
  return result;
}

export async function listAdminTeamMembersAction(
  teamId: string,
): Promise<AdminTeamMemberSummary[]> {
  await requireAdmin();
  return listAdminTeamMembers(teamId);
}

export async function createSiteLanguageAction(input: SiteLanguageInput) {
  await requireAdmin();
  const result = await createSiteLanguage(input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function updateSiteLanguageNameAction(code: string, name: string) {
  await requireAdmin();
  const result = await updateSiteLanguageName(code, name);
  if (result.ok) refreshAdmin();
  return result;
}

export async function updateSiteLanguageActiveStatusAction(code: string, isActive: boolean) {
  await requireAdmin();
  const result = await updateSiteLanguageActiveStatus(code, isActive);
  if (result.ok) refreshAdmin();
  return result;
}

export async function setDefaultSiteLanguageAction(code: string) {
  await requireAdmin();
  const result = await setDefaultSiteLanguage(code);
  if (result.ok) refreshAdmin();
  return result;
}

export async function deleteSiteLanguageAction(code: string) {
  await requireAdmin();
  const result = await deleteSiteLanguage(code);
  if (result.ok) refreshAdmin();
  return result;
}

export async function createSiteTranslationAction(input: SiteTranslationInput) {
  await requireAdmin();
  const result = await createSiteTranslation(input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function updateSiteTranslationAction(
  currentKey: string,
  input: SiteTranslationInput,
) {
  await requireAdmin();
  const result = await updateSiteTranslation(currentKey, input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function deleteSiteTranslationAction(key: string) {
  await requireAdmin();
  const result = await deleteSiteTranslation(key);
  if (result.ok) refreshAdmin();
  return result;
}

export async function saveSiteSettingsAction(input: SiteSettingsInput) {
  await requireAdmin();
  const result = await saveSiteSettings(input);
  if (result.ok) refreshAdmin();
  return result;
}

// Task statuses
export async function listTaskStatusesAction(): Promise<TaskStatusSummary[]> {
  await requireAdmin();
  return listTaskStatuses();
}

export async function createTaskStatusAction(input: TaskStatusInput) {
  await requireAdmin();
  const result = await createTaskStatus(input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function updateTaskStatusAction(
  statusId: string,
  input: Omit<TaskStatusInput, "id">,
) {
  await requireAdmin();
  const result = await updateTaskStatus(statusId, input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function deleteTaskStatusAction(statusId: string) {
  await requireAdmin();
  const result = await deleteTaskStatus(statusId);
  if (result.ok) refreshAdmin();
  return result;
}

export async function reorderTaskStatusesAction(orderedIds: string[]) {
  await requireAdmin();
  const result = await reorderTaskStatuses(orderedIds);
  if (result.ok) refreshAdmin();
  return result;
}

export async function listSystemDefaultRolesAction() {
  await requireAdmin();
  return listSystemDefaultRoles();
}

export async function createSystemDefaultRoleAction(input: SystemDefaultRoleInput) {
  await requireAdmin();
  const result = await createSystemDefaultRole(input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function updateSystemDefaultRoleAction(
  roleId: string,
  input: SystemDefaultRoleInput,
) {
  await requireAdmin();
  const result = await updateSystemDefaultRole(roleId, input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function deleteSystemDefaultRoleAction(roleId: string) {
  await requireAdmin();
  const result = await deleteSystemDefaultRole(roleId);
  if (result.ok) refreshAdmin();
  return result;
}

export async function reorderSystemDefaultRolesAction(orderedIds: string[]) {
  await requireAdmin();
  const result = await reorderSystemDefaultRoles(orderedIds);
  if (result.ok) refreshAdmin();
  return result;
}
