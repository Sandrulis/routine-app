"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { FilePreview } from "@/app/components/file-preview";
import { LoadingState } from "@/app/components/loading-state";
import { NameFormModal } from "@/app/components/name-form-modal";
import { SectionPage } from "@/app/components/section-page";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { formatFileSize } from "@/app/lib/list-files";
import { ensureTaskFileContent } from "@/app/lib/file-content";
import { fileBaseName, fileExtensionFromName } from "@/app/lib/file-types";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { useFrontendModules } from "@/app/lib/frontend-modules/context";
import { fetchGoogleDriveContentAsObjectUrl } from "@/app/lib/google-drive/content-url";
import { fetchOneDriveContentAsObjectUrl } from "@/app/lib/onedrive/content-url";
import { useLists } from "@/app/lib/lists-store";
import { taskFilePreviewUrl } from "@/app/lib/task-activity";

export function TaskFileDetailPage({
  listId,
  taskId,
  fileId,
}: {
  listId: string;
  taskId: string;
  fileId: string;
}) {
  const { t } = useTranslations();
  const { formatDate } = useDisplayPreferences();
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const {
    lists,
    tasks,
    isReady,
    taskFiles,
    renameTaskFile,
    removeTaskFile,
  } = useLists();
  const { isEnabled: isModuleEnabled } = useFrontendModules();
  const fileUploadsEnabled = isModuleEnabled(FRONTEND_MODULE_KEYS.fileUpload);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const list = lists.find((item) => item.id === listId) ?? null;
  const task = tasks.find((item) => item.id === taskId && item.listId === listId) ?? null;
  const file =
    taskFiles(taskId).find((item) => item.id === fileId) ?? null;

  useEffect(() => {
    if (!fileUploadsEnabled) {
      router.replace(listId ? `/lists/${listId}` : "/dashboard");
    }
  }, [fileUploadsEnabled, listId, router]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function loadContent() {
      if (!file) {
        setContent(null);
        return;
      }
      const local =
        (await ensureTaskFileContent(file.id)) ?? taskFilePreviewUrl(file);
      if (local) {
        setContent(local);
        return;
      }
      if (file.googleDriveFileId) {
        const url = await fetchGoogleDriveContentAsObjectUrl("task", file.id);
        if (cancelled) {
          if (url) URL.revokeObjectURL(url);
          return;
        }
        if (url) {
          objectUrl = url;
          setContent(url);
          return;
        }
      }
      if (file.oneDriveFileId) {
        const url = await fetchOneDriveContentAsObjectUrl("task", file.id);
        if (cancelled) {
          if (url) URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setContent(url);
        return;
      }
      setContent(null);
    }

    void loadContent();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!fileUploadsEnabled) {
    return (
      <SectionPage
        title={t("files.detail.loading", "Ielādē failu")}
        subtitle={t("lists.page.subtitle", "Saraksti ar uzdevumiem.")}
      >
        <LoadingState />
      </SectionPage>
    );
  }

  if (!isReady) {
    return (
      <SectionPage
        title={t("files.detail.loading", "Ielādē failu")}
        subtitle={t("lists.page.subtitle", "Saraksti ar uzdevumiem.")}
      >
        <LoadingState />
      </SectionPage>
    );
  }

  if (!list || !task || !file) {
    return (
      <SectionPage
        title={t("files.detail.missing", "Fails nav atrasts")}
        subtitle={t(
          "files.detail.missing_description",
          "Šis fails vairs nav pieejams.",
        )}
      >
        <Link
          href={
            task
              ? `/lists/${listId}/tasks/${task.id}`
              : list
                ? `/lists/${list.id}`
                : "/lists"
          }
          className="inline-flex min-h-10 items-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
        >
          {t("lists.back", "Atpakaļ uz sarakstiem")}
        </Link>
      </SectionPage>
    );
  }

  const sizeLabel = formatFileSize(file.size);
  const dateLabel = formatDate(file.createdAt);
  const subtitle =
    [sizeLabel, dateLabel, task.title].filter(Boolean).join(" - ") ||
    t("files.detail.empty_description", "Augšupielādēts fails.");

  return (
    <SectionPage
      title={file.name}
      subtitle={subtitle}
      actions={
        <div className="flex items-center gap-2">
          {content ? (
            <a
              href={content}
              download={file.name}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
            >
              <i className="fas fa-download text-xs" aria-hidden="true" />
              {t("files.detail.download", "Lejupielādēt")}
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => setRenameOpen(true)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            <i className="fas fa-pen text-xs" aria-hidden="true" />
            {t("actions.rename", "Pārsaukt")}
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            <i className="fas fa-trash text-xs" aria-hidden="true" />
            {t("actions.delete", "Dzēst")}
          </button>
        </div>
      }
    >
      <FilePreview file={file} content={content} />

      <NameFormModal
        open={renameOpen}
        onOpenChange={setRenameOpen}
        title={t("files.edit.title", "Pārsaukt failu")}
        description={t("files.edit.description", "Maini faila nosaukumu.")}
        nameLabel={t("lists.fields.name", "Nosaukums")}
        namePlaceholder={t("files.fields.name_placeholder", "Faila nosaukums")}
        descriptionLabel={t("common.description", "Apraksts")}
        descriptionPlaceholder={t(
          "lists.fields.description_placeholder",
          "Īss apraksts",
        )}
        submitLabel={t("actions.save", "Saglabāt")}
        showDescription={false}
        nameSuffix={
          (() => {
            const extension = fileExtensionFromName(file.name);
            return extension ? `.${extension}` : null;
          })()
        }
        initialValue={{ name: fileBaseName(file.name), description: "" }}
        onCreate={(input) => {
          renameTaskFile(file.id, input.name);
          showFeedback({
            type: "success",
            text: t("files.updated", "Fails pārsaukts."),
          });
          setRenameOpen(false);
        }}
      />

      <ConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("files.delete.title", "Dzēst failu?")}
        description={t("files.delete.description", "Fails “{name}” tiks dzēsts.", {
          name: file.name,
        })}
        confirmLabel={t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        onConfirm={() => {
          removeTaskFile(file.id);
          showFeedback({
            type: "success",
            text: t("files.deleted", "Fails dzēsts."),
          });
          setDeleteOpen(false);
          router.push(`/lists/${listId}/tasks/${taskId}`);
        }}
      />
    </SectionPage>
  );
}
