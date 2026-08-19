export const AUTOMATION_TRIGGER_KINDS = [
  "folder_created",
  "status_changed",
  "checklist_completed",
  "all_subtasks_completed",
] as const;
export const AUTOMATION_ACTION_KINDS = [
  "apply_template",
  "assign_user",
  "set_status",
] as const;

export type AutomationTriggerKind = (typeof AUTOMATION_TRIGGER_KINDS)[number];
export type AutomationActionKind = (typeof AUTOMATION_ACTION_KINDS)[number];

export type AutomationConfig = {
  triggerStatusId?: string;
  assigneeId?: string;
  targetStatusId?: string;
};

export type ListAutomation = {
  id: string;
  listId: string;
  triggerKind: AutomationTriggerKind;
  actionKind: AutomationActionKind;
  templateId: string | null;
  config: AutomationConfig;
  enabled: boolean;
  sortOrder: number;
};

export function createListAutomationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `lauto-${crypto.randomUUID()}`;
  }
  return `lauto-${Date.now()}`;
}

export function isAutomationTriggerKind(value: string): value is AutomationTriggerKind {
  return (AUTOMATION_TRIGGER_KINDS as readonly string[]).includes(value);
}

export function isAutomationActionKind(value: string): value is AutomationActionKind {
  return (AUTOMATION_ACTION_KINDS as readonly string[]).includes(value);
}

function parseConfig(value: unknown): AutomationConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const config: AutomationConfig = {};
  if (typeof raw.triggerStatusId === "string" && raw.triggerStatusId) {
    config.triggerStatusId = raw.triggerStatusId;
  }
  if (typeof raw.trigger_status_id === "string" && raw.trigger_status_id) {
    config.triggerStatusId = raw.trigger_status_id;
  }
  if (typeof raw.assigneeId === "string" && raw.assigneeId) {
    config.assigneeId = raw.assigneeId;
  }
  if (typeof raw.assignee_id === "string" && raw.assignee_id) {
    config.assigneeId = raw.assignee_id;
  }
  if (typeof raw.targetStatusId === "string" && raw.targetStatusId) {
    config.targetStatusId = raw.targetStatusId;
  }
  if (typeof raw.target_status_id === "string" && raw.target_status_id) {
    config.targetStatusId = raw.target_status_id;
  }
  return config;
}

export function serializeConfig(config: AutomationConfig): Record<string, string> {
  const row: Record<string, string> = {};
  if (config.triggerStatusId) row.trigger_status_id = config.triggerStatusId;
  if (config.assigneeId) row.assignee_id = config.assigneeId;
  if (config.targetStatusId) row.target_status_id = config.targetStatusId;
  return row;
}

export function mapListAutomationRow(row: {
  id: string;
  list_id: string;
  trigger_kind: string;
  action_kind: string;
  template_id: string | null;
  config?: unknown;
  enabled: boolean;
  sort_order: number;
}): ListAutomation {
  return {
    id: row.id,
    listId: row.list_id,
    triggerKind: isAutomationTriggerKind(row.trigger_kind)
      ? row.trigger_kind
      : "folder_created",
    actionKind: isAutomationActionKind(row.action_kind)
      ? row.action_kind
      : "apply_template",
    templateId: row.template_id,
    config: parseConfig(row.config),
    enabled: row.enabled !== false,
    sortOrder: row.sort_order ?? 0,
  };
}

export function listAutomationsForList(
  automations: ListAutomation[],
  listId: string,
): ListAutomation[] {
  return automations
    .filter((automation) => automation.listId === listId)
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function activeFolderCreatedTemplateAutomations(
  automations: ListAutomation[],
  listId: string,
): ListAutomation[] {
  return listAutomationsForList(automations, listId).filter(
    (automation) =>
      automation.enabled &&
      automation.triggerKind === "folder_created" &&
      automation.actionKind === "apply_template" &&
      Boolean(automation.templateId),
  );
}

export function activeStatusChangedAssignRules(
  automations: ListAutomation[],
  listId: string,
  newStatusId: string,
): ListAutomation[] {
  return listAutomationsForList(automations, listId).filter(
    (automation) =>
      automation.enabled &&
      automation.triggerKind === "status_changed" &&
      automation.actionKind === "assign_user" &&
      automation.config.triggerStatusId === newStatusId &&
      Boolean(automation.config.assigneeId),
  );
}

export function activeChecklistCompletedRules(
  automations: ListAutomation[],
  listId: string,
): ListAutomation[] {
  return listAutomationsForList(automations, listId).filter(
    (automation) =>
      automation.enabled &&
      automation.triggerKind === "checklist_completed" &&
      automation.actionKind === "set_status" &&
      Boolean(automation.config.targetStatusId),
  );
}

export function activeAllSubtasksCompletedRules(
  automations: ListAutomation[],
  listId: string,
): ListAutomation[] {
  return listAutomationsForList(automations, listId).filter(
    (automation) =>
      automation.enabled &&
      automation.triggerKind === "all_subtasks_completed" &&
      automation.actionKind === "set_status" &&
      Boolean(automation.config.targetStatusId),
  );
}
