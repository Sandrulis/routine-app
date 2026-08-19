"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { CreateItemMenu, type CreateMenuAnchor } from "@/app/components/create-item-menu";
import { NameFormModal } from "@/app/components/name-form-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import {
  addStoredListFile,
  childListFiles,
  filePageHref,
  nextItemSortOrder,
  type ListFile,
} from "@/app/lib/list-files";
import { useLists } from "@/app/lib/lists-store";
import { activeFolderCreatedTemplateAutomations } from "@/app/lib/list-automations";
import { useTemplates } from "@/app/lib/templates-store";
import { useListFiles } from "@/app/lib/use-list-files";
import { useFileTypes } from "@/app/lib/file-types-context";
import {
  canManageTemplates,
  hasTeamActionPermission,
  hasTeamNavPermission,
} from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";

export type ParentCreateContext = {
  listId: string;
  parentId: string | null;
  variant: "list" | "folder";
  anchor: CreateMenuAnchor;
};

export function ParentCreateFlow({
  context,
  onClose,
  onCreated,
  onFileCreated,
}: {
  context: ParentCreateContext | null;
  onClose: () => void;
  onCreated?: (taskId: string) => void;
  onFileCreated?: (file: ListFile) => void;
}) {
  const { t } = useTranslations();
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const { addTask, applyTemplate, listTasks, childTasks, listAutomations } = useLists();
  const { templates, templateItems, isReady: templatesReady } = useTemplates();
  const { files } = useListFiles();
  const { currentUser, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  const canApplyTemplate =
    hasTeamNavPermission(currentUser, roles, isAdmin, "templates") &&
    canManageTemplates(currentUser, roles, isAdmin);
  const canUploadFiles = hasTeamActionPermission(
    currentUser,
    roles,
    isAdmin,
    "files.upload",
  );
  const { accept, filterAllowedFiles, extensionsLabel } = useFileTypes();
  const [step, setStep] = useState<"choice" | "folder" | "task" | "template">(
    "choice",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contextRef = useRef(context);
  contextRef.current = context;

  useEffect(() => {
    if (context) setStep("choice");
  }, [context]);

  const isFolder = context?.variant === "folder";

  function handleSelect(id: string) {
    if (!context) return;

    if (id === "file") {
      fileInputRef.current?.click();
      return;
    }

    if (id === "template") {
      if (!templatesReady) return;
      if (templates.length === 0) {
        showFeedback({
          type: "info",
          text: t(
            "templates.apply.empty",
            "Vispirms izveido šablonu komandas izvēlnē.",
          ),
        });
        onClose();
        router.push("/templates");
        return;
      }
      setStep("template");
      return;
    }

    setStep(id === "folder" ? "folder" : "task");
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const current = contextRef.current;
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!current || selected.length === 0) return;

    const { allowed, rejected } = filterAllowedFiles(selected);
    if (rejected.length > 0) {
      showFeedback({
        type: "error",
        text: t(
          "files.upload.rejected",
          "Neatļauts faila tips. Atļautie: {types}",
          { types: extensionsLabel },
        ),
      });
    }
    if (allowed.length === 0) return;

    const created: ListFile[] = [];
    let skippedContent = false;
    let nextOrder = nextItemSortOrder([
      ...(current.parentId
        ? childTasks(current.parentId)
        : listTasks(current.listId)),
      ...childListFiles(files, current.listId, current.parentId),
    ]);
    for (const file of allowed) {
      const stored = await addStoredListFile(
        current.listId,
        file,
        current.parentId,
        nextOrder,
      );
      if (!stored) continue;
      nextOrder += 1;
      created.push(stored);
      if (!stored.hasContent && file.size > 0) skippedContent = true;
    }

    showFeedback({
      type: skippedContent ? "info" : "success",
      text: skippedContent
        ? t(
            "files.created_without_preview",
            "Fails pievienots, bet saturu nevarēja saglabāt priekšskatījumam.",
          )
        : t("lists.windows.files_created", "Fails pievienots."),
    });
    const first = created[0];
    if (first) onFileCreated?.(first);
    onClose();
    if (first) {
      router.push(filePageHref(current.listId, first.id));
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={handleFiles}
      />

      <CreateItemMenu
        open={context !== null && step === "choice"}
        anchor={context?.anchor ?? null}
        title={t("create.menu.title", "Izveidot")}
        items={[
          {
            id: "folder",
            icon: "far fa-folder",
            title: isFolder
              ? t("create.subfolder.title", "Apakšmape")
              : t("create.folder.title", "Mape"),
            description: isFolder
              ? t(
                  "create.subfolder.description",
                  "Grupē uzdevumu sarakstus un failus šajā mapē",
                )
              : t(
                  "create.folder.description",
                  "Grupē sarakstus, dokumentus un vairāk",
                ),
          },
          {
            id: "task",
            icon: "fas fa-list-check",
            title: t("create.task_list.title", "Uzdevumu saraksts"),
            description: t(
              "create.task_list.description",
              "Darāmais darbs ar statusu, termiņu un apakšuzdevumiem",
            ),
          },
          ...(canApplyTemplate
            ? [
                {
                  id: "template",
                  icon: "fas fa-copy",
                  title: t("templates.apply.title", "Pievienot šablonu"),
                  description: t(
                    "templates.apply.description",
                    "Ievieto sagatavotus uzdevumu sarakstus šajā mapē",
                  ),
                },
              ]
            : []),
          ...(canUploadFiles
            ? [
                {
                  id: "file",
                  icon: "fas fa-upload",
                  title: t("create.file.upload_title", "Augšupielādēt failu"),
                  description: t(
                    "create.file.upload_description",
                    "Pievieno dokumentu šim sarakstam",
                  ),
                  showFileTypesInfo: true,
                },
              ]
            : []),
        ]}
        onSelect={handleSelect}
        onClose={onClose}
      />

      <CreateItemMenu
        open={context !== null && step === "template"}
        anchor={context?.anchor ?? null}
        title={t("templates.apply.pick_title", "Izvēlies šablonu")}
        items={templates.map((template) => ({
          id: template.id,
          icon: "fas fa-copy",
          title: template.name,
          description:
            template.description.trim() ||
            t("templates.items.count", "{count} uzdevumu saraksti", {
              count: templateItems(template.id).filter((item) => item.parentId === null)
                .length,
            }),
        }))}
        onSelect={(templateId) => {
          if (!context) return;
          const items = templateItems(templateId);
          const created = applyTemplate({
            listId: context.listId,
            parentId: context.parentId,
            items,
          });
          if (created.length === 0) {
            showFeedback({
              type: "info",
              text: t(
                "templates.apply.no_items",
                "Šajā šablonā nav uzdevumu sarakstu.",
              ),
            });
            return;
          }
          showFeedback({
            type: "success",
            text: t("templates.apply.success", "Šablons pievienots mapē."),
          });
          onCreated?.(created[0]?.id ?? "");
          onClose();
        }}
        onClose={() => setStep("choice")}
      />

      <NameFormModal
        open={context !== null && (step === "folder" || step === "task")}
        onOpenChange={(open) => {
          if (!open) setStep("choice");
        }}
        title={
          step === "folder"
            ? isFolder
              ? t("folders.add.subfolder_title", "Jauna apakšmape")
              : t("folders.add.title", "Jauna mape")
            : t("tasks.add.list_title", "Jauns uzdevumu saraksts")
        }
        description={
          step === "folder"
            ? isFolder
              ? t(
                  "folders.add.subfolder_description",
                  "Pievieno apakšmapi, lai grupētu uzdevumu sarakstus.",
                )
              : t(
                  "folders.add.description",
                  "Pievieno mapi, lai grupētu sarakstus un uzdevumus.",
                )
            : t(
                "tasks.add.list_description",
                "Pievieno uzdevumu sarakstu ar apakšuzdevumiem.",
              )
        }
        nameLabel={t("lists.fields.name", "Nosaukums")}
        namePlaceholder={
          step === "folder"
            ? isFolder
              ? t("folders.fields.subfolder_placeholder", "Apakšmapes nosaukums")
              : t("folders.fields.name_placeholder", "Mapes nosaukums")
            : t(
                "tasks.fields.list_placeholder",
                "Uzdevumu saraksta nosaukums",
              )
        }
        descriptionLabel={t("common.description", "Apraksts")}
        descriptionPlaceholder={t(
          "lists.fields.description_placeholder",
          "Īss apraksts",
        )}
        submitLabel={t("actions.add", "Pievienot")}
        onCreate={(input) => {
          if (!context) return;
          const task = addTask({
            listId: context.listId,
            parentId: context.parentId,
            kind: step === "folder" ? "folder" : "task",
            title: input.name,
            description: input.description,
          });
          if (step === "folder") {
            for (const rule of activeFolderCreatedTemplateAutomations(
              listAutomations,
              context.listId,
            )) {
              const items = templateItems(rule.templateId ?? "");
              if (items.length === 0) continue;
              applyTemplate({
                listId: context.listId,
                parentId: task.id,
                items,
              });
            }
          }
          showFeedback({
            type: "success",
            text:
              step === "folder"
                ? t("folders.created", "Mape pievienota.")
                : t("tasks.list_created", "Uzdevumu saraksts pievienots."),
          });
          onCreated?.(task.id);
          onClose();
          router.push(`/lists/${context.listId}/tasks/${task.id}`);
        }}
      />
    </>
  );
}
