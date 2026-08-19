"use client";

import { useEffect, useMemo, useState } from "react";
import { LoadingState } from "@/app/components/loading-state";
import { SectionPage } from "@/app/components/section-page";
import { TemplateTreeEditor } from "@/app/components/template-tree-editor";
import { UnsavedChangesConfirmModal } from "@/app/components/unsaved-changes-confirm-modal";
import { useUnsavedChangesGuard } from "@/app/components/unsaved-changes-guard";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import {
  prepareTemplateEditorItems,
  sanitizeTemplateItems,
  type WorkTemplateItem,
} from "@/app/lib/templates";
import { useTemplates } from "@/app/lib/templates-store";
import { canManageTemplates, hasTeamNavPermission } from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";

function draftSnapshot(
  name: string,
  description: string,
  items: WorkTemplateItem[],
): string {
  return JSON.stringify({
    name: name.trim(),
    description: description.trim(),
    items: items.map((item) => ({
      id: item.id,
      parentId: item.parentId,
      kind: item.kind,
      title: item.title,
      description: item.description,
      sortOrder: item.sortOrder,
    })),
  });
}

export function TemplateDetailPage({ templateId }: { templateId: string }) {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const { templates, items: allItems, saveTemplate, isReady } = useTemplates();
  const { currentUser, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  const canViewTemplates = hasTeamNavPermission(
    currentUser,
    roles,
    isAdmin,
    "templates",
  );
  const canManage = canManageTemplates(currentUser, roles, isAdmin);
  const template = templates.find((item) => item.id === templateId) ?? null;
  const storedItems = useMemo(
    () => allItems.filter((item) => item.templateId === templateId),
    [allItems, templateId],
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<WorkTemplateItem[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [focusItemId, setFocusItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!template) return;
    setName(template.name);
    setDescription(template.description);
    const persisted = sanitizeTemplateItems(templateId, storedItems);
    setItems(prepareTemplateEditorItems(templateId, storedItems));
    setSavedSnapshot(draftSnapshot(template.name, template.description, persisted));
  }, [template, storedItems, templateId]);

  useEffect(() => {
    if (!focusItemId) return;
    const frameId = requestAnimationFrame(() => {
      const input = document.querySelector<HTMLInputElement>(
        `[data-template-item-id="${focusItemId}"]`,
      );
      if (!input) {
        setFocusItemId(null);
        return;
      }
      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);
      setFocusItemId(null);
    });
    return () => cancelAnimationFrame(frameId);
  }, [focusItemId, items]);

  const isDirty = useMemo(
    () =>
      draftSnapshot(name, description, sanitizeTemplateItems(templateId, items)) !==
      savedSnapshot,
    [description, items, name, savedSnapshot, templateId],
  );
  const { confirmOpen, stayOnPage, confirmLeave } = useUnsavedChangesGuard({
    isDirty,
  });

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const persistedItems = sanitizeTemplateItems(templateId, items);
    saveTemplate({
      templateId,
      name: trimmedName,
      description,
      items,
    });
    setItems(prepareTemplateEditorItems(templateId, persistedItems));
    setSavedSnapshot(draftSnapshot(trimmedName, description, persistedItems));
    showFeedback({
      type: "success",
      text: t("templates.saved", "Šablons saglabāts."),
    });
  }

  if (!isReady) {
    return (
      <SectionPage
        title={t("nav.templates", "Šabloni")}
        subtitle={t("templates.detail.loading", "Ielādē šablonu")}
      >
        <LoadingState />
      </SectionPage>
    );
  }

  if (!template) {
    return (
      <SectionPage
        title={t("nav.templates", "Šabloni")}
        subtitle={t("templates.detail.missing", "Šablons nav atrasts")}
      >
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
          {t("templates.detail.missing", "Šablons nav atrasts")}
        </div>
      </SectionPage>
    );
  }

  if (!canViewTemplates) {
    return (
      <SectionPage
        title={t("nav.templates", "Šabloni")}
        subtitle={t("templates.detail.missing", "Šablons nav atrasts")}
      >
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
          {t("team.access.denied", "Tev nav pieejas šai sadaļai.")}
        </div>
      </SectionPage>
    );
  }

  return (
    <SectionPage
      title={t("nav.templates", "Šabloni")}
      subtitle={t(
        "templates.detail.subtitle",
        "Definē mapes, uzdevumu sarakstus un apakšuzdevumus. Pēc tam šablonu var pievienot mapē.",
      )}
      actions={
        canManage ? (
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || !name.trim()}
          className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
        >
          {t("actions.save", "Saglabāt")}
        </button>
        ) : null
      }
    >
      <fieldset disabled={!canManage} className="space-y-4 disabled:opacity-80">
        <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-5">
          <label htmlFor="template-name" className="text-sm font-semibold text-zinc-700">
            {t("lists.fields.name", "Nosaukums")}
          </label>
          <input
            id="template-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder={t(
              "templates.fields.name_placeholder",
              "Piemēram, Jauns objekts",
            )}
          />
          <label
            htmlFor="template-description"
            className="mt-4 block text-sm font-medium text-zinc-500"
          >
            {t("common.description", "Apraksts")}
          </label>
          <textarea
            id="template-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            placeholder={t(
              "templates.fields.description_placeholder",
              "Īss šablona apraksts",
            )}
          />
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-5">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              {t("templates.items.title", "Struktūra")}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {t(
                "templates.items.help",
                "Velc, lai mainītu secību. Mapes, uzdevumus un apakšuzdevumus var pārvietot starp mapēm.",
              )}
            </p>
          </div>
          <TemplateTreeEditor
            templateId={templateId}
            items={items}
            onItemsChange={setItems}
            onFocusItemId={setFocusItemId}
          />
        </div>
      </fieldset>

      <UnsavedChangesConfirmModal
        open={confirmOpen}
        onStay={stayOnPage}
        onLeave={confirmLeave}
      />
    </SectionPage>
  );
}
