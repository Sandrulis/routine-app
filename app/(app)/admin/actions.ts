"use server";

import { revalidatePath } from "next/cache";
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import {
  createFrontendModule,
  deleteFrontendModule,
  updateFrontendModuleEnabled,
} from "@/app/lib/frontend-modules/repository";
import type { FrontendModuleInput } from "@/app/lib/frontend-modules/types";
import {
  createPaymentPlan,
  deletePaymentPlan,
  saveEarlyBirdSettings,
  saveTrialSettings,
  setPaymentPlansEnabled,
  updatePaymentPlan,
  type EarlyBirdSettings,
  type PaymentPlanInput,
  type TrialSettings,
} from "@/app/lib/payment-plans/repository";
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
  createFileTypeExtension,
  deleteFileTypeExtension,
  updateFileTypeExtension,
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
import { saveEmailTemplateDrafts } from "@/app/lib/email/templates-server";
import type { EmailTemplateDraft } from "@/app/lib/email/templates";
import type {
  AdminTeamInput,
  AdminTeamMemberSummary,
  AdminUserInput,
  TaskStatusInput,
  TaskStatusSummary,
  FileTypeExtensionInput,
  SiteLanguageInput,
  SiteSettingsInput,
  SiteTranslationInput,
  SystemDefaultRoleInput,
} from "@/app/lib/site-admin/types";
import { SITE_INTEGRATION_KEYS } from "@/app/lib/integrations/keys";
import { saveSimpleIntegrationCredentials } from "@/app/lib/integrations/simple/repository";
import { requireAdmin } from "@/app/lib/users/require-admin";

