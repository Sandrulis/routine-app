"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoadingState } from "@/app/components/loading-state";
import { SectionPage } from "@/app/components/section-page";
import { TemplateTreeEditor } from "@/app/components/template-tree-editor";
import { TemplateTaskStatusesModal } from "@/app/components/template-task-statuses-modal";
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

const AUTO_SAVE_DELAY_MS = 600;

function draftSnapshot(
  templateId: string,
  name: string,
  description: string,
  items: WorkTemplateItem[],
): string {
  return JSON.stringify({
    name: name.trim(),
    description: description.trim(),
    items: sanitizeTemplateItems(templateId, items).map((item) => ({
      id: item.id,
      parentId: item.parentId,
      kind: item.kind,
      title: item.title,
      description: item.description,
      sortOrder: item.sortOrder,
      assigneeIds: item.assigneeIds,
      checklists: item.checklists,
      taskStatuses: item.taskStatuses,
      hiddenStatusIds: item.hiddenStatusIds,
      statusOrder: item.statusOrder,
      statusGroupOverrides: item.statusGroupOverrides,
    })),
  });
}

export function TemplateDetailPage({ templateId }: { templateId: string }) {
  const { t } = useTranslations();
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
  const storedItems = allItems.filter((item) => item.templateId === templateId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<WorkTemplateItem[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const [statusesItemId, setStatusesItemId] = useState<string | null>(null);
  const statusesItem =
    items.find((item) => item.id === statusesItemId && item.kind === "task") ??
    null;

  const loadedTemplateIdRef = useRef<string | null>(null);
  const saveTemplateRef = useRef(saveTemplate);
  saveTemplateRef.current = saveTemplate;
  const latestDraftRef = useRef({
    name: "",
    description: "",
    items: [] as WorkTemplateItem[],
    templateId,
    savedSnapshot: "",
  });
  latestDraftRef.current = { name, description, items, templateId, savedSnapshot };

  const persistDraft = useCallback(
    (trimmedName: string, desc: string, draftItems: WorkTemplateItem[]) => {
      const persistedItems = sanitizeTemplateItems(templateId, draftItems);
      saveTemplate({
        templateId,
        name: trimmedName,
        description: desc,
        items: draftItems,
      });
      setItems(prepareTemplateEditorItems(templateId, persistedItems));
      setSavedSnapshot(
        draftSnapshot(templateId, trimmedName, desc, persistedItems),
      );
    },
    [saveTemplate, templateId],
  );

  useEffect(() => {
    if (!template) return;
    if (loadedTemplateIdRef.current === templateId) return;
    loadedTemplateIdRef.current = templateId;
    setName(template.name);
    setDescription(template.description);
    const persisted = sanitizeTemplateItems(templateId, storedItems);
    setItems(prepareTemplateEditorItems(templateId, storedItems));
    setSavedSnapshot(
      draftSnapshot(templateId, template.name, template.description, persisted),
    );
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

  useEffect(() => {
    if (!canManage || !template) return;
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const currentSnapshot = draftSnapshot(
      templateId,
      name,
      description,
      sanitizeTemplateItems(templateId, items),
    );
    if (currentSnapshot === savedSnapshot) return;

    const timeoutId = window.setTimeout(() => {
      persistDraft(trimmedName, description, items);
    }, AUTO_SAVE_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [
    canManage,
    description,
    items,
    name,
    persistDraft,
    savedSnapshot,
    template,
    templateId,
  ]);

  useEffect(() => {
    return () => {
      const draft = latestDraftRef.current;
      const trimmedName = draft.name.trim();
      if (!trimmedName) return;

      const persistedItems = sanitizeTemplateItems(draft.templateId, draft.items);
      const snap = draftSnapshot(
        draft.templateId,
        draft.name,
        draft.description,
        persistedItems,
      );
      if (snap === draft.savedSnapshot) return;

      saveTemplateRef.current({
        templateId: draft.templateId,
        name: trimmedName,
        description: draft.description,
        items: draft.items,
      });
    };
  }, []);

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
            onOpenStatuses={setStatusesItemId}
          />
        </div>
      </fieldset>

      <TemplateTaskStatusesModal
        item={statusesItem}
        open={statusesItemId !== null}
        onOpenChange={(open) => {
          if (!open) setStatusesItemId(null);
        }}
        onItemChange={(next) => {
          setItems((current) =>
            current.map((item) => (item.id === next.id ? next : item)),
          );
        }}
      />
    </SectionPage>
  );
}
