"use client";

import { useEffect, useRef, useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createDocsArticleAction,
  deleteDocsArticleAction,
  deleteDocsArticleImageAction,
  getDocsArticleAction,
  listDocsArticleImagesAction,
  reorderDocsArticlesAction,
  setDocsArticleVisibleAction,
  updateDocsArticleAction,
} from "@/app/(app)/admin/actions";
import {
  AppModal,
  appModalSplitPanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import {
  DocsArticleImages,
  type DocsArticleImageItem,
} from "@/app/components/docs-article-images";
import { DocsMarkdown } from "@/app/components/docs-markdown";
import {
  DocsSourceLanguageCode,
  DocsSourceLanguageNotice,
} from "@/app/components/docs-source-language-notice";
import { DragHandle } from "@/app/components/drag-handle";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { IconActionButton } from "@/app/components/icon-action-button";
import {
  FileUploadOverlay,
  type FileUploadProgressState,
} from "@/app/components/file-upload-overlay";
import { LoadingState } from "@/app/components/loading-state";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { batchUploadPercent } from "@/app/lib/google-drive/queue-upload";
import { DOCS_SYSTEM_NAME_PLACEHOLDER, renderDocsPlaceholders } from "@/app/lib/docs/placeholders";
import {
  DOCS_IMAGE_MAX_BYTES,
  DOCS_IMAGE_MAX_PER_ARTICLE,
  docsImageMarkdown,
  isAllowedDocsImageMime,
  stripDocsImageMarkdown,
} from "@/app/lib/docs/images";
import type { DocsArticleImage, DocsArticleSummary, DocsCategorySummary } from "@/app/lib/docs/types";

type ArticleDraft = {
  title: string;
  slogan: string;
  content: string;
};

function emptyDraft(): ArticleDraft {
  return { title: "", slogan: "", content: "" };
}

type LocalImage = DocsArticleImageItem & {
  pendingFile?: File;
  uploadPercent?: number;
};

function isDocsImageFile(file: File): boolean {
  const mime = file.type === "image/jpg" ? "image/jpeg" : file.type;
  return (
    isAllowedDocsImageMime(mime) && file.size > 0 && file.size <= DOCS_IMAGE_MAX_BYTES
  );
}

async function uploadDocsImage(
  articleId: string,
  file: File,
  id: string,
  onProgress?: (percent: number) => void,
) {
  const form = new FormData();
  form.set("articleId", articleId);
  form.set("id", id);
  form.set("file", file);

  const payload = await new Promise<{
    ok?: boolean;
    error?: string;
    image?: DocsArticleImage;
  } | null>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/docs/images");
    xhr.withCredentials = true;
    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable || event.total <= 0) return;
      onProgress(Math.max(0, Math.min(100, (event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText) as {
          ok?: boolean;
          error?: string;
          image?: DocsArticleImage;
        });
      } catch {
        resolve(null);
      }
    };
    xhr.onerror = () => resolve(null);
    xhr.onabort = () => resolve(null);
    xhr.send(form);
  });

  if (!payload?.ok || !payload.image) {
    return { ok: false as const, error: payload?.error ?? "errors.docs_image_upload_failed" };
  }
  return { ok: true as const, image: payload.image };
}

