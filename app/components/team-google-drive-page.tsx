"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { LoadingState } from "@/app/components/loading-state";
import { SectionPage } from "@/app/components/section-page";
import { UnsavedChangesConfirmModal } from "@/app/components/unsaved-changes-confirm-modal";
import { useUnsavedChangesGuard } from "@/app/components/unsaved-changes-guard";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import {
  disconnectGoogleDriveAction,
  getTeamGoogleDriveStatusAction,
  saveGoogleDriveSettingsAction,
  startGoogleDriveOAuthAction,
} from "@/app/lib/google-drive/actions";
import { notifyGoogleDriveStatusChanged } from "@/app/lib/google-drive/context";
import type { GoogleDriveStatus } from "@/app/lib/google-drive/repository";
import { canConfigureTeamGoogleDrive } from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";
import { defaultCloudFolderFromTeamName } from "@/app/lib/cloud-storage/sanitize-folder-path";

function emptyGoogleDriveStatus(folderPath: string): GoogleDriveStatus {
  return {
    configured: false,
    connected: false,
    enabled: false,
    storeOnServer: false,
    folderPath,
    accountEmail: "",
    canConfigure: false,
  };
}

export function TeamGoogleDrivePage() {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { currentTeam, currentUser, roles, isReady } = useTeam();
  const { isAdmin } = useIsAdmin();
  const canConfigureUi = canConfigureTeamGoogleDrive(currentUser, roles, isAdmin);
  const suggestedFolderPath = defaultCloudFolderFromTeamName(currentTeam?.name);
  const [status, setStatus] = useState(() => emptyGoogleDriveStatus(suggestedFolderPath));
  const [folderPath, setFolderPath] = useState(suggestedFolderPath);
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const canConfigure = canConfigureUi && status.canConfigure;
  const hasChanges =
    loaded &&
    (folderPath.trim() !== status.folderPath || enabled !== status.enabled);
  const { confirmOpen, stayOnPage, confirmLeave } = useUnsavedChangesGuard({
    isDirty: hasChanges,
  });

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (!connected && !error) return;
    if (connected === "1") {
      showFeedback({
        type: "success",
        text: t("google_drive.feedback.connected", "Google konts pieslēgts."),
      });
    } else if (error === "forbidden") {
      showFeedback({
        type: "error",
        text: t("errors.google_drive_forbidden", "Nav tiesību konfigurēt Google Drive."),
      });
    } else {
      showFeedback({
        type: "error",
        text: t("errors.google_drive_connect_failed", "Neizdevās pieslēgt Google Drive."),
      });
    }
    router.replace("/team/google-drive");
  }, [router, searchParams, showFeedback, t]);

  useEffect(() => {
    if (!currentTeam) {
      setLoaded(true);
      setStatus(emptyGoogleDriveStatus(suggestedFolderPath));
      setFolderPath(suggestedFolderPath);
      return;
    }
    let cancelled = false;
    setLoaded(false);
    void getTeamGoogleDriveStatusAction(currentTeam.id).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        setLoaded(true);
        return;
      }
      setStatus(result.data);
      setFolderPath(result.data.folderPath);
      setEnabled(result.data.enabled);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [currentTeam, showFeedback, suggestedFolderPath, t]);

  function handleConnect() {
    if (!currentTeam || !canConfigure) return;
    clearFeedback();
    startTransition(async () => {
      const result = await startGoogleDriveOAuthAction(
        currentTeam.id,
        window.location.origin,
      );
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      window.location.href = result.data.url;
    });
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentTeam || !canConfigure || !hasChanges) return;
    clearFeedback();
    startTransition(async () => {
      const result = await saveGoogleDriveSettingsAction({
        teamId: currentTeam.id,
        isEnabled: enabled,
        storeOnServer: false,
        folderPath,
      });
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      setStatus((current) => ({
        ...current,
        enabled,
        storeOnServer: false,
        folderPath: result.data.folderPath,
      }));
      setFolderPath(result.data.folderPath);
      notifyGoogleDriveStatusChanged();
      showFeedback({
        type: "success",
        text: t("google_drive.feedback.saved", "Google Drive iestatījumi saglabāti."),
      });
    });
  }

  function handleDisconnect() {
    if (!currentTeam || !canConfigure) return;
    clearFeedback();
    startTransition(async () => {
      const result = await disconnectGoogleDriveAction(currentTeam.id);
      setDisconnectOpen(false);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      setStatus((current) => ({
        ...current,
        connected: false,
        enabled: false,
        accountEmail: "",
      }));
      setEnabled(false);
      notifyGoogleDriveStatusChanged();
      showFeedback({
        type: "success",
        text: t("google_drive.feedback.disconnected", "Google konts atvienots."),
      });
    });
  }

  return (
    <SectionPage
      title={t("nav.google_drive", "Google Drive Integrācija")}
      subtitle={t(
        "google_drive.page.subtitle",
        "Pieslēdz komandas Google kontu. Faili tiek glabāti Google Drive, nevis {SYSTEM_NAME} serverī.",
      )}
    >
      {!isReady || !loaded ? (
        <LoadingState />
      ) : !currentTeam ? (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
          {t("teams.required.empty_members", "Vispirms izveido komandu.")}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-6">
            <h2 className="text-sm font-semibold text-zinc-900">
              {t("google_drive.connect.title", "Google konts")}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {t(
                "google_drive.connect.description",
                "Piekļuve tikai failiem, ko izveido {SYSTEM_NAME} (Drive scope: drive.file).",
              )}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  status.connected
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {status.connected
                  ? t("google_drive.status.connected", "Savienots")
                  : t("google_drive.status.disconnected", "Nav savienots")}
              </span>
              {status.accountEmail ? (
                <span className="text-sm text-zinc-600">{status.accountEmail}</span>
              ) : null}
            </div>
            {!status.configured ? (
              <p className="mt-4 text-sm text-amber-800">
                {t(
                  "google_drive.not_configured",
                  "Sistēmā nav iestatīts Google Drive OAuth Client ID un Secret (.env).",
                )}
              </p>
            ) : null}
            {canConfigure ? (
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                {status.connected ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setDisconnectOpen(true)}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t("google_drive.disconnect", "Atvienot Google kontu")}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isPending || !status.configured}
                    onClick={handleConnect}
                    className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? (
                      <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
                    ) : (
                      <i className="fab fa-google text-xs" aria-hidden="true" />
                    )}
                    {t("google_drive.connect.button", "Pierakstīties ar Google")}
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">
                {t(
                  "google_drive.configure_owner_only",
                  "Integrāciju var mainīt tikai komandas īpašnieks vai lietotājs ar tiesībām labot komandas datus.",
                )}
              </p>
            )}
          </div>

          <form
            onSubmit={handleSave}
            className="rounded-3xl border border-zinc-200 bg-white px-5 py-6"
          >
            <h2 className="text-sm font-semibold text-zinc-900">
              {t("google_drive.folder.title", "Drive mape")}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {t(
                "google_drive.folder.description",
                "Faili nonāk šajā mapē, saglabājot saraksta un mapju struktūru.",
              )}
            </p>
            <label className="mt-5 block text-sm font-medium text-zinc-700" htmlFor="gdrive-folder">
              {t("google_drive.folder.path", "Mapes ceļš Drive")}
            </label>
            <input
              id="gdrive-folder"
              value={folderPath}
              onChange={(event) => setFolderPath(event.target.value)}
              disabled={!canConfigure || isPending}
              placeholder={suggestedFolderPath}
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-zinc-50"
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              {t(
                "google_drive.folder.hint",
                "Piemēram {name} vai Komanda/Faili. Mape tiek izveidota, ja tās vēl nav.",
                { name: suggestedFolderPath },
              )}
            </p>
            <label className="mt-5 flex items-start gap-3 text-sm text-zinc-800">
              <input
                type="checkbox"
                checked={enabled}
                disabled={!canConfigure || isPending || !status.connected}
                onChange={(event) => setEnabled(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                {t(
                  "google_drive.upload.enabled",
                  "Augšupielādēt failus uz Google Drive, kad tos pievieno {SYSTEM_NAME}",
                )}
              </span>
            </label>
            {canConfigure ? (
              <div className="mt-5 flex justify-end border-t border-zinc-100 pt-5">
                <button
                  type="submit"
                  disabled={isPending || !hasChanges}
                  className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? (
                    <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
                  ) : null}
                  {isPending
                    ? t("actions.saving", "Saglabā…")
                    : t("actions.save", "Saglabāt")}
                </button>
              </div>
            ) : null}
          </form>
        </div>
      )}

      <ConfirmModal
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
        title={t("google_drive.disconnect.title", "Atvienot Google kontu?")}
        description={t(
          "google_drive.disconnect.description",
          "Jauni faili vairs netiks augšupielādēti, kamēr Drive nav pieslēgts. Esošie Drive faili paliek.",
        )}
        confirmLabel={t("google_drive.disconnect", "Atvienot Google kontu")}
        confirmVariant="danger"
        onConfirm={handleDisconnect}
      />

      <UnsavedChangesConfirmModal
        open={confirmOpen}
        onStay={stayOnPage}
        onLeave={confirmLeave}
      />
    </SectionPage>
  );
}