function refreshAdmin() {
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

export async function createAdminUserAction(input: AdminUserInput) {
  await requireAdmin({ action: "admin.user.create" });
  const result = await createAdminUser(input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function updateAdminUserAction(userId: string, input: AdminUserInput) {
  const actor = await requireAdmin({ action: "admin.user.update", target: userId });
  const result = await updateAdminUser(userId, input, actor.id);
  if (result.ok) refreshAdmin();
  return result;
}

export async function deleteAdminUserAction(userId: string) {
  const actor = await requireAdmin({ action: "admin.user.delete", target: userId });
  const result = await deleteAdminUser(userId, actor.id);
  if (result.ok) refreshAdmin();
  return result;
}

export async function createAdminTeamAction(input: AdminTeamInput) {
  const user = await requireAdmin({ action: "admin.team.create" });
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
  await requireAdmin({ action: "admin.team.update", target: teamId });
  const result = await updateAdminTeam(teamId, input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function deleteAdminTeamAction(teamId: string) {
  await requireAdmin({ action: "admin.team.delete", target: teamId });
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
  await requireAdmin({ action: "admin.language.create" });
  const result = await createSiteLanguage(input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function updateSiteLanguageNameAction(code: string, name: string) {
  await requireAdmin({ action: "admin.language.rename", target: code });
  const result = await updateSiteLanguageName(code, name);
  if (result.ok) refreshAdmin();
  return result;
}

export async function updateSiteLanguageActiveStatusAction(code: string, isActive: boolean) {
  await requireAdmin({ action: "admin.language.active", target: code });
  const result = await updateSiteLanguageActiveStatus(code, isActive);
  if (result.ok) refreshAdmin();
  return result;
}

export async function setDefaultSiteLanguageAction(code: string) {
  await requireAdmin({ action: "admin.language.default", target: code });
  const result = await setDefaultSiteLanguage(code);
  if (result.ok) refreshAdmin();
  return result;
}

export async function deleteSiteLanguageAction(code: string) {
  await requireAdmin({ action: "admin.language.delete", target: code });
  const result = await deleteSiteLanguage(code);
  if (result.ok) refreshAdmin();
  return result;
}

export async function createSiteTranslationAction(input: SiteTranslationInput) {
  await requireAdmin({ action: "admin.translation.create" });
  const result = await createSiteTranslation(input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function updateSiteTranslationAction(
  currentKey: string,
  input: SiteTranslationInput,
) {
  await requireAdmin({ action: "admin.translation.update", target: currentKey });
  const result = await updateSiteTranslation(currentKey, input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function deleteSiteTranslationAction(key: string) {
  await requireAdmin({ action: "admin.translation.delete", target: key });
  const result = await deleteSiteTranslation(key);
  if (result.ok) refreshAdmin();
  return result;
}

export async function saveSiteSettingsAction(
  input: SiteSettingsInput,
  resendMail?: { fromEmail: string; replyToEmail: string },
) {
  await requireAdmin({ action: "admin.settings.save" });
  if (resendMail) {
    const mail = await saveSimpleIntegrationCredentials(SITE_INTEGRATION_KEYS.resend, {
      clientId: resendMail.fromEmail,
      clientSecret: "",
      replyToEmail: resendMail.replyToEmail,
    });
    if (!mail.ok) return mail;
  }
  const result = await saveSiteSettings(input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function saveEmailTemplatesAction(drafts: EmailTemplateDraft[]) {
  await requireAdmin({ action: "admin.email_templates.save" });
  const result = await saveEmailTemplateDrafts(drafts);
  if (result.ok) refreshAdmin();
  return result;
}

// Task statuses
export async function listTaskStatusesAction(): Promise<TaskStatusSummary[]> {
  await requireAdmin();
  return listTaskStatuses();
}

export async function createTaskStatusAction(input: TaskStatusInput) {
  await requireAdmin({ action: "admin.status.create" });
  const result = await createTaskStatus(input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function updateTaskStatusAction(
  statusId: string,
  input: Omit<TaskStatusInput, "id">,
) {
  await requireAdmin({ action: "admin.status.update", target: statusId });
  const result = await updateTaskStatus(statusId, input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function deleteTaskStatusAction(statusId: string) {
  await requireAdmin({ action: "admin.status.delete", target: statusId });
  const result = await deleteTaskStatus(statusId);
  if (result.ok) refreshAdmin();
  return result;
}

export async function reorderTaskStatusesAction(orderedIds: string[]) {
  await requireAdmin({ action: "admin.status.reorder" });
  const result = await reorderTaskStatuses(orderedIds);
  if (result.ok) refreshAdmin();
  return result;
}

export async function listSystemDefaultRolesAction() {
  await requireAdmin();
  return listSystemDefaultRoles();
}

export async function createSystemDefaultRoleAction(input: SystemDefaultRoleInput) {
  await requireAdmin({ action: "admin.role.create" });
  const result = await createSystemDefaultRole(input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function updateSystemDefaultRoleAction(
  roleId: string,
  input: SystemDefaultRoleInput,
) {
  await requireAdmin({ action: "admin.role.update", target: roleId });
  const result = await updateSystemDefaultRole(roleId, input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function deleteSystemDefaultRoleAction(roleId: string) {
  await requireAdmin({ action: "admin.role.delete", target: roleId });
  const result = await deleteSystemDefaultRole(roleId);
  if (result.ok) refreshAdmin();
  return result;
}

export async function reorderSystemDefaultRolesAction(orderedIds: string[]) {
  await requireAdmin({ action: "admin.role.reorder" });
  const result = await reorderSystemDefaultRoles(orderedIds);
  if (result.ok) refreshAdmin();
  return result;
}

export async function createFileTypeExtensionAction(input: FileTypeExtensionInput) {
  await requireAdmin({ action: "admin.file_type.create" });
  const result = await createFileTypeExtension(input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function updateFileTypeExtensionAction(
  extension: string,
  input: Omit<FileTypeExtensionInput, "extension">,
) {
  await requireAdmin({ action: "admin.file_type.update", target: extension });
  const result = await updateFileTypeExtension(extension, input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function deleteFileTypeExtensionAction(extension: string) {
  await requireAdmin({ action: "admin.file_type.delete", target: extension });
  const result = await deleteFileTypeExtension(extension);
  if (result.ok) refreshAdmin();
  return result;
}

export async function createFrontendModuleAction(input: FrontendModuleInput) {
  await requireAdmin({ action: "admin.module.create" });
  const result = await createFrontendModule(input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function updateFrontendModuleEnabledAction(
  moduleKey: string,
  isEnabled: boolean,
) {
  await requireAdmin({ action: "admin.module.toggle", target: moduleKey });
  const result = await updateFrontendModuleEnabled(moduleKey, isEnabled);
  if (result.ok) refreshAdmin();
  return result;
}

export async function deleteFrontendModuleAction(moduleKey: string) {
  await requireAdmin({ action: "admin.module.delete", target: moduleKey });
  const result = await deleteFrontendModule(moduleKey);
  if (result.ok) refreshAdmin();
  return result;
}

export async function setPaymentPlansEnabledAction(enabled: boolean) {
  await requireAdmin({ action: "admin.billing.toggle" });
  const result = await setPaymentPlansEnabled(enabled);
  if (result.ok) refreshAdmin();
  return result;
}

export async function saveTrialSettingsAction(input: TrialSettings) {
  await requireAdmin({ action: "admin.billing.trial" });
  const result = await saveTrialSettings(input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function saveEarlyBirdSettingsAction(input: EarlyBirdSettings) {
  await requireAdmin({ action: "admin.billing.early_bird" });
  const result = await saveEarlyBirdSettings(input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function createPaymentPlanAction(input: PaymentPlanInput) {
  await requireAdmin({ action: "admin.billing.plan.create" });
  const result = await createPaymentPlan(input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function updatePaymentPlanAction(
  planId: string,
  input: PaymentPlanInput,
) {
  await requireAdmin({ action: "admin.billing.plan.update", target: planId });
  const result = await updatePaymentPlan(planId, input);
  if (result.ok) refreshAdmin();
  return result;
}

export async function deletePaymentPlanAction(planId: string) {
  await requireAdmin({ action: "admin.billing.plan.delete", target: planId });
  const result = await deletePaymentPlan(planId);
  if (result.ok) refreshAdmin();
  return result;
}
