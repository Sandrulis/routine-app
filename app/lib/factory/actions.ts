"use server";

import type { ActionResult } from "@/app/lib/actions/action-result";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import {
  createFactoryUser,
  deleteFactoryUser,
  listFactoryPresence,
  listFactoryUsers,
  type FactoryPresence,
  type FactoryUser,
} from "@/app/lib/factory/repository";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { isFrontendModuleEnabled } from "@/app/lib/frontend-modules/repository";

async function requireFactoryModule() {
  if (!(await isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.factory))) {
    return { ok: false as const, error: "errors.factory_module_disabled" };
  }
  return { ok: true as const };
}

export async function listFactoryUsersAction(
  teamId: string,
): Promise<ActionResult<FactoryUser[]>> {
  const modules = await requireFactoryModule();
  if (!modules.ok) return modules;
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  return listFactoryUsers(teamId.trim(), user.id);
}

export async function createFactoryUserAction(input: {
  teamId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<ActionResult<FactoryUser>> {
  const modules = await requireFactoryModule();
  if (!modules.ok) return modules;
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  return createFactoryUser(input.teamId.trim(), user.id, input);
}

export async function listFactoryPresenceAction(
  teamId: string,
): Promise<ActionResult<FactoryPresence[]>> {
  const modules = await requireFactoryModule();
  if (!modules.ok) return modules;
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  return listFactoryPresence(teamId.trim(), user.id);
}

export async function deleteFactoryUserAction(input: {
  teamId: string;
  factoryUserId: string;
}): Promise<ActionResult> {
  const modules = await requireFactoryModule();
  if (!modules.ok) return modules;
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  return deleteFactoryUser(
    input.teamId.trim(),
    user.id,
    input.factoryUserId.trim(),
  );
}
