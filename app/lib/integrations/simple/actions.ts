"use server";

import { revalidatePath } from "next/cache";
import {
  isSimpleSiteIntegrationKey,
  type SimpleSiteIntegrationKey,
} from "@/app/lib/integrations/keys";
import {
  fetchSimpleIntegrationStatus,
  resetSimpleIntegration,
  saveSimpleIntegrationCredentials,
  setSimpleIntegrationEnabled,
} from "@/app/lib/integrations/simple/repository";
import type {
  SimpleIntegrationCredentialsInput,
  SimpleIntegrationStatus,
} from "@/app/lib/integrations/types";
import { requireAdmin } from "@/app/lib/users/require-admin";
import type { ActionResult } from "@/app/lib/actions/action-result";

function refreshIntegrations() {
  revalidatePath("/admin/integrations");
  revalidatePath("/admin/settings");
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

function parseKey(key: string): SimpleSiteIntegrationKey | null {
  return isSimpleSiteIntegrationKey(key) ? key : null;
}

export async function getSimpleIntegrationStatusAction(
  key: string,
): Promise<ActionResult<SimpleIntegrationStatus>> {
  await requireAdmin();
  const parsed = parseKey(key);
  if (!parsed) {
    return { ok: false, error: "errors.integrations_save_failed" };
  }
  const data = await fetchSimpleIntegrationStatus(parsed);
  return { ok: true, data };
}

export async function saveSimpleIntegrationCredentialsAction(
  key: string,
  input: SimpleIntegrationCredentialsInput,
): Promise<ActionResult> {
  await requireAdmin({ action: "integrations.simple.save", target: key });
  const parsed = parseKey(key);
  if (!parsed) {
    return { ok: false, error: "errors.integrations_save_failed" };
  }
  const result = await saveSimpleIntegrationCredentials(parsed, input);
  if (result.ok) refreshIntegrations();
  return result;
}

export async function setSimpleIntegrationEnabledAction(
  key: string,
  enabled: boolean,
): Promise<ActionResult> {
  await requireAdmin({ action: "integrations.simple.toggle", target: key });
  const parsed = parseKey(key);
  if (!parsed) {
    return { ok: false, error: "errors.integrations_save_failed" };
  }
  const result = await setSimpleIntegrationEnabled(parsed, enabled);
  if (result.ok) refreshIntegrations();
  return result;
}

export async function resetSimpleIntegrationAction(
  key: string,
): Promise<ActionResult> {
  await requireAdmin({ action: "integrations.simple.reset", target: key });
  const parsed = parseKey(key);
  if (!parsed) {
    return { ok: false, error: "errors.integrations_reset_failed" };
  }
  const result = await resetSimpleIntegration(parsed);
  if (result.ok) refreshIntegrations();
  return result;
}
