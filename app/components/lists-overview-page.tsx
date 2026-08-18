"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ListSummary } from "@/app/components/list-summary";
import { ListFormModal } from "@/app/components/list-form-modal";
import { SectionPage } from "@/app/components/section-page";
import { SubtaskDetailModal } from "@/app/components/subtask-detail-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { getListTasks, isWorkSubtask, type WorkTask } from "@/app/lib/lists";
import { useLists } from "@/app/lib/lists-store";
import { useTeam } from "@/app/lib/team-store";

export function ListsOverviewPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const { lists, tasks, addList, isReady } = useLists();
  const { currentTeam } = useTeam();
  const [createListOpen, setCreateListOpen] = useState(false);
  const [addTarget, setAddTarget] = useState<WorkTask | null>(null);
  const [openedSubtaskId, setOpenedSubtaskId] = useState<string | null>(null);

  if (!isReady) {
    return (
      <SectionPage
        title={t("nav.lists", "Saraksts")}
        subtitle={t(
          "lists.overview.subtitle",
          "Visu uzdevumu un apakšuzdevumu kopsavilkums.",
        )}
      >
        <div className="h-32 rounded-3xl border border-zinc-200 bg-white" />
      </SectionPage>
    );
  }

  const hasTasks = lists.some((list) => getListTasks(tasks, list.id).length > 0);

  return (
    <SectionPage
      title={t("nav.lists", "Saraksts")}
      subtitle={t(
        "lists.overview.subtitle",
        "Visu uzdevumu un apakšuzdevumu kopsavilkums.",
      )}
      actions={
        currentTeam ? (
          <button
            type="button"
            onClick={() => setCreateListOpen(true)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            <i className="fas fa-plus text-xs" aria-hidden="true" />
            {t("actions.add", "Pievienot")}
          </button>
        ) : null
      }
    >
      {lists.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
          {currentTeam
            ? t("lists.empty", "Vēl nav sarakstu.")
            : t("teams.required.empty_members", "Vispirms izveido komandu.")}
        </div>
      ) : hasTasks ? (
        <div className="space-y-3">
          {lists.map((list) => {
            const roots = getListTasks(tasks, list.id);
            if (roots.length === 0) return null;
            return (
              <ListSummary
                key={list.id}
                listId={list.id}
                listName={list.name}
                tasks={roots}
                onOpenTask={(task) => {
                  if (isWorkSubtask(task)) {
                    setOpenedSubtaskId(task.id);
                    return;
                  }
                  router.push(`/lists/${task.listId}/tasks/${task.id}`);
                }}
                onAddSubtask={setAddTarget}
              />
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
          {t("lists.overview.empty", "Vēl nav uzdevumu.")}
        </div>
      )}

      <ListFormModal
        open={createListOpen}
        onOpenChange={setCreateListOpen}
        title={t("lists.add.title", "Jauns saraksts")}
        description={t(
          "lists.add.description",
          "Saraksts grupē projektus vai klientus, katram ar saviem uzdevumiem un iestatījumiem.",
        )}
        namePlaceholder={t(
          "lists.fields.name_placeholder",
          "Piemēram, Projekti, Klienti",
        )}
        descriptionPlaceholder={t(
          "lists.fields.description_placeholder",
          "Īss saraksta apraksts",
        )}
        submitLabel={t("actions.add", "Pievienot")}
        onCreate={(input) => {
          const list = addList(input);
          showFeedback({
            type: "success",
            text: t("lists.created", "Saraksts pievienots."),
          });
          router.push(`/lists/${list.id}`);
        }}
      />

      <SubtaskDetailModal
        taskId={openedSubtaskId}
        createFor={
          addTarget
            ? { listId: addTarget.listId, parentId: addTarget.id }
            : null
        }
        open={openedSubtaskId !== null || addTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setOpenedSubtaskId(null);
            setAddTarget(null);
          }
        }}
      />
    </SectionPage>
  );
}
