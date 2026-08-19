"use client";

import { useMemo, useState } from "react";
import { AppModal } from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { IconActionButton } from "@/app/components/icon-action-button";
import { ToggleSwitch } from "@/app/components/toggle-switch";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { listAutomationsForList } from "@/app/lib/list-automations";
import { useLists } from "@/app/lib/lists-store";
import type { WorkList } from "@/app/lib/lists";
import { useTemplates } from "@/app/lib/templates-store";

const selectClassName =
  "min-h-9 w-full cursor-pointer rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

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
  const { templates } = useTemplates();
  const liveList = (list && lists.find((item) => item.id === list.id)) || list;
  const automations = useMemo(
    () => (liveList ? listAutomationsForList(listAutomations, liveList.id) : []),
    [liveList, listAutomations],
  );
  const folderRule = automations.find(
    (automation) =>
      automation.triggerKind === "folder_created" &&
      automation.actionKind === "apply_template",
  );
  const [draftTemplateId, setDraftTemplateId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleAddFolderRule() {
    if (!liveList) return;
    const templateId = draftTemplateId.trim();
    if (!templateId) {
      showFeedback({
        type: "error",
        text: t("lists.automations.template_required", "Izvēlies šablonu."),
      });
      return;
    }
    const created = addListAutomation(liveList.id, {
      triggerKind: "folder_created",
      actionKind: "apply_template",
      templateId,
      enabled: true,
    });
    if (!created) {
      showFeedback({
        type: "error",
        text: t(
          "lists.automations.already_exists",
          "Šī automatizācija jau ir pievienota.",
        ),
      });
      return;
    }
    setDraftTemplateId("");
    showFeedback({
      type: "success",
      text: t("lists.automations.saved", "Automatizācija saglabāta."),
    });
  }

  return (
    <>
      <AppModal
        open={open}
        onOpenChange={onOpenChange}
        title={t("lists.automations.title", "Automatizācijas")}
        description={
          liveList
            ? t(
                "lists.automations.description",
                "Konfigurē automātiskās darbības sarakstam „{name}”.",
                { name: liveList.name },
              )
            : t(
                "lists.automations.description_generic",
                "Konfigurē automātiskās darbības šim sarakstam.",
              )
        }
      >
        <div className="space-y-6">
          <section className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-zinc-900">
                {t(
                  "lists.automations.folder_created.title",
                  "Mapes izveide",
                )}
              </h4>
              <p className="mt-1 text-sm text-zinc-500">
                {t(
                  "lists.automations.folder_created.description",
                  "Kad tiek izveidota jauna mape, mapē automātiski izveido izvēlētā šablona mapes, uzdevumus un apakšuzdevumus.",
                )}
              </p>
            </div>

            {folderRule ? (
              <div className="space-y-3 rounded-xl border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-medium text-zinc-900">
                      {t(
                        "lists.automations.folder_created.apply_template",
                        "Pielietot šablonu",
                      )}
                    </p>
                    <label className="block pt-2">
                      <span className="mb-1 block text-xs font-medium text-zinc-500">
                        {t("lists.automations.template_label", "Šablons")}
                      </span>
                      <select
                        value={folderRule.templateId ?? ""}
                        aria-label={t("lists.automations.template_label", "Šablons")}
                        className={selectClassName}
                        onChange={(event) => {
                          updateListAutomation(folderRule.id, {
                            templateId: event.target.value,
                          });
                        }}
                      >
                        <option value="">
                          {t("lists.automations.template_placeholder", "Izvēlies šablonu")}
                        </option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <IconActionButton
                    icon="fas fa-trash"
                    label={t("actions.delete", "Dzēst")}
                    variant="delete"
                    onClick={() => setConfirmDelete(true)}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-3">
                  <span className="text-sm text-zinc-700">
                    {t("lists.automations.enabled", "Aktīva")}
                  </span>
                  <ToggleSwitch
                    checked={folderRule.enabled}
                    label={t("lists.automations.enabled", "Aktīva")}
                    onChange={(enabled) => {
                      updateListAutomation(folderRule.id, { enabled });
                    }}
                  />
                </div>
              </div>
            ) : templates.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-3 text-sm text-zinc-500">
                {t(
                  "lists.automations.no_templates",
                  "Vispirms izveido komandas šablonu, lai to var piesaistīt automatizācijai.",
                )}
              </p>
            ) : (
              <div className="space-y-3 rounded-xl border border-zinc-200 p-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-500">
                    {t("lists.automations.template_label", "Šablons")}
                  </span>
                  <select
                    value={draftTemplateId}
                    aria-label={t("lists.automations.template_label", "Šablons")}
                    className={selectClassName}
                    onChange={(event) => setDraftTemplateId(event.target.value)}
                  >
                    <option value="">
                      {t("lists.automations.template_placeholder", "Izvēlies šablonu")}
                    </option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:bg-zinc-200 disabled:text-zinc-400"
                  onClick={handleAddFolderRule}
                >
                  {t("lists.automations.add", "Pievienot automatizāciju")}
                </button>
              </div>
            )}
          </section>
        </div>
      </AppModal>

      <ConfirmModal
        open={confirmDelete && folderRule !== undefined}
        onOpenChange={setConfirmDelete}
        title={t("lists.automations.delete.title", "Dzēst automatizāciju?")}
        description={t(
          "lists.automations.delete.description",
          "Mapes izveides automatizācija vairs netiks pielietota.",
        )}
        confirmLabel={t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        onConfirm={() => {
          if (!folderRule) return;
          deleteListAutomation(folderRule.id);
          setConfirmDelete(false);
          showFeedback({
            type: "success",
            text: t("lists.automations.deleted", "Automatizācija dzēsta."),
          });
        }}
      />
    </>
  );
}
