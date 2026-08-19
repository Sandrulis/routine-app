import type { TeamActionPermissionKey, TeamNavPermissionKey } from "@/app/lib/team-permissions";

export const FRONTEND_MODULE_KEYS = {
  privateList: "module_private_list",
  fileUpload: "module_file_upload",
  checklist: "module_checklist",
  automations: "module_automations",
  templates: "module_templates",
} as const;

export type FrontendModuleKey =
  (typeof FRONTEND_MODULE_KEYS)[keyof typeof FRONTEND_MODULE_KEYS];

export const KNOWN_FRONTEND_MODULE_KEYS = Object.values(FRONTEND_MODULE_KEYS);

/** Nav permission keys gated by a frontend module. */
export const NAV_FRONTEND_MODULE_KEYS: Partial<
  Record<TeamNavPermissionKey, FrontendModuleKey>
> = {
  templates: FRONTEND_MODULE_KEYS.templates,
};

/** Action permission keys gated by a frontend module. */
export const ACTION_FRONTEND_MODULE_KEYS: Partial<
  Record<TeamActionPermissionKey, FrontendModuleKey>
> = {
  "lists.automations.manage": FRONTEND_MODULE_KEYS.automations,
  "files.upload": FRONTEND_MODULE_KEYS.fileUpload,
};

export function knownFrontendModuleLabel(
  moduleKey: string,
): { key: string; fallback: string } | null {
  if (moduleKey === FRONTEND_MODULE_KEYS.privateList) {
    return { key: "lists.private.label", fallback: "Privāts saraksts" };
  }
  if (moduleKey === FRONTEND_MODULE_KEYS.templates) {
    return { key: "nav.templates", fallback: "Šabloni" };
  }
  if (moduleKey === FRONTEND_MODULE_KEYS.automations) {
    return { key: "lists.automations.title", fallback: "Automatizācijas" };
  }
  if (moduleKey === FRONTEND_MODULE_KEYS.fileUpload) {
    return { key: "team.access.actions.files_upload", fallback: "Augšupielādēt failus" };
  }
  if (moduleKey === FRONTEND_MODULE_KEYS.checklist) {
    return { key: "subtasks.checklist.title", fallback: "Check List" };
  }
  return null;
}
