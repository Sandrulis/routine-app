"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { IconActionButton } from "@/app/components/icon-action-button";
import { LoadingState } from "@/app/components/loading-state";
import { NameFormModal } from "@/app/components/name-form-modal";
import { SectionPage } from "@/app/components/section-page";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { templateRootItems } from "@/app/lib/templates";
import { useTemplates } from "@/app/lib/templates-store";
import { useTeam } from "@/app/lib/team-store";

export function TemplatesPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const { currentTeam } = useTeam();
  const { templates, items, addTemplate, deleteTemplate, isReady } = useTemplates();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteTarget = templates.find((item) => item.id === deleteId) ?? null;

  return (
    <SectionPage
      title={t("nav.templates", "Šabloni")}
      subtitle={t(
        "templates.page.subtitle",
        "Iepriekš definēti uzdevumu un apakšuzdevumu saraksti, ko pēc tam pievieno mapē.",
      )}
      actions={
        currentTeam ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            <i className="fas fa-plus text-xs" aria-hidden="true" />
            {t("actions.add", "Pievienot")}
          </button>
        ) : null
      }
    >
      {!isReady ? (
        <LoadingState />
      ) : templates.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
          {currentTeam
            ? t("templates.empty", "Vēl nav šablonu.")
            : t("teams.required.empty_members", "Vispirms izveido komandu.")}
        </div>
      ) : (
        <div className="grid gap-3">
          {templates.map((template) => {
            const taskCount = templateRootItems(items, template.id).length;
            return (
              <div
                key={template.id}
                className="flex items-center gap-3 rounded-3xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => router.push(`/templates/${template.id}`)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                    <i className="fas fa-copy" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-zinc-900">
                      {template.name}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-zinc-500">
                      {template.description.trim() ||
            t("templates.items.count", "{count} uzdevumu saraksti", {
              count: taskCount,
            })}
                    </span>
                  </span>
                </button>
                <IconActionButton
                  label={t("actions.delete", "Dzēst")}
                  icon="fas fa-trash"
                  variant="delete"
                  onClick={(event) => {
                    event.stopPropagation();
                    setDeleteId(template.id);
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      <NameFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={t("templates.add.title", "Jauns šablons")}
        description={t(
          "templates.add.description",
          "Norādi nosaukumu. Pēc tam pievieno uzdevumu un apakšuzdevumu sarakstus.",
        )}
        nameLabel={t("lists.fields.name", "Nosaukums")}
        namePlaceholder={t(
          "templates.fields.name_placeholder",
          "Piemēram, Jauns objekts",
        )}
        descriptionLabel={t("common.description", "Apraksts")}
        descriptionPlaceholder={t(
          "templates.fields.description_placeholder",
          "Īss šablona apraksts",
        )}
        submitLabel={t("actions.add", "Pievienot")}
        onCreate={(input) => {
          const template = addTemplate(input);
          showFeedback({
            type: "success",
            text: t("templates.created", "Šablons pievienots."),
          });
          router.push(`/templates/${template.id}`);
        }}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title={t("templates.delete.title", "Dzēst šablonu?")}
        description={t(
          "templates.delete.description",
          "Šablons “{name}” tiks dzēsts. Esošie uzdevumi paliek.",
          { name: deleteTarget?.name ?? "" },
        )}
        confirmLabel={t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteTemplate(deleteTarget.id);
          showFeedback({
            type: "success",
            text: t("templates.deleted", "Šablons dzēsts."),
          });
          setDeleteId(null);
        }}
      />
    </SectionPage>
  );
}
