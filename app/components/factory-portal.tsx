"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  authCardClassName,
  authInputClassName,
  authInputFieldClassName,
  authPrimaryButtonClassName,
} from "@/app/components/auth-form-styles";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { PasswordInput } from "@/app/components/password-input";
import { TaskChecklists } from "@/app/components/task-checklists";
import { useTranslations } from "@/app/components/translations-provider";
import {
  signInFactoryPortalAction,
  signOutFactoryPortalAction,
  listFactorySharedJobsAction,
  touchFactoryPortalOnlineAction,
  updateFactorySharedChecklistsAction,
} from "@/app/lib/factory/portal-actions";
import { ONLINE_HEARTBEAT_MS } from "@/app/lib/last-online";
import type { FactoryPortalUser, FactorySharedJob } from "@/app/lib/factory/portal";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { TaskChecklist } from "@/app/lib/task-checklists";

export function FactoryPortal({
  available,
  user,
  jobs,
  timeTracking,
}: {
  available: boolean;
  user: FactoryPortalUser | null;
  jobs: FactorySharedJob[];
  timeTracking: boolean;
}) {
  const { t } = useTranslations();
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [items, setItems] = useState(jobs);
  const [openId, setOpenId] = useState<string | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    void touchFactoryPortalOnlineAction();
    const timer = window.setInterval(() => {
      void touchFactoryPortalOnlineAction();
    }, ONLINE_HEARTBEAT_MS);
    return () => window.clearInterval(timer);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const timer = window.setInterval(() => {
      if (savingRef.current) return;
      void listFactorySharedJobsAction().then((result) => {
        if (!result.ok || savingRef.current) return;
        setItems(result.data);
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [user]);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const result = await signInFactoryPortalAction({ email, password });
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      showFeedback({
        type: "success",
        text: t("auth.login.success", "Veiksmīgi ienāci."),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleSignOut() {
    if (pending) return;
    setPending(true);
    try {
      await signOutFactoryPortalAction();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (!available) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4">
        <p className={`${authCardClassName} text-sm text-zinc-600`}>
          {t("factory.portal.unavailable", "Rūpnīcas modulis ir izslēgts.")}
        </p>
      </div>
    );
  }

  async function handleChecklists(job: FactorySharedJob, checklists: TaskChecklist[]) {
    savingRef.current = true;
    setItems((current) =>
      current.map((item) => (item.id === job.id ? { ...item, checklists } : item)),
    );
    const result = await updateFactorySharedChecklistsAction(job.id, checklists);
    savingRef.current = false;
    if (!result.ok) {
      showFeedback({ type: "error", text: translateActionError(t, result.error) });
    }
  }

  if (user) {
    const name = `${user.firstName} ${user.lastName}`.trim();
    const open = items.find((item) => item.id === openId) ?? null;
    return (
      <div className="min-h-dvh bg-zinc-50">
        <header className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-500">
              {t("frontend_modules.label.module_factory", "Rūpnīca")}
            </p>
            <h1 className="truncate text-lg font-semibold text-zinc-900">
              {t("factory.portal.welcome", "Sveiki, {name}", { name })}
            </h1>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => void handleSignOut()}
            className="shrink-0 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700"
          >
            {t("factory.portal.logout", "Izlogoties")}
          </button>
        </header>
        <main className={`mx-auto w-full px-4 py-6 ${open ? "max-w-6xl" : "max-w-3xl"}`}>
          {open ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="text-sm font-medium text-zinc-500"
              >
                {t("tour.actions.back", "Atpakaļ")}
              </button>
              <p className="mt-3 text-xs text-zinc-500">{open.folderName}</p>
              <h2 className="text-lg font-semibold text-zinc-900">{open.taskName}</h2>
              {open.subtaskTitle !== open.taskName ? (
                <p className="mt-0.5 text-sm text-zinc-600">{open.subtaskTitle}</p>
              ) : null}
              <div className="mt-4">
                {open.checklists.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    {t("factory.portal.checklists_empty", "Šim apakšuzdevumam nav kontrolsarakstu.")}
                  </p>
                ) : (
                  <TaskChecklists
                    checklists={open.checklists}
                    structureLocked
                    defaultExpanded
                    timeTracking={timeTracking}
                    actor={{
                      id: user.id,
                      name: name,
                      kind: "factory",
                    }}
                    onChange={(next) => void handleChecklists(open, next)}
                  />
                )}
              </div>
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {t("factory.portal.empty", "Nav koplietotu apakšuzdevumu.")}
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((job) => (
                <li key={job.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(job.id)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left"
                  >
                    <span className="block truncate text-xs text-zinc-500">{job.folderName}</span>
                    <span className="mt-0.5 block truncate text-sm font-semibold text-zinc-900">
                      {job.taskName}
                    </span>
                    {job.subtaskTitle !== job.taskName ? (
                      <span className="mt-0.5 block truncate text-sm text-zinc-600">{job.subtaskTitle}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4 py-12">
      <form onSubmit={(event) => void handleSignIn(event)} className={`${authCardClassName} space-y-4`}>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            {t("frontend_modules.label.module_factory", "Rūpnīca")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {t(
              "factory.portal.subtitle",
              "Ielogojies ar rūpnīcas lietotāja e-pastu un paroli.",
            )}
          </p>
        </div>
        <label className="block">
          <span className="text-sm font-semibold text-zinc-700">
            {t("common.email", "E-pasts")}
          </span>
          <input
            required
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
            placeholder={t("auth.fields.email_placeholder", "vards@uznemums.lv")}
            className={authInputClassName}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-zinc-700">
            {t("auth.fields.password", "Parole")}
          </span>
          <PasswordInput
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={pending}
            className="mt-2"
            inputClassName={authInputFieldClassName}
          />
        </label>
        <button type="submit" disabled={pending} className={authPrimaryButtonClassName}>
          {t("auth.login.title", "Ienākt")}
        </button>
      </form>
    </div>
  );
}
