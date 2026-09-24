"use server";

import type { ActionResult } from "@/app/lib/actions/action-result";
import {
  listFactorySharedJobs,
  signInFactoryPortal,
  updateFactorySharedChecklists,
  type FactoryPortalUser,
  type FactorySharedJob,
} from "@/app/lib/factory/portal";
import type { TaskChecklist } from "@/app/lib/task-checklists";
import { touchFactoryUserOnline } from "@/app/lib/factory/repository";
import { clearFactorySession, readFactorySession } from "@/app/lib/factory/session";

export async function signInFactoryPortalAction(input: {
  email: string;
  password: string;
}): Promise<ActionResult<FactoryPortalUser>> {
  return signInFactoryPortal(input.email, input.password);
}

export async function touchFactoryPortalOnlineAction(): Promise<ActionResult> {
  const session = await readFactorySession();
  if (!session) return { ok: false, error: "errors.auth_required" };
  await touchFactoryUserOnline(session.id);
  return { ok: true };
}

export async function listFactorySharedJobsAction(): Promise<ActionResult<FactorySharedJob[]>> {
  const jobs = await listFactorySharedJobs();
  return { ok: true, data: jobs };
}

export async function updateFactorySharedChecklistsAction(
  taskId: string,
  checklists: TaskChecklist[],
): Promise<ActionResult<TaskChecklist[]>> {
  return updateFactorySharedChecklists(taskId, checklists);
}

export async function signOutFactoryPortalAction(): Promise<ActionResult> {
  await clearFactorySession();
  return { ok: true };
}
