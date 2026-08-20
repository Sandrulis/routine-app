"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { CreateItemMenu, type CreateMenuAnchor } from "@/app/components/create-item-menu";
import {
  FileUploadOverlay,
  type FileUploadProgressState,
} from "@/app/components/file-upload-overlay";
import { NameFormModal } from "@/app/components/name-form-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import {
  addStoredListFile,
  childListFiles,
  nextItemSortOrder,
  type ListFile,
} from "@/app/lib/list-files";
import { useFileViewer } from "@/app/components/file-viewer-provider";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { useFrontendModules } from "@/app/lib/frontend-modules/context";
import { googleDrivePathForListFile } from "@/app/lib/google-drive/path";
import {
  batchUploadPercent,
  driveFileIdFromUpload,
  shouldStoreFileOnServer,
  uploadGoogleDriveFile,
} from "@/app/lib/google-drive/queue-upload";
import { queueOneDriveUpload } from "@/app/lib/onedrive/queue-upload";
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
  const { openListFile } = useFileViewer();
  const { addTask, applyTemplate, listTasks, childTasks, listAutomations, lists, tasks } = useLists();
  const { templates, templateItems, isReady: templatesReady, ensureLoaded } = useTemplates();
  const { files } = useListFiles();
  const { currentTeam, currentUser, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);
  const { isEnabled: isModuleEnabled } = useFrontendModules();
  const fileUploadsEnabled = isModuleEnabled(FRONTEND_MODULE_KEYS.fileUpload);
  const googleDriveEnabled =
    fileUploadsEnabled && isModuleEnabled(FRONTEND_MODULE_KEYS.googleDrive);
  const onedriveEnabled =
    fileUploadsEnabled && isModuleEnabled(FRONTEND_MODULE_KEYS.onedrive);
  const canApplyTemplate =
    hasTeamNavPermission(currentUser, roles, isAdmin, "templates") &&
    canManageTemplates(currentUser, roles, isAdmin) &&
    isModuleEnabled(FRONTEND_MODULE_KEYS.templates);
  const canUploadFiles =
    hasTeamActionPermission(
      currentUser,
      roles,
      isAdmin,
      "files.upload",
    ) && fileUploadsEnabled;
  const { accept, filterAllowedFiles, extensionsLabel } = useFileTypes();
  const [step, setStep] = useState<"choice" | "folder" | "task" | "template">(
    "choice",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] =
    useState<FileUploadProgressState | null>(null);
  const contextRef = useRef(context);
  contextRef.current = context;

  useEffect(() => {
    if (context) setStep("choice");
  }, [context]);

  const isFolder = context?.variant === "folder";

  function handleSelect(id: string) {
    if (!context) return;

    if (id === "file") {
      if (!canUploadFiles) return;
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
    if (!current || selected.length === 0 || !canUploadFiles || uploadProgress) {
      return;
    }

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
    const total = allowed.length;
    try {
      for (let index = 0; index < allowed.length; index += 1) {
        const file = allowed[index];
        const updateProgress = (filePercent: number) => {
          setUploadProgress({
            fileName: file.name.trim() || "file",
            current: index + 1,
            total,
            percent: batchUploadPercent(index, total, filePercent),
          });
        };
        updateProgress(0);
        let driveResult = null;
        if (googleDriveEnabled) {
          driveResult = await uploadGoogleDriveFile({
            teamId: currentTeam?.id,
            listId: current.listId,
            file,
            pathParts: googleDrivePathForListFile({
              lists,
              tasks,
              listId: current.listId,
              parentId: current.parentId,
            }),
            onProgress: updateProgress,
          });
        } else {
          updateProgress(40);
        }
        updateProgress(85);
        const stored = await addStoredListFile(
          current.listId,
          file,
          current.parentId,
          nextOrder,
          {
            storeContent: shouldStoreFileOnServer(driveResult),
            googleDriveFileId: driveFileIdFromUpload(driveResult),
          },
        );
        if (!stored) {
          updateProgress(100);
          continue;
        }
        nextOrder += 1;
        created.push(stored);
        if (!stored.hasContent && !stored.googleDriveFileId && file.size > 0) {
          skippedContent = true;
        }
        if (onedriveEnabled) {
          queueOneDriveUpload({
            teamId: currentTeam?.id,
            listId: current.listId,
            file,
            pathParts: googleDrivePathForListFile({
              lists,
              tasks,
              listId: current.listId,
              parentId: current.parentId,
            }),
          });
        }
        updateProgress(100);
      }
    } finally {
      setUploadProgress(null);
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
      openListFile(first);
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
        disabled={!canUploadFiles}
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
          if (
            step === "folder" &&
            isModuleEnabled(FRONTEND_MODULE_KEYS.automations) &&
            isModuleEnabled(FRONTEND_MODULE_KEYS.templates)
          ) {
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
      <FileUploadOverlay progress={uploadProgress} />
    </>
  );
}
