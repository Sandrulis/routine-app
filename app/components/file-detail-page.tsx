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
import { useTranslations } from "@/app/components/translations-provider";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";
import {
  deleteStoredListFile,
  formatFileSize,
  readListFileContent,
  renameStoredListFile,
} from "@/app/lib/list-files";
import { useLists } from "@/app/lib/lists-store";
import { useListFiles } from "@/app/lib/use-list-files";

export function FileDetailPage({
  listId,
  fileId,
}: {
  listId: string;
  fileId: string;
}) {
  const { t } = useTranslations();
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const { lists, isReady } = useLists();
  const { files, isReady: filesReady } = useListFiles();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const list = lists.find((item) => item.id === listId) ?? null;
  const file = files.find((item) => item.id === fileId && item.listId === listId) ?? null;

  useEffect(() => {
    if (!file?.hasContent) {
      setContent(null);
      return;
    }
    setContent(readListFileContent(file.id));
  }, [file]);

  if (!isReady || !filesReady) {
    return (
      <SectionPage
        title={t("files.detail.loading", "Ielādē failu")}
        subtitle={t("lists.page.subtitle", "Saraksti ar uzdevumiem.")}
      >
        <LoadingState />
      </SectionPage>
    );
  }

  if (!list || !file) {
    return (
      <SectionPage
        title={t("files.detail.missing", "Fails nav atrasts")}
        subtitle={t(
          "files.detail.missing_description",
          "Šis fails vairs nav pieejams.",
        )}
      >
        <Link
          href={list ? `/lists/${list.id}` : "/lists"}
          className="inline-flex min-h-10 items-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
        >
          {t("lists.back", "Atpakaļ uz sarakstiem")}
        </Link>
      </SectionPage>
    );
  }

  const sizeLabel = formatFileSize(file.size);
  const dateLabel = formatDisplayDateDdMmYy(file.createdAt);
  const subtitle =
    [sizeLabel, dateLabel].filter(Boolean).join(" - ") ||
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
        description={t(
          "files.edit.description",
          "Maini faila nosaukumu.",
        )}
        nameLabel={t("lists.fields.name", "Nosaukums")}
        namePlaceholder={t(
          "files.fields.name_placeholder",
          "Faila nosaukums",
        )}
        descriptionLabel={t("common.description", "Apraksts")}
        descriptionPlaceholder={t(
          "lists.fields.description_placeholder",
          "Īss apraksts",
        )}
        submitLabel={t("actions.save", "Saglabāt")}
        showDescription={false}
        initialValue={{ name: file.name, description: "" }}
        onCreate={(input) => {
          renameStoredListFile(file.id, input.name);
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
          deleteStoredListFile(file.id);
          showFeedback({
            type: "success",
            text: t("files.deleted", "Fails dzēsts."),
          });
          setDeleteOpen(false);
          router.push(
            file.parentId
              ? `/lists/${file.listId}/tasks/${file.parentId}`
              : `/lists/${file.listId}`,
          );
        }}
      />
    </SectionPage>
  );
}
