"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createFrontendModuleAction,
  deleteFrontendModuleAction,
  updateFrontendModuleEnabledAction,
} from "@/app/(app)/admin/actions";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { IconActionButton } from "@/app/components/icon-action-button";
import { ToggleSwitch } from "@/app/components/toggle-switch";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import {
  FRONTEND_MODULE_KEYS,
  knownFrontendModuleLabel,
} from "@/app/lib/frontend-modules/keys";
import type { FrontendModuleSummary } from "@/app/lib/frontend-modules/types";
import { translateActionError } from "@/app/lib/i18n/action-errors";

function sortModules(modules: FrontendModuleSummary[]) {
  return [...modules].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }
    return left.moduleKey.localeCompare(right.moduleKey);
  });
}

export function AdminFrontendModulesForm({
  initialModules,
  googleOAuthEnabled = false,
  microsoftOAuthEnabled = false,
}: {
  initialModules: FrontendModuleSummary[];
  googleOAuthEnabled?: boolean;
  microsoftOAuthEnabled?: boolean;
}) {
  const router = useRouter();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [modules, setModules] = useState(() => sortModules(initialModules));
  const [moduleKey, setModuleKey] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FrontendModuleSummary | null>(
    null,
  );
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isBusy = isPending || pendingKey !== null;

  useEffect(() => {
    setModules(sortModules(initialModules));
  }, [initialModules]);

  function moduleLabel(key: string) {
    const known = knownFrontendModuleLabel(key);
    if (known) return t(known.key, known.fallback);
    const translated = t(`frontend_modules.label.${key}`, "").trim();
    return translated || null;
  }

  function toggleLockedReason(module: FrontendModuleSummary): string | null {
    if (
      (module.moduleKey === FRONTEND_MODULE_KEYS.googleDrive ||
        module.moduleKey === FRONTEND_MODULE_KEYS.gmailPlugin) &&
      !googleOAuthEnabled
    ) {
      return t(
        "frontend_modules.google_drive.toggle_locked",
        "Vispirms konfigurē un ieslēdz Google OAuth integrāciju (Administrācija → Integrācijas).",
      );
    }
    if (
      module.moduleKey === FRONTEND_MODULE_KEYS.onedrive &&
      !microsoftOAuthEnabled
    ) {
      return t(
        "frontend_modules.onedrive.toggle_locked",
        "Vispirms konfigurē un ieslēdz Microsoft OAuth integrāciju (Administrācija → Integrācijas).",
      );
    }
    return null;
  }

  function isToggleDisabled(module: FrontendModuleSummary, isRowBusy: boolean) {
    const locked = toggleLockedReason(module);
    // OAuth gate blocks enabling only; already-on modules can still be turned off.
    if (locked && !module.isEnabled) return true;
    return isRowBusy || isBusy;
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    if (!moduleKey.trim()) {
      showFeedback({
        type: "error",
        text: t(
          "frontend_modules.feedback.key_required",
          "Ievadi moduļa atslēgu.",
        ),
      });
      return;
    }

    startTransition(async () => {
      setPendingKey("create");
      const result = await createFrontendModuleAction({ moduleKey });

      if (!result.ok) {
        setPendingKey(null);
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setModules((current) => sortModules([...current, result.module]));
      setModuleKey("");
      setPendingKey(null);
      showFeedback({
        type: "success",
        text: t("frontend_modules.feedback.created", "Modulis pievienots."),
      });
      router.refresh();
    });
  }

  function handleEnabledToggle(
    module: FrontendModuleSummary,
    nextEnabled: boolean,
  ) {
    clearFeedback();

    if (nextEnabled && toggleLockedReason(module)) {
      const errorKey =
        module.moduleKey === FRONTEND_MODULE_KEYS.onedrive
          ? "errors.frontend_module_microsoft_oauth_required"
          : "errors.frontend_module_google_oauth_required";
      showFeedback({
        type: "error",
        text: translateActionError(t, errorKey),
      });
      return;
    }

    const previousModules = modules;
    setModules((current) =>
      current.map((item) =>
        item.id === module.id ? { ...item, isEnabled: nextEnabled } : item,
      ),
    );

    startTransition(async () => {
      setPendingKey(`enabled:${module.moduleKey}`);
      const result = await updateFrontendModuleEnabledAction(
        module.moduleKey,
        nextEnabled,
      );

      if (!result.ok) {
        setModules(previousModules);
        setPendingKey(null);
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setPendingKey(null);
      showFeedback({
        type: "success",
        text: t(
          "frontend_modules.feedback.status_saved",
          "Moduļa statuss saglabāts.",
        ),
      });
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;

    const deletedKey = deleteTarget.moduleKey;

    startTransition(async () => {
      setPendingKey(`delete:${deletedKey}`);
      const result = await deleteFrontendModuleAction(deletedKey);

      if (!result.ok) {
        setPendingKey(null);
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setModules((current) =>
        current.filter((module) => module.moduleKey !== deletedKey),
      );
      setDeleteTarget(null);
      setPendingKey(null);
      showFeedback({
        type: "success",
        text: t("frontend_modules.feedback.deleted", "Modulis dzēsts."),
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-base font-semibold text-zinc-900">
          {t("frontend_modules.create.title", "Jauns modulis")}
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          {t(
            "frontend_modules.create.description",
            "Pievieno unikālu moduļa atslēgu, piemēram `reports` vai `inventory.sync`.",
          )}
        </p>
        <fieldset
          disabled={isBusy}
          className="mt-4 grid gap-3 disabled:opacity-80 sm:grid-cols-[minmax(0,1fr)_auto]"
        >
          <input
            type="text"
            value={moduleKey}
            onChange={(event) => {
              setModuleKey(event.target.value);
              clearFeedback();
            }}
            placeholder={t(
              "frontend_modules.create.key_placeholder",
              "Moduļa atslēga",
            )}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 font-mono text-sm text-zinc-900 outline-none transition placeholder:font-sans placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={isBusy || !moduleKey.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingKey === "create" ? (
              <i
                className="fas fa-circle-notch fa-spin text-xs"
                aria-hidden="true"
              />
            ) : null}
            {t("actions.add", "Pievienot")}
          </button>
        </fieldset>
      </form>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-5 py-3">
                  {t("lists.fields.name", "Nosaukums")}
                </th>
                <th className="px-5 py-3 text-right">
                  {t("common.actions", "Darbības")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {modules.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-5 py-8 text-center text-sm text-zinc-500"
                  >
                    {t("frontend_modules.table.empty", "Nav moduļu.")}
                  </td>
                </tr>
              ) : (
                modules.map((module) => {
                  const label = moduleLabel(module.moduleKey);
                  const isRowBusy =
                    pendingKey === `enabled:${module.moduleKey}` ||
                    pendingKey === `delete:${module.moduleKey}`;
                  const lockedReason = toggleLockedReason(module);
                  const toggleDisabled = isToggleDisabled(module, isRowBusy);
                  const toggle = (
                    <ToggleSwitch
                      checked={module.isEnabled}
                      disabled={toggleDisabled}
                      label={t(
                        "frontend_modules.aria.enabled",
                        "{key} ieslēgts",
                        { key: module.moduleKey },
                      )}
                      onChange={(nextEnabled) =>
                        handleEnabledToggle(module, nextEnabled)
                      }
                    />
                  );

                  return (
                    <tr key={module.id}>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-zinc-900">
                          {label ?? module.moduleKey}
                        </div>
                        {label ? (
                          <div className="mt-0.5 font-mono text-xs text-zinc-500">
                            {module.moduleKey}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center justify-end gap-3">
                          {lockedReason && !module.isEnabled ? (
                            <Tooltip label={lockedReason} align="end">
                              {toggle}
                            </Tooltip>
                          ) : (
                            toggle
                          )}
                          <IconActionButton
                            label={t("actions.delete", "Dzēst")}
                            icon="fas fa-trash"
                            variant="delete"
                            disabled={isRowBusy || isBusy}
                            onClick={() => {
                              if (!isRowBusy) setDeleteTarget(module);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("frontend_modules.delete.confirm_title", "Dzēst moduli?")}
        description={
          deleteTarget
            ? t(
                "frontend_modules.delete.confirm_description",
                "Modulis {key} tiks neatgriezeniski dzēsts.",
                { key: deleteTarget.moduleKey },
              )
            : ""
        }
        confirmLabel={t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        blocking={pendingKey?.startsWith("delete:") === true}
        onConfirm={handleDelete}
      />
    </div>
  );
}