export function AdminDocsArticles({
  category,
  articles: initialArticles,
}: {
  category: DocsCategorySummary;
  articles: DocsArticleSummary[];
}) {
  const router = useRouter();
  const { t, systemName } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [articles, setArticles] = useState(initialArticles);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [loadedArticles, setLoadedArticles] = useState<
    Record<string, { slogan: string; content: string }>
  >({});
  const [deleteTarget, setDeleteTarget] = useState<DocsArticleSummary | null>(null);
  const [images, setImages] = useState<LocalImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgressState | null>(null);
  const [isPending, startTransition] = useTransition();
  const [openingArticleId, setOpeningArticleId] = useState<string | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    setArticles(initialArticles);
  }, [initialArticles]);

  const initialDraft = editingId
    ? {
        title: articles.find((item) => item.id === editingId)?.title ?? "",
        slogan: loadedArticles[editingId]?.slogan ?? "",
        content: loadedArticles[editingId]?.content ?? "",
      }
    : emptyDraft();
  const isDirty =
    JSON.stringify(draft) !== JSON.stringify(initialDraft) ||
    images.some((image) => Boolean(image.pendingFile));

  useEffect(() => {
    if (modalOpen) return;
    setEditingId(null);
    setDraft(emptyDraft());
    setImages((current) => {
      for (const image of current) {
        if (image.previewSrc?.startsWith("blob:")) URL.revokeObjectURL(image.previewSrc);
      }
      return [];
    });
  }, [modalOpen]);

  function openCreate() {
    clearFeedback();
    setEditingId(null);
    setDraft(emptyDraft());
    setImages([]);
    setModalOpen(true);
  }

  function openEdit(article: DocsArticleSummary) {
    if (openingArticleId) return;
    clearFeedback();
    setOpeningArticleId(article.id);
    startTransition(async () => {
      try {
        const [detail, articleImages] = await Promise.all([
          getDocsArticleAction(article.id),
          listDocsArticleImagesAction(article.id),
        ]);
        const content = detail?.content ?? "";
        const slogan = detail?.slogan ?? "";
        setLoadedArticles((current) => ({ ...current, [article.id]: { slogan, content } }));
        setEditingId(article.id);
        setDraft({ title: detail?.title ?? article.title, slogan, content });
        setImages(articleImages);
        setModalOpen(true);
      } finally {
        setOpeningArticleId(null);
      }
    });
  }

  function insertMarkdown(snippet: string) {
    const textarea = contentRef.current;
    const content = textarea?.value ?? draft.content;
    if (!textarea) {
      setDraft((current) => ({
        ...current,
        content: current.content.trim()
          ? `${current.content.trimEnd()}\n\n${snippet}\n`
          : `${snippet}\n`,
      }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const prefix = !before
      ? ""
      : before.endsWith("\n\n")
        ? ""
        : before.endsWith("\n")
          ? "\n"
          : "\n\n";
    const next = `${before}${prefix}${snippet}\n${after}`;
    setDraft((current) => ({ ...current, content: next }));
    const cursor = before.length + prefix.length + snippet.length + 1;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function insertPlaceholder(token: string) {
    const textarea = contentRef.current;
    const content = textarea?.value ?? draft.content;
    if (!textarea) {
      setDraft((current) => ({ ...current, content: `${current.content}${token}` }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = `${content.slice(0, start)}${token}${content.slice(end)}`;
    setDraft((current) => ({ ...current, content: next }));
    const cursor = start + token.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function insertImage(image: DocsArticleImageItem) {
    insertMarkdown(docsImageMarkdown(image.id, image.fileName));
  }

  async function addImageFiles(files: File[], insert: boolean) {
    if (uploadProgress) return;
    const accepted = files.filter(isDocsImageFile);
    if (accepted.length === 0) {
      showFeedback({
        type: "error",
        text: t(
          "errors.docs_image_invalid",
          "Augšupielādē attēlu (PNG, JPG, GIF vai WebP) līdz 1.5 MB.",
        ),
      });
      return;
    }
    if (images.length + accepted.length > DOCS_IMAGE_MAX_PER_ARTICLE) {
      showFeedback({
        type: "error",
        text: t("errors.docs_image_limit", "Šai apakškategorijai ir pārāk daudz attēlu."),
      });
      return;
    }

    const nextItems: LocalImage[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      fileName: file.name,
      previewSrc: URL.createObjectURL(file),
      pendingFile: file,
    }));

    setImages((current) => [...current, ...nextItems]);
    if (insert) {
      insertMarkdown(nextItems.map((item) => docsImageMarkdown(item.id, item.fileName)).join("\n"));
    }

    if (!editingId) return;

    const result = await uploadPendingImages(editingId, nextItems);
    if (!result.ok) {
      showFeedback({ type: "error", text: translateActionError(t, result.error) });
    }
  }

  async function uploadPendingImages(articleId: string, items: LocalImage[]) {
    const pending = items.filter((item) => item.pendingFile);
    if (pending.length === 0) return { ok: true as const };
    const total = pending.length;
    try {
      for (let index = 0; index < pending.length; index += 1) {
        const item = pending[index];
        const file = item.pendingFile;
        if (!file) continue;
        const updateProgress = (filePercent: number) => {
          setUploadProgress({
            fileName: item.fileName,
            current: index + 1,
            total,
            percent: batchUploadPercent(index, total, filePercent),
          });
          setImages((current) =>
            current.map((image) =>
              image.id === item.id ? { ...image, uploadPercent: filePercent } : image,
            ),
          );
        };
        updateProgress(0);
        const result = await uploadDocsImage(articleId, file, item.id, updateProgress);
        if (!result.ok) {
          if (item.previewSrc?.startsWith("blob:")) URL.revokeObjectURL(item.previewSrc);
          setImages((current) => current.filter((image) => image.id !== item.id));
          return { ok: false as const, error: result.error };
        }
        setImages((current) =>
          current.map((image) =>
            image.id === item.id
              ? { ...image, pendingFile: undefined, uploadPercent: undefined }
              : image,
          ),
        );
      }
      return { ok: true as const };
    } finally {
      setUploadProgress(null);
    }
  }

  function removeImage(image: DocsArticleImageItem) {
    startTransition(async () => {
      const local = images.find((item) => item.id === image.id);
      if (local?.previewSrc?.startsWith("blob:")) URL.revokeObjectURL(local.previewSrc);
      if (!local?.pendingFile) {
        const result = await deleteDocsArticleImageAction(image.id);
        if (!result.ok) {
          showFeedback({ type: "error", text: translateActionError(t, result.error) });
          return;
        }
      }
      setImages((current) => current.filter((item) => item.id !== image.id));
      setDraft((current) => ({
        ...current,
        content: stripDocsImageMarkdown(current.content, image.id),
      }));
    });
  }

  function handleContentDrop(event: DragEvent<HTMLTextAreaElement>) {
    if (![...event.dataTransfer.types].includes("Files")) return;
    event.preventDefault();
    if (isPending || uploadProgress) return;
    void addImageFiles([...event.dataTransfer.files], true);
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    startTransition(async () => {
      let articleId = editingId;
      if (!editingId) {
        const created = await createDocsArticleAction(category.id, draft);
        if (!created.ok) {
          showFeedback({ type: "error", text: translateActionError(t, created.error) });
          return;
        }
        articleId = created.data.article.id;
      } else {
        const updated = await updateDocsArticleAction(editingId, draft);
        if (!updated.ok) {
          showFeedback({ type: "error", text: translateActionError(t, updated.error) });
          return;
        }
      }
      if (articleId) {
        const pending = images.filter((image) => image.pendingFile);
        if (pending.length > 0) {
          const uploaded = await uploadPendingImages(articleId, pending);
          if (!uploaded.ok) {
            showFeedback({ type: "error", text: translateActionError(t, uploaded.error) });
            return;
          }
        }
      }
      if (editingId) {
        setLoadedArticles((current) => ({
          ...current,
          [editingId]: { slogan: draft.slogan, content: draft.content },
        }));
      }
      setModalOpen(false);
      showFeedback({
        type: "success",
        text: editingId
          ? t("admin.docs.feedback.article_saved", "Apakškategorija saglabāta.")
          : t("admin.docs.feedback.article_created", "Apakškategorija pievienota."),
      });
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteDocsArticleAction(deleteTarget.id);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      setDeleteTarget(null);
      showFeedback({
        type: "success",
        text: t("admin.docs.feedback.article_deleted", "Apakškategorija dzēsta."),
      });
      router.refresh();
    });
  }

  function handleVisibility(article: DocsArticleSummary) {
    const nextVisible = !article.isVisible;
    startTransition(async () => {
      setArticles((current) =>
        current.map((item) =>
          item.id === article.id ? { ...item, isVisible: nextVisible } : item,
        ),
      );
      const result = await setDocsArticleVisibleAction(article.id, nextVisible);
      if (!result.ok) {
        setArticles((current) =>
          current.map((item) =>
            item.id === article.id ? { ...item, isVisible: article.isVisible } : item,
          ),
        );
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      router.refresh();
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || isPending) return;

    const oldIndex = articles.findIndex((article) => article.id === active.id);
    const newIndex = articles.findIndex((article) => article.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(articles, oldIndex, newIndex).map((item, index) => ({
      ...item,
      sortOrder: index,
    }));
    setArticles(next);

    startTransition(async () => {
      const result = await reorderDocsArticlesAction(
        category.id,
        next.map((item) => item.id),
      );
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        setArticles(initialArticles);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Link
        href="/admin/docs"
        className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
      >
        <i className="fas fa-arrow-left text-xs" aria-hidden="true" />
        {t("admin.docs.back", "Atpakaļ uz kategorijām")}
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
              <i className={category.icon} aria-hidden="true" />
            </span>
            <h2 className="truncate text-base font-semibold text-zinc-900">{category.title}</h2>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            {t(
              "admin.docs.articles.hint",
              "Apakškategorijas saturs atbalsta tekstu, attēlus, koda blokus un YouTube saites. Markdown piemērs ir zem teksta lauka.",
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          <i className="fas fa-plus text-xs" aria-hidden="true" />
          {t("admin.docs.article.add", "Jauna apakškategorija")}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="w-10 px-3 py-3" />
                  <th className="px-5 py-3">{t("lists.fields.name", "Nosaukums")}</th>
                  <th className="px-5 py-3 text-right">{t("common.actions", "Darbības")}</th>
                </tr>
              </thead>
              <SortableContext
                items={articles.map((article) => article.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody className="divide-y divide-zinc-100">
                  {articles.map((article) => (
                    <SortableArticleRow
                      key={article.id}
                      article={article}
                      dragLabel={t("subtasks.drag", "Mainīt secību")}
                      disabled={isPending || Boolean(openingArticleId)}
                      opening={openingArticleId === article.id}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                      onVisibility={handleVisibility}
                      t={t}
                    />
                  ))}
                  {articles.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-zinc-500">
                        {t("admin.docs.articles.empty", "Šajā kategorijā vēl nav apakškategoriju.")}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      </div>

      {openingArticleId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4"
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white shadow-xl">
            <LoadingState />
          </div>
        </div>
      ) : null}

      <AppModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={
          editingId
            ? t("admin.docs.article.edit", "Labot apakškategoriju")
            : t("admin.docs.article.add", "Jauna apakškategorija")
        }
        panelMaxWidthClassName={appModalSplitPanelMaxWidthClassName}
        blocking={isPending || Boolean(uploadProgress)}
        dirty={isDirty}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <fieldset
            disabled={isPending || Boolean(uploadProgress)}
            className="space-y-4 disabled:opacity-80"
          >
            <DocsSourceLanguageNotice />
            <div>
              <label htmlFor="docs-article-title" className="text-sm font-medium text-zinc-800">
                {t("lists.fields.name", "Nosaukums")}
                <DocsSourceLanguageCode />
              </label>
              <input
                id="docs-article-title"
                value={draft.title}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, title: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              />
            </div>
            <div>
              <label htmlFor="docs-article-slogan" className="text-sm font-medium text-zinc-800">
                {t("site_settings.form.slogan", "Slogans")}
                <DocsSourceLanguageCode />
              </label>
              <input
                id="docs-article-slogan"
                value={draft.slogan}
                maxLength={300}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, slogan: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label htmlFor="docs-article-content" className="text-sm font-medium text-zinc-800">
                  {t("admin.docs.article.content", "Saturs")}
                  <DocsSourceLanguageCode />
                </label>
                <textarea
                  id="docs-article-content"
                  ref={contentRef}
                  value={draft.content}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, content: event.target.value }))
                  }
                  onDragOver={(event) => {
                    if ([...event.dataTransfer.types].includes("Files")) {
                      event.preventDefault();
                    }
                  }}
                  onDrop={handleContentDrop}
                  rows={16}
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-[13px] text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                />
                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  {t(
                    "admin.docs.article.content_hint",
                    "Markdown: virsraksti ar #, treknraksts **teksts**, kods ar ```js:fails.js, YouTube saite atsevišķā rindā. Attēlus ievelc zemāk un klikšķini, lai ievietotu.",
                  )}
                </p>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => insertPlaceholder(DOCS_SYSTEM_NAME_PLACEHOLDER)}
                  className="mt-2 inline-flex items-center rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("admin.docs.article.insert_system_name", "Ievietot {token}", {
                    token: DOCS_SYSTEM_NAME_PLACEHOLDER,
                  })}
                </button>
                <p className="mt-1.5 text-xs leading-5 text-zinc-500">
                  {t(
                    "admin.docs.article.placeholder_hint",
                    "{token} publiskajā dokumentācijā kļūst par sistēmas nosaukumu. Ja nosaukums mainās, docs nav jālabo.",
                    { token: DOCS_SYSTEM_NAME_PLACEHOLDER },
                  )}
                </p>
                <div className="mt-4">
                  <DocsArticleImages
                    images={images}
                    disabled={isPending || Boolean(uploadProgress)}
                    onAddFiles={(files) => {
                      void addImageFiles(files, false);
                    }}
                    onInsert={insertImage}
                    onRemove={removeImage}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-800">
                  {t("admin.docs.article.preview", "Priekšskatījums")}
                </p>
                <div className="mt-2 max-h-[28rem] overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  {draft.title.trim() || draft.slogan.trim() || draft.content.trim() ? (
                    <div>
                      {draft.title.trim() ? (
                        <p className="text-xl font-semibold tracking-tight text-zinc-900">
                          {renderDocsPlaceholders(draft.title, systemName)}
                        </p>
                      ) : null}
                      {draft.slogan.trim() ? (
                        <p
                          className={`${draft.title.trim() ? "mt-1" : ""} text-sm font-normal text-zinc-500`}
                        >
                          {renderDocsPlaceholders(draft.slogan, systemName)}
                        </p>
                      ) : null}
                      {draft.content.trim() ? (
                        <div
                          className={
                            draft.title.trim() || draft.slogan.trim() ? "mt-6" : undefined
                          }
                        >
                          <DocsMarkdown
                            content={draft.content}
                            variant="light"
                            imageSrcOverrides={Object.fromEntries(
                              images
                                .filter((image) => image.previewSrc)
                                .map((image) => [image.id, image.previewSrc as string]),
                            )}
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400">
                      {t("admin.docs.article.preview_empty", "Sāc rakstīt, lai redzētu priekšskatījumu.")}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t border-zinc-100 pt-4">
              <button
                type="submit"
                disabled={isPending || Boolean(uploadProgress) || !isDirty || !draft.title.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
                ) : null}
                {isPending ? t("actions.saving", "Saglabā…") : t("actions.save", "Saglabāt")}
              </button>
            </div>
          </fieldset>
        </form>
      </AppModal>

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("admin.docs.article.delete.title", "Dzēst apakškategoriju?")}
        description={t(
          "admin.docs.article.delete.description",
          "Apakškategorija “{name}” tiks dzēsta.",
          { name: deleteTarget?.title ?? "" },
        )}
        confirmLabel={isPending ? t("actions.deleting", "Dzēš…") : t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        onConfirm={handleDelete}
      />
      <FileUploadOverlay progress={uploadProgress} />
    </div>
  );
}

function SortableArticleRow({
  article,
  dragLabel,
  disabled,
  opening,
  onEdit,
  onDelete,
  onVisibility,
  t,
}: {
  article: DocsArticleSummary;
  dragLabel: string;
  disabled: boolean;
  opening: boolean;
  onEdit: (article: DocsArticleSummary) => void;
  onDelete: (article: DocsArticleSummary) => void;
  onVisibility: (article: DocsArticleSummary) => void;
  t: ReturnType<typeof useTranslations>["t"];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: article.id, disabled });

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`align-middle ${article.isVisible ? "" : "opacity-60"} ${
        isDragging ? "relative z-10 bg-white shadow-sm" : ""
      }`}
    >
      <td className="px-3 py-4">
        <DragHandle
          label={dragLabel}
          attributes={attributes}
          listeners={listeners}
        />
      </td>
      <td className="px-5 py-4">
        <button
          type="button"
          onClick={() => onEdit(article)}
          disabled={disabled}
          className="inline-flex max-w-full items-center gap-2 text-left font-medium text-zinc-900 transition hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="truncate">{article.title}</span>
          {opening ? (
            <i className="fas fa-circle-notch ui-spinner text-xs text-zinc-400" aria-hidden="true" />
          ) : null}
        </button>
      </td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-1">
          <IconActionButton
            label={
              article.isVisible
                ? t("lists.statuses.hide", "Paslēpt")
                : t("lists.statuses.show", "Rādīt")
            }
            icon={article.isVisible ? "fas fa-eye-slash" : "fas fa-eye"}
            variant="muted"
            disabled={disabled}
            onClick={() => onVisibility(article)}
          />
          <IconActionButton
            label={t("actions.edit", "Labot")}
            icon={opening ? "fas fa-circle-notch ui-spinner" : "fas fa-pen"}
            disabled={disabled}
            onClick={() => onEdit(article)}
          />
          <IconActionButton
            label={t("actions.delete", "Dzēst")}
            icon="fas fa-trash"
            variant="delete"
            disabled={disabled}
            onClick={() => onDelete(article)}
          />
        </div>
      </td>
    </tr>
  );
}
