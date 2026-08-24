"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { LoadingState } from "@/app/components/loading-state";
import { useTranslations } from "@/app/components/translations-provider";
import {
  listFeatureRequestsAction,
  submitUserFeedbackAction,
  toggleFeatureVoteAction,
  type FeatureRequestItem,
  type FeedbackKind,
} from "@/app/lib/feedback/actions";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { formatInteger } from "@/app/lib/format/numbers";

export function SiteFeedbackModals({
  kind,
  onOpenChange,
}: {
  kind: FeedbackKind | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();

  async function submit(nextKind: FeedbackKind, title: string, body: string) {
    const result = await submitUserFeedbackAction({
      kind: nextKind,
      title,
      body,
    });
    if (!result.ok) {
      showFeedback({
        type: "error",
        text: translateActionError(t, result.error),
      });
      throw new Error(result.error);
    }
    const sentKey =
      nextKind === "bug"
        ? "feedback.bug.sent"
        : nextKind === "feature"
          ? "feedback.feature.sent"
          : "feedback.general.sent";
    const sentFallback =
      nextKind === "bug"
        ? "Paldies, kļūdas ziņojums nosūtīts."
        : nextKind === "feature"
          ? "Funkcijas pieprasījums nosūtīts."
          : "Paldies, atsauksme nosūtīta.";
    showFeedback({
      type: "success",
      text: t(sentKey, sentFallback),
    });
  }

  return (
    <>
      <SimpleFeedbackFormModal
        open={kind === "bug"}
        onOpenChange={onOpenChange}
        title={t("feedback.bug.title", "Atrast kļūdu?")}
        description={t(
          "feedback.bug.description",
          "Apraksti kļūdu. Ziņojums tiks nosūtīts uz juridisko e-pastu.",
        )}
        titlePlaceholder={t(
          "feedback.bug.title_placeholder",
          "Īss kļūdas kopsavilkums",
        )}
        bodyPlaceholder={t(
          "feedback.bug.body_placeholder",
          "Kas notika, ko gaidīji un kā to atkārtot",
        )}
        fieldIdPrefix="feedback-bug"
        onSubmit={(title, body) => submit("bug", title, body)}
      />

      <SimpleFeedbackFormModal
        open={kind === "feedback"}
        onOpenChange={onOpenChange}
        title={t("feedback.general.title", "Atsauksmes")}
        description={t(
          "feedback.general.description",
          "Padalies ar savu viedokli. Ziņojums tiks nosūtīts uz juridisko e-pastu.",
        )}
        titlePlaceholder={t(
          "feedback.general.title_placeholder",
          "Tēma",
        )}
        bodyPlaceholder={t(
          "feedback.general.body_placeholder",
          "Kas tev patīk vai ko varētu uzlabot",
        )}
        fieldIdPrefix="feedback-general"
        onSubmit={(title, body) => submit("feedback", title, body)}
      />

      <FeatureRequestModal
        open={kind === "feature"}
        onOpenChange={onOpenChange}
        onSubmit={(title, body) => submit("feature", title, body)}
      />
    </>
  );
}

function SimpleFeedbackFormModal({
  open,
  onOpenChange,
  title,
  description,
  titlePlaceholder,
  bodyPlaceholder,
  fieldIdPrefix,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  titlePlaceholder: string;
  bodyPlaceholder: string;
  fieldIdPrefix: string;
  onSubmit: (title: string, body: string) => Promise<void>;
}) {
  const { t } = useTranslations();
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setDetails("");
    setPending(false);
  }, [open]);

  const trimmedName = name.trim();
  const trimmedDetails = details.trim();
  const dirty = Boolean(trimmedName || trimmedDetails);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedName || !trimmedDetails || pending) return;
    setPending(true);
    try {
      await onSubmit(trimmedName, trimmedDetails);
      onOpenChange(false);
    } catch {
      // Toast already shown by onSubmit.
    } finally {
      setPending(false);
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      dirty={dirty}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor={`${fieldIdPrefix}-title`} className="text-sm font-semibold text-zinc-700">
            {t("lists.fields.name", "Nosaukums")}
          </label>
          <input
            id={`${fieldIdPrefix}-title`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder={titlePlaceholder}
            autoFocus
            maxLength={200}
          />
        </div>
        <div>
          <label htmlFor={`${fieldIdPrefix}-body`} className="text-sm font-medium text-zinc-500">
            {t("common.description", "Apraksts")}
          </label>
          <textarea
            id={`${fieldIdPrefix}-body`}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={4}
            maxLength={4000}
            className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            placeholder={bodyPlaceholder}
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
          <button
            type="button"
            disabled={pending}
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("actions.cancel", "Atcelt")}
          </button>
          <button
            type="submit"
            disabled={pending || !trimmedName || !trimmedDetails}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            {t("actions.send", "Nosūtīt")}
          </button>
        </div>
      </form>
    </AppModal>
  );
}

function FeatureRequestModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (title: string, body: string) => Promise<void>;
}) {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [items, setItems] = useState<FeatureRequestItem[]>([]);
  const [selected, setSelected] = useState<FeatureRequestItem | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);

  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  const dirty = Boolean(trimmedTitle || trimmedBody);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setBody("");
    setPending(false);
    setSelected(null);
    setVotingId(null);
    let cancelled = false;
    setLoadingList(true);
    void listFeatureRequestsAction().then((result) => {
      if (cancelled) return;
      setLoadingList(false);
      if (!result.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        setItems([]);
        return;
      }
      setItems(result.items);
    });
    return () => {
      cancelled = true;
    };
  }, [open, showFeedback, t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedTitle || !trimmedBody || pending) return;
    setPending(true);
    try {
      await onSubmit(trimmedTitle, trimmedBody);
      setTitle("");
      setBody("");
      const result = await listFeatureRequestsAction();
      if (result.ok) setItems(result.items);
    } catch {
      // Toast already shown by onSubmit.
    } finally {
      setPending(false);
    }
  }

  async function handleVote(item: FeatureRequestItem) {
    if (votingId) return;
    setVotingId(item.id);
    const result = await toggleFeatureVoteAction(item.id);
    setVotingId(null);
    if (!result.ok) {
      showFeedback({
        type: "error",
        text: translateActionError(t, result.error),
      });
      return;
    }
    setItems((current) =>
      current
        .map((row) =>
          row.id === item.id
            ? {
                ...row,
                voteCount: result.voteCount,
                votedByMe: result.votedByMe,
              }
            : row,
        )
        .sort((left, right) => {
          if (right.voteCount !== left.voteCount) {
            return right.voteCount - left.voteCount;
          }
          return right.createdAt.localeCompare(left.createdAt);
        }),
    );
    setSelected((current) =>
      current?.id === item.id
        ? {
            ...current,
            voteCount: result.voteCount,
            votedByMe: result.votedByMe,
          }
        : current,
    );
  }

  return (
    <>
      <AppModal
        open={open}
        onOpenChange={onOpenChange}
        title={t("feedback.feature.title", "Pieprasīt funkciju")}
        description={t(
          "feedback.feature.description",
          "Iesaki jaunu iespēju. Citi var balsot, lai palīdzētu noteikt prioritāti.",
        )}
        dirty={dirty}
        panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="feature-request-title" className="text-sm font-semibold text-zinc-700">
              {t("lists.fields.name", "Nosaukums")}
            </label>
            <input
              id="feature-request-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder={t(
                "feedback.feature.title_placeholder",
                "Ko vēlies pievienot?",
              )}
              autoFocus
              maxLength={200}
            />
          </div>
          <div>
            <label
              htmlFor="feature-request-body"
              className="text-sm font-medium text-zinc-500"
            >
              {t("common.description", "Apraksts")}
            </label>
            <textarea
              id="feature-request-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={4}
              maxLength={4000}
              className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              placeholder={t(
                "feedback.feature.body_placeholder",
                "Kāpēc tas palīdzētu un kā to izmantotu",
              )}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
            <button
              type="button"
              disabled={pending}
              onClick={() => onOpenChange(false)}
              className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("actions.cancel", "Atcelt")}
            </button>
            <button
              type="submit"
              disabled={pending || !trimmedTitle || !trimmedBody}
              className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:bg-zinc-200 disabled:text-zinc-400"
            >
              {t("actions.send", "Nosūtīt")}
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-zinc-100 pt-4">
          <h3 className="text-sm font-semibold text-zinc-700">
            {t("feedback.feature.list", "Citu pieprasījumi")}
          </h3>
          {loadingList ? (
            <LoadingState compact className="mt-2" />
          ) : items.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-400">
              {t(
                "feedback.feature.empty",
                "Vēl nav pieprasījumu. Esi pirmais.",
              )}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {items.map((item) => (
                <li key={item.id}>
                  <div className="flex items-stretch gap-2 rounded-xl border border-zinc-200 bg-white">
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="min-w-0 flex-1 px-3 py-2.5 text-left"
                    >
                      <span className="block truncate text-sm font-medium text-zinc-900">
                        {item.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={votingId !== null}
                      onClick={() => void handleVote(item)}
                      aria-pressed={item.votedByMe}
                      aria-label={t("feedback.feature.upvote", "Balsot")}
                      className={`m-1.5 flex min-w-14 shrink-0 flex-col items-center justify-center rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                        item.votedByMe
                          ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200"
                          : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <i className="fas fa-chevron-up text-[12px]" aria-hidden="true" />
                      <span className="mt-0.5 tabular-nums">
                        {formatInteger(item.voteCount)}
                      </span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </AppModal>

      <AppModal
        open={selected !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setSelected(null);
        }}
        title={selected?.title ?? ""}
        overlayZIndex={60}
      >
        {selected ? (
          <div className="space-y-4">
            <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700">
              {selected.body}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={votingId !== null}
                onClick={() => void handleVote(selected)}
                aria-pressed={selected.votedByMe}
                className={`inline-flex min-h-10 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition ${
                  selected.votedByMe
                    ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <i className="fas fa-chevron-up text-[12px]" aria-hidden="true" />
                {t("feedback.feature.upvote", "Balsot")}
                <span className="tabular-nums">
                  {formatInteger(selected.voteCount)}
                </span>
              </button>
            </div>
          </div>
        ) : null}
      </AppModal>
    </>
  );
}
