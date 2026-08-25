import type { TeamActionPermissionKey, TeamNavPermissionKey } from "@/app/lib/team-permissions";

export const FRONTEND_MODULE_KEYS = {
  privateList: "module_private_list",
  fileUpload: "module_file_upload",
  sendFile: "module_send_file",
  googleDrive: "module_google_drive",
  gmailPlugin: "module_gmail_plugin",
  onedrive: "module_onedrive",
  checklist: "module_checklist",
  automations: "module_automations",
  templates: "module_templates",
  calendar: "module_calendar",
  calendarApple: "module_calendar_apple",
  calendarGoogle: "module_calendar_google",
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
  if (moduleKey === FRONTEND_MODULE_KEYS.sendFile) {
    return { key: "files.forward", fallback: "Pārsūtīt failu" };
  }
  if (moduleKey === FRONTEND_MODULE_KEYS.googleDrive) {
    return { key: "nav.google_drive", fallback: "Google Drive Integrācija" };
  }
  if (moduleKey === FRONTEND_MODULE_KEYS.gmailPlugin) {
    return { key: "nav.gmail_plugin", fallback: "Gmail spraudnis" };
  }
  if (moduleKey === FRONTEND_MODULE_KEYS.onedrive) {
    return { key: "nav.onedrive", fallback: "OneDrive Integrācija" };
  }
  if (moduleKey === FRONTEND_MODULE_KEYS.checklist) {
    return { key: "subtasks.checklist.title", fallback: "Check List" };
  }
  if (moduleKey === FRONTEND_MODULE_KEYS.calendar) {
    return { key: "calendar.integration.title", fallback: "Kalendāra integrācija" };
  }
  if (moduleKey === FRONTEND_MODULE_KEYS.calendarApple) {
    return { key: "calendar.provider.apple", fallback: "Apple Calendar" };
  }
  if (moduleKey === FRONTEND_MODULE_KEYS.calendarGoogle) {
    return { key: "calendar.provider.google", fallback: "Google Calendar" };
  }
  return null;
}

export function isCalendarIntegrationVisible(
  isEnabled: (moduleKey: string) => boolean,
): boolean {
  return (
    isEnabled(FRONTEND_MODULE_KEYS.calendar) &&
    (isEnabled(FRONTEND_MODULE_KEYS.calendarApple) ||
      isEnabled(FRONTEND_MODULE_KEYS.calendarGoogle))
  );
}
