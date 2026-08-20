"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppModal } from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { IconActionButton } from "@/app/components/icon-action-button";
import { ToggleSwitch } from "@/app/components/toggle-switch";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { listAutomationsForList, type ListAutomation } from "@/app/lib/list-automations";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { useFrontendModules } from "@/app/lib/frontend-modules/context";
import { useLists } from "@/app/lib/lists-store";
import { useTeam } from "@/app/lib/team-store";
import { useTaskStatuses } from "@/app/lib/task-statuses";
import type { WorkList } from "@/app/lib/lists";
import { useTemplates } from "@/app/lib/templates-store";

export function ListAutomationsModal({
  list,
  open,
  onOpenChange,
}: {
  list: WorkList | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const { lists, listAutomations, addListAutomation, updateListAutomation, deleteListAutomation } =
    useLists();
  const { templates, ensureLoaded } = useTemplates();
  const { members } = useTeam();
  const { isEnabled: isModuleEnabled } = useFrontendModules();
  const templatesEnabled = isModuleEnabled(FRONTEND_MODULE_KEYS.templates);
  useEffect(() => {
    if (open) ensureLoaded();
  }, [ensureLoaded, open]);
  const liveList = (list && lists.find((item) => item.id === list.id)) || list;
  const { statuses: statusesForList, labelFor, colorFor } = useTaskStatuses(liveList?.id);
  const automations = useMemo(
    () => (liveList ? listAutomationsForList(listAutomations, liveList.id) : []),
    [liveList, listAutomations],
  );

  const folderRules = automations.filter(
    (a) => a.triggerKind === "folder_created" && a.actionKind === "apply_template",
  );
  const statusAssignRules = automations.filter(
    (a) => a.triggerKind === "status_changed" && a.actionKind === "assign_user",
  );
  const checklistRules = automations.filter(
    (a) => a.triggerKind === "checklist_completed" && a.actionKind === "set_status",
  );
  const subtasksRules = automations.filter(
    (a) => a.triggerKind === "all_subtasks_completed" && a.actionKind === "set_status",
  );

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleAddFolderRule() {
    if (!liveList || !templatesEnabled) return;
    addListAutomation(liveList.id, {
      triggerKind: "folder_created",
      actionKind: "apply_template",
      templateId: templates[0]?.id ?? "",
      enabled: true,
    });
    showFeedback({ type: "success", text: t("lists.automations.saved", "Automatizācija saglabāta.") });
  }

  function handleAddStatusAssign() {
    if (!liveList) return;
    addListAutomation(liveList.id, {
      triggerKind: "status_changed",
      actionKind: "assign_user",
      config: { triggerStatusId: statusesForList[0]?.id ?? "", assigneeId: members[0]?.id ?? "" },
      enabled: true,
    });
    showFeedback({ type: "success", text: t("lists.automations.saved", "Automatizācija saglabāta.") });
  }

  function handleAddChecklistRule() {
    if (!liveList) return;
    addListAutomation(liveList.id, {
      triggerKind: "checklist_completed",
      actionKind: "set_status",
      config: { targetStatusId: statusesForList[0]?.id ?? "" },
      enabled: true,
    });
    showFeedback({ type: "success", text: t("lists.automations.saved", "Automatizācija saglabāta.") });
  }

  function handleAddSubtasksRule() {
    if (!liveList) return;
    addListAutomation(liveList.id, {
      triggerKind: "all_subtasks_completed",
      actionKind: "set_status",
      config: { targetStatusId: statusesForList[0]?.id ?? "" },
      enabled: true,
    });
    showFeedback({ type: "success", text: t("lists.automations.saved", "Automatizācija saglabāta.") });
  }

  function handleDelete() {
    if (!confirmDelete) return;
    deleteListAutomation(confirmDelete);
    setConfirmDelete(null);
    showFeedback({ type: "success", text: t("lists.automations.deleted", "Automatizācija dzēsta.") });
  }

  const statusOptions = statusesForList.map((s) => ({
    value: s.id,
    label: labelFor(s.id),
    color: colorFor(s.id),
  }));
  const memberOptions = members.map((m) => ({
    value: m.id,
    label: m.name || m.email,
  }));

  return (
    <>
      <AppModal
        open={open}
        onOpenChange={onOpenChange}
        panelMaxWidthClassName="max-w-3xl"
        title={t("lists.automations.title", "Automatizācijas")}
        description={
          liveList
            ? t("lists.automations.description", "Konfigurē darbības sarakstam — {name}.", { name: liveList.name })
            : t("lists.automations.description_generic", "Konfigurē automātiskās darbības šim sarakstam.")
        }
      >
        <div className="space-y-5">
          {templatesEnabled ? (
          <AutomationSection
            icon="fas fa-folder-plus"
            iconColor="text-amber-500"
            title={t("lists.automations.folder_created.title", "Mapes izveide → šablons")}
            description={t("lists.automations.folder_created.description", "Kad tiek izveidota jauna mape, automātiski izveido šablona saturu.")}
          >
            {folderRules.map((rule) => (
              <RuleCard key={rule.id} rule={rule} onDelete={setConfirmDelete} onToggle={(enabled) => updateListAutomation(rule.id, { enabled })}>
                <StatusSelect
                  label={t("lists.automations.template_label", "Šablons")}
                  value={rule.templateId ?? ""}
                  onChange={(value) => updateListAutomation(rule.id, { templateId: value })}
                  options={templates.map((tpl) => ({ value: tpl.id, label: tpl.name }))}
                  placeholder={t("lists.automations.template_placeholder", "Izvēlies šablonu")}
                />
              </RuleCard>
            ))}
            {templates.length === 0 ? (
              <EmptyHint text={t("lists.automations.no_templates", "Vispirms izveido komandas šablonu.")} />
            ) : (
              <AddButton label={t("lists.automations.add_rule", "Pievienot noteikumu")} onClick={handleAddFolderRule} />
            )}
          </AutomationSection>
          ) : null}

          {/* 2. Status changed → assign user */}
          <AutomationSection
            icon="fas fa-user-plus"
            iconColor="text-blue-500"
            title={t("lists.automations.status_assign.title", "Statusa maiņa → piešķirt personu")}
            description={t("lists.automations.status_assign.description", "Kad uzdevumam mainās statuss uz izvēlēto, automātiski pievieno personu.")}
          >
            {statusAssignRules.map((rule) => (
              <RuleCard key={rule.id} rule={rule} onDelete={setConfirmDelete} onToggle={(enabled) => updateListAutomation(rule.id, { enabled })}>
                <div className="grid grid-cols-2 gap-3">
                  <StatusSelect
                    label={t("lists.automations.trigger_status", "Kad statuss =")}
                    value={rule.config.triggerStatusId ?? ""}
                    onChange={(value) => updateListAutomation(rule.id, { config: { ...rule.config, triggerStatusId: value } })}
                    options={statusOptions}
                    placeholder={t("lists.automations.select_status", "Izvēlies statusu")}
                  />
                  <StatusSelect
                    label={t("lists.automations.assignee", "Piešķirt personu")}
                    value={rule.config.assigneeId ?? ""}
                    onChange={(value) => updateListAutomation(rule.id, { config: { ...rule.config, assigneeId: value } })}
                    options={memberOptions}
                    placeholder={t("lists.automations.select_person", "Izvēlies personu")}
                  />
                </div>
              </RuleCard>
            ))}
            {statusesForList.length === 0 || members.length === 0 ? (
              <EmptyHint text={t("lists.automations.needs_statuses_and_members", "Sarakstam jābūt statusiem un komandas biedriem.")} />
            ) : (
              <AddButton label={t("lists.automations.add_rule", "Pievienot noteikumu")} onClick={handleAddStatusAssign} />
            )}
          </AutomationSection>

          {/* 3. Checklist completed → set status */}
          <AutomationSection
            icon="fas fa-check-double"
            iconColor="text-green-500"
            title={t("lists.automations.checklist_status.title", "Checklist pabeigts → statusa maiņa")}
            description={t("lists.automations.checklist_status.description", "Kad visi checklist punkti ir atzīmēti, automātiski maina statusu.")}
          >
            {checklistRules.map((rule) => (
              <RuleCard key={rule.id} rule={rule} onDelete={setConfirmDelete} onToggle={(enabled) => updateListAutomation(rule.id, { enabled })}>
                <StatusSelect
                  label={t("lists.automations.target_status", "Iestatīt statusu")}
                  value={rule.config.targetStatusId ?? ""}
                  onChange={(value) => updateListAutomation(rule.id, { config: { ...rule.config, targetStatusId: value } })}
                  options={statusOptions}
                  placeholder={t("lists.automations.select_status", "Izvēlies statusu")}
                />
              </RuleCard>
            ))}
            {statusesForList.length === 0 ? (
              <EmptyHint text={t("lists.automations.needs_statuses", "Sarakstam jābūt vismaz vienam statusam.")} />
            ) : (
              <AddButton label={t("lists.automations.add_rule", "Pievienot noteikumu")} onClick={handleAddChecklistRule} />
            )}
          </AutomationSection>

          {/* 4. All subtasks completed → set parent status */}
          <AutomationSection
            icon="fas fa-tasks"
            iconColor="text-purple-500"
            title={t("lists.automations.subtasks_status.title", "Visi apakšuzdevumi pabeigti → vecāka statuss")}
            description={t("lists.automations.subtasks_status.description", "Kad visi apakšuzdevumi ir slēgti, automātiski maina vecāka uzdevuma statusu.")}
          >
            {subtasksRules.map((rule) => (
              <RuleCard key={rule.id} rule={rule} onDelete={setConfirmDelete} onToggle={(enabled) => updateListAutomation(rule.id, { enabled })}>
                <StatusSelect
                  label={t("lists.automations.target_status", "Iestatīt statusu")}
                  value={rule.config.targetStatusId ?? ""}
                  onChange={(value) => updateListAutomation(rule.id, { config: { ...rule.config, targetStatusId: value } })}
                  options={statusOptions}
                  placeholder={t("lists.automations.select_status", "Izvēlies statusu")}
                />
              </RuleCard>
            ))}
            {statusesForList.length === 0 ? (
              <EmptyHint text={t("lists.automations.needs_statuses", "Sarakstam jābūt vismaz vienam statusam.")} />
            ) : (
              <AddButton label={t("lists.automations.add_rule", "Pievienot noteikumu")} onClick={handleAddSubtasksRule} />
            )}
          </AutomationSection>
        </div>
      </AppModal>

      <ConfirmModal
        open={confirmDelete !== null}
        onOpenChange={() => setConfirmDelete(null)}
        title={t("lists.automations.delete.title", "Dzēst automatizāciju?")}
        description={t("lists.automations.delete.description", "Automatizācija vairs netiks pielietota.")}
        confirmLabel={t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        onConfirm={handleDelete}
      />
    </>
  );
}

// --- UI building blocks ---

function AutomationSection({
  icon,
  iconColor,
  title,
  description,
  children,
}: {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-zinc-100 ${iconColor}`}>
          <i className={`${icon} text-sm`} />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-zinc-900">{title}</h4>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{description}</p>
        </div>
      </div>
      <div className="space-y-2 pl-11">{children}</div>
    </section>
  );
}

function RuleCard({
  rule,
  onDelete,
  onToggle,
  children,
}: {
  rule: ListAutomation;
  onDelete: (id: string) => void;
  onToggle: (enabled: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="space-y-3">
        {children}
        <div className="flex items-center justify-between border-t border-zinc-100 pt-2">
          <ToggleSwitch
            checked={rule.enabled}
            label=""
            onChange={onToggle}
          />
          <IconActionButton
            icon="fas fa-trash"
            label="Dzēst"
            variant="delete"
            onClick={() => onDelete(rule.id)}
          />
        </div>
      </div>
    </div>
  );
}


function StatusSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; color?: string | null }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close, true);
    return () => document.removeEventListener("mousedown", close, true);
  }, [open]);

  return (
    <div className="relative block" ref={ref}>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      <button
        type="button"
        className="flex min-h-9 w-full items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 text-left text-sm text-zinc-900 outline-none transition hover:border-zinc-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        onClick={() => setOpen(!open)}
      >
        {selected?.color && (
          <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: selected.color }} />
        )}
        <span className="truncate">{selected?.label || placeholder}</span>
        <i className="fas fa-chevron-down ml-auto text-[10px] text-zinc-400" />
      </button>
      {open && (
        <div
          data-app-modal-ignore-backdrop=""
          className="absolute left-0 top-full z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition hover:bg-zinc-50 ${
                opt.value === value ? "bg-blue-50 font-medium text-blue-700" : "text-zinc-800"
              }`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.color && (
                <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: opt.color }} />
              )}
              <span className="truncate">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 text-xs font-medium text-zinc-500 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
      onClick={onClick}
    >
      <i className="fas fa-plus text-[10px]" />
      {label}
    </button>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-2 text-xs text-zinc-400">
      {text}
    </p>
  );
}
