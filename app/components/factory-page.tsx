"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AppModal } from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { IconActionButton } from "@/app/components/icon-action-button";
import { LoadingSpinner, LoadingState } from "@/app/components/loading-state";
import { PasswordInput } from "@/app/components/password-input";
import { SectionPage } from "@/app/components/section-page";
import { useTranslations } from "@/app/components/translations-provider";
import {
  createFactoryUserAction,
  deleteFactoryUserAction,
  listFactoryUsersAction,
} from "@/app/lib/factory/actions";
import type { FactoryUser } from "@/app/lib/factory/repository";
import { isPasswordStrongEnough } from "@/app/lib/auth/password-strength";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { initialsFromName } from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";

const fieldClassName =
  "mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60";

function FactoryUserForm({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<void>;
}) {
  const { t } = useTranslations();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setPending(false);
  }, [open]);

  const trimmedEmail = email.trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const passwordValid = password.length >= 8 && isPasswordStrongEnough(password);
  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    emailValid &&
    passwordValid &&
    !pending;
  const dirty = Boolean(
    firstName.trim() || lastName.trim() || trimmedEmail || password,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    try {
      await onCreate({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: trimmedEmail,
        password,
      });
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("factory.form.title", "Jauns rūpnīcas lietotājs")}
      description={t(
        "factory.form.description",
        "Norādi vārdu, uzvārdu, e-pastu un paroli. Ielogošanās būs pieejama vēlāk.",
      )}
      dirty={dirty}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="factory-first-name" className="text-sm font-semibold text-zinc-700">
            {t("profile.personal.first_name", "Vārds")}
          </label>
          <input
            id="factory-first-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            disabled={pending}
            autoFocus
            className={fieldClassName}
          />
        </div>
        <div>
          <label htmlFor="factory-last-name" className="text-sm font-semibold text-zinc-700">
            {t("profile.personal.last_name", "Uzvārds")}
          </label>
          <input
            id="factory-last-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            disabled={pending}
            className={fieldClassName}
          />
        </div>
        <div>
          <label htmlFor="factory-email" className="text-sm font-semibold text-zinc-700">
            {t("common.email", "E-pasts")}
          </label>
          <input
            id="factory-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
            aria-invalid={trimmedEmail.length > 0 && !emailValid}
            className={fieldClassName}
            placeholder={t("team.fields.email_placeholder", "vards@uznemums.lv")}
          />
        </div>
        <div>
          <label htmlFor="factory-password" className="text-sm font-semibold text-zinc-700">
            {t("auth.fields.password", "Parole")}
          </label>
          <PasswordInput
            id="factory-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={pending}
            autoComplete="new-password"
            className="mt-2"
            inputClassName={fieldClassName.replace("mt-2 ", "")}
          />
          {password.length > 0 && !passwordValid ? (
            <p className="mt-2 text-sm text-red-600">
              {password.length < 8
                ? t("auth.signup.password_short", "Parolei jābūt vismaz 8 zīmēm.")
                : t(
                    "auth.signup.password_too_weak",
                    "Parole ir pārāk vāja. Izmanto lielos un mazos burtus, ciparus un speciālo zīmi.",
                  )}
            </p>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-60"
          >
            {t("actions.cancel", "Atcelt")}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            {pending ? <LoadingSpinner size="sm" className="text-xs text-white" /> : null}
            {t("actions.add", "Pievienot")}
          </button>
        </div>
      </form>
    </AppModal>
  );
}

export function FactoryPage() {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const { currentTeam, isReady } = useTeam();
  const [users, setUsers] = useState<FactoryUser[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<FactoryUser | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentTeam) {
      setUsers([]);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    setLoaded(false);
    void listFactoryUsersAction(currentTeam.id).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        setUsers([]);
        setLoaded(true);
        return;
      }
      setUsers(result.data);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [currentTeam, showFeedback, t]);

  const paying =
    currentTeam?.paymentPlan.paid === true || currentTeam?.isVip === true;

  return (
    <>
      <SectionPage
        title={t("frontend_modules.label.module_factory", "Rūpnīca")}
        subtitle={t(
          "factory.page.subtitle",
          "Pievieno rūpnīcas lietotājus. Par viņiem nav jāmaksā kā par komandas vietām.",
        )}
        actions={
          paying ? (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              <i className="fas fa-plus text-xs" aria-hidden="true" />
              {t("actions.add", "Pievienot")}
            </button>
          ) : null
        }
      >
        {!isReady || !loaded ? (
          <LoadingState />
        ) : !paying ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
            {t(
              "errors.factory_not_paid",
              "Rūpnīca ir pieejama tikai maksājošai komandai.",
            )}
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
            {t("factory.empty", "Vēl nav rūpnīcas lietotāju.")}
          </div>
        ) : (
          <div className="grid gap-3">
            {users.map((user) => {
              const name = `${user.firstName} ${user.lastName}`.trim();
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-3xl border border-zinc-200 bg-white px-5 py-4 shadow-sm"
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                    {initialsFromName(name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">{name}</p>
                    <p className="mt-0.5 truncate text-sm text-zinc-500">{user.email}</p>
                  </div>
                  <IconActionButton
                    label={t("actions.delete", "Dzēst")}
                    icon={
                      pendingId === user.id
                        ? "fas fa-spinner fa-spin"
                        : "fas fa-user-minus"
                    }
                    variant="delete"
                    disabled={pendingId !== null}
                    onClick={() => setRemoveTarget(user)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </SectionPage>

      <FactoryUserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreate={async (input) => {
          if (!currentTeam) return;
          const result = await createFactoryUserAction({
            teamId: currentTeam.id,
            ...input,
          });
          if (!result.ok) {
            showFeedback({
              type: "error",
              text: translateActionError(t, result.error),
            });
            throw new Error(result.error);
          }
          setUsers((current) => [...current, result.data]);
          showFeedback({
            type: "success",
            text: t("factory.added", "Rūpnīcas lietotājs pievienots."),
          });
        }}
      />

      <ConfirmModal
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open && pendingId === null) setRemoveTarget(null);
        }}
        title={t("factory.delete.title", "Noņemt rūpnīcas lietotāju?")}
        description={t(
          "factory.delete.description",
          "{name} vairs nebūs rūpnīcas lietotāju sarakstā.",
          {
            name: removeTarget
              ? `${removeTarget.firstName} ${removeTarget.lastName}`.trim()
              : "",
          },
        )}
        confirmLabel={t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        blocking={pendingId !== null}
        onConfirm={() => {
          if (!removeTarget || !currentTeam) return;
          const target = removeTarget;
          setPendingId(target.id);
          void deleteFactoryUserAction({
            teamId: currentTeam.id,
            factoryUserId: target.id,
          }).then((result) => {
            setPendingId(null);
            if (!result.ok) {
              showFeedback({
                type: "error",
                text: translateActionError(t, result.error),
              });
              return;
            }
            setUsers((current) => current.filter((item) => item.id !== target.id));
            setRemoveTarget(null);
            showFeedback({
              type: "success",
              text: t("factory.removed", "Rūpnīcas lietotājs noņemts."),
            });
          });
        }}
      />
    </>
  );
}
