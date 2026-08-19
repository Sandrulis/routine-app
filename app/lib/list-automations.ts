export const AUTOMATION_TRIGGER_KINDS = ["folder_created"] as const;
export const AUTOMATION_ACTION_KINDS = ["apply_template"] as const;

export type AutomationTriggerKind = (typeof AUTOMATION_TRIGGER_KINDS)[number];
export type AutomationActionKind = (typeof AUTOMATION_ACTION_KINDS)[number];

export type ListAutomation = {
  id: string;
  listId: string;
  triggerKind: AutomationTriggerKind;
  actionKind: AutomationActionKind;
  templateId: string | null;
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

export function mapListAutomationRow(row: {
  id: string;
  list_id: string;
  trigger_kind: string;
  action_kind: string;
  template_id: string | null;
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
