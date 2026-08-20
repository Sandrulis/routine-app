"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { AdminIntegrationCard } from "@/app/components/admin-integration-card";
import { AdminApiIntegrationsSection } from "@/app/components/admin-api-integrations-section";
import { UnsavedChangesConfirmModal } from "@/app/components/unsaved-changes-confirm-modal";
import { useUnsavedChangesGuard } from "@/app/components/unsaved-changes-guard";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import {
  resetGoogleOAuthConfigurationAction,
  saveGoogleOAuthCredentialsAction,
  setGoogleOAuthEnabledAction,
  startGoogleOAuthConfigureAction,
} from "@/app/lib/integrations/google-oauth/actions";
import {
  resetMicrosoftOAuthConfigurationAction,
  saveMicrosoftOAuthCredentialsAction,
  setMicrosoftOAuthEnabledAction,
  startMicrosoftOAuthConfigureAction,
} from "@/app/lib/integrations/microsoft-oauth/actions";
import type {
  GoogleOAuthIntegrationStatus,
  MicrosoftOAuthIntegrationStatus,
  SimpleIntegrationStatus,
} from "@/app/lib/integrations/types";

export function AdminIntegrationsPage({
  initialGoogleOAuth,
  initialMicrosoftOAuth,
  initialResend,
  initialUmami,
  initialSentry,
}: {
  initialGoogleOAuth: GoogleOAuthIntegrationStatus;
  initialMicrosoftOAuth: MicrosoftOAuthIntegrationStatus;
  initialResend: SimpleIntegrationStatus;
  initialUmami: SimpleIntegrationStatus;
  initialSentry: SimpleIntegrationStatus;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { t } = useTranslations();

  const [googleStatus, setGoogleStatus] = useState(initialGoogleOAuth);
  const [googleClientId, setGoogleClientId] = useState(initialGoogleOAuth.clientId);
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [googleEnabled, setGoogleEnabled] = useState(initialGoogleOAuth.enabled);
  const [googleResetOpen, setGoogleResetOpen] = useState(false);

  const [msStatus, setMsStatus] = useState(initialMicrosoftOAuth);
  const [msClientId, setMsClientId] = useState(initialMicrosoftOAuth.clientId);
  const [msClientSecret, setMsClientSecret] = useState("");
  const [msEnabled, setMsEnabled] = useState(initialMicrosoftOAuth.enabled);
  const [msResetOpen, setMsResetOpen] = useState(false);
  const [googleExpanded, setGoogleExpanded] = useState(initialGoogleOAuth.configured);
  const [msExpanded, setMsExpanded] = useState(initialMicrosoftOAuth.configured);
  const [apiDirty, setApiDirty] = useState(false);

  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isBusy = isPending || pendingKey !== null;

  const googleCredentialsDirty =
    googleClientId.trim() !== googleStatus.clientId ||
    googleClientSecret.trim().length > 0;
  const googleEnabledDirty =
    googleStatus.configured && googleEnabled !== googleStatus.enabled;
  const msCredentialsDirty =
    msClientId.trim() !== msStatus.clientId || msClientSecret.trim().length > 0;
  const msEnabledDirty = msStatus.configured && msEnabled !== msStatus.enabled;
  const isDirty =
    googleCredentialsDirty ||
    googleEnabledDirty ||
    msCredentialsDirty ||
    msEnabledDirty ||
    apiDirty;

  const { confirmOpen, stayOnPage, confirmLeave } = useUnsavedChangesGuard({
    isDirty,
  });

  useEffect(() => {
    setGoogleStatus(initialGoogleOAuth);
    setGoogleClientId(initialGoogleOAuth.clientId);
    setGoogleEnabled(initialGoogleOAuth.enabled);
    setGoogleExpanded(initialGoogleOAuth.configured);
  }, [initialGoogleOAuth]);

  useEffect(() => {
    setMsStatus(initialMicrosoftOAuth);
    setMsClientId(initialMicrosoftOAuth.clientId);
    setMsEnabled(initialMicrosoftOAuth.enabled);
    setMsExpanded(initialMicrosoftOAuth.configured);
  }, [initialMicrosoftOAuth]);

  useEffect(() => {
    if (googleCredentialsDirty) {
      setGoogleExpanded(true);
    }
  }, [googleCredentialsDirty]);

  useEffect(() => {
    if (msCredentialsDirty) {
      setMsExpanded(true);
    }
  }, [msCredentialsDirty]);

  useEffect(() => {
    const configured = searchParams.get("configured");
    const msConfigured = searchParams.get("ms_configured");
    const error = searchParams.get("error");
    if (!configured && !msConfigured && !error) return;

    if (configured === "1") {
      setGoogleExpanded(true);
      showFeedback({
        type: "success",
        text: t(
          "integrations.google_oauth.feedback.configured",
          "Google OAuth integrācija konfigurēta.",
        ),
      });
    } else if (msConfigured === "1") {
      setMsExpanded(true);
      showFeedback({
        type: "success",
        text: t(
          "integrations.microsoft_oauth.feedback.configured",
          "Microsoft OAuth integrācija konfigurēta.",
        ),
      });
    } else if (error === "forbidden") {
      showFeedback({
        type: "error",
        text: t("errors.integrations_forbidden", "Nav tiesību konfigurēt integrācijas."),
      });
    } else if (error === "microsoft_oauth") {
      showFeedback({
        type: "error",
        text: t(
          "errors.integrations_microsoft_configure_failed",
          "Neizdevās pabeigt Microsoft OAuth konfigurāciju.",
        ),
      });
    } else {
      showFeedback({
        type: "error",
        text: t(
          "errors.integrations_configure_failed",
          "Neizdevās pabeigt Google OAuth konfigurāciju.",
        ),
      });
    }
    router.replace("/admin/integrations");
  }, [router, searchParams, showFeedback, t]);

  function handleSaveGoogle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    if (!googleClientId.trim()) {
      showFeedback({
        type: "error",
        text: t(
          "integrations.google_oauth.feedback.client_id_required",
          "Ievadi Google OAuth Client ID.",
        ),
      });
      return;
    }

    if (!googleStatus.hasClientSecret && !googleClientSecret.trim()) {
      showFeedback({
        type: "error",
        text: t(
          "integrations.google_oauth.feedback.client_secret_required",
          "Ievadi Google OAuth Client Secret.",
        ),
      });
      return;
    }

    startTransition(async () => {
      setPendingKey("google-save");
      const result = await saveGoogleOAuthCredentialsAction({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      });
      setPendingKey(null);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setGoogleStatus((current) => ({
        ...current,
        clientId: googleClientId.trim(),
        hasClientSecret:
          current.hasClientSecret || googleClientSecret.trim().length > 0,
      }));
      setGoogleClientSecret("");
      showFeedback({
        type: "success",
        text: t(
          "integrations.google_oauth.feedback.credentials_saved",
          "Google OAuth dati saglabāti.",
        ),
      });
      router.refresh();
    });
  }

  function handleConfigureGoogle() {
    clearFeedback();

    if (!googleClientId.trim()) {
      showFeedback({
        type: "error",
        text: t(
          "integrations.google_oauth.feedback.client_id_required",
          "Ievadi Google OAuth Client ID.",
        ),
      });
      return;
    }

    if (!googleStatus.hasClientSecret && !googleClientSecret.trim()) {
      showFeedback({
        type: "error",
        text: t(
          "integrations.google_oauth.feedback.client_secret_required",
          "Ievadi Google OAuth Client Secret.",
        ),
      });
      return;
    }

    startTransition(async () => {
      setPendingKey("google-configure");
      if (googleCredentialsDirty) {
        const saveResult = await saveGoogleOAuthCredentialsAction({
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        });
        if (!saveResult.ok) {
          setPendingKey(null);
          showFeedback({
            type: "error",
            text: translateActionError(t, saveResult.error),
          });
          return;
        }
        setGoogleStatus((current) => ({
          ...current,
          clientId: googleClientId.trim(),
          hasClientSecret:
            current.hasClientSecret || googleClientSecret.trim().length > 0,
        }));
        setGoogleClientSecret("");
      }

      const result = await startGoogleOAuthConfigureAction(window.location.origin);
      if (!result.ok) {
        setPendingKey(null);
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      window.location.href = result.data.url;
    });
  }

  function handleGoogleEnabledToggle(nextEnabled: boolean) {
    if (!googleStatus.configured) return;
    clearFeedback();
    setGoogleEnabled(nextEnabled);

    startTransition(async () => {
      setPendingKey("google-enabled");
      const result = await setGoogleOAuthEnabledAction(nextEnabled);
      setPendingKey(null);
      if (!result.ok) {
        setGoogleEnabled(googleStatus.enabled);
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setGoogleStatus((current) => ({ ...current, enabled: nextEnabled }));
      showFeedback({
        type: "success",
        text: t(
          "integrations.feedback.status_saved",
          "Integrācijas statuss saglabāts.",
        ),
      });
      router.refresh();
    });
  }

  function handleResetGoogle() {
    clearFeedback();
    startTransition(async () => {
      setPendingKey("google-reset");
      const result = await resetGoogleOAuthConfigurationAction();
      setGoogleResetOpen(false);
      setPendingKey(null);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setGoogleStatus((current) => ({
        ...current,
        configured: false,
        enabled: false,
        configuredAccountEmail: "",
      }));
      setGoogleEnabled(false);
      setGoogleExpanded(false);
      showFeedback({
        type: "success",
        text: t(
          "integrations.google_oauth.feedback.reset",
          "Google OAuth konfigurācija notīrīta.",
        ),
      });
      router.refresh();
    });
  }

  function handleSaveMicrosoft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    if (!msClientId.trim()) {
      showFeedback({
        type: "error",
        text: t(
          "integrations.microsoft_oauth.feedback.client_id_required",
          "Ievadi Microsoft Application (client) ID.",
        ),
      });
      return;
    }

    if (!msStatus.hasClientSecret && !msClientSecret.trim()) {
      showFeedback({
        type: "error",
        text: t(
          "integrations.microsoft_oauth.feedback.client_secret_required",
          "Ievadi Microsoft Client Secret.",
        ),
      });
      return;
    }

    startTransition(async () => {
      setPendingKey("ms-save");
      const result = await saveMicrosoftOAuthCredentialsAction({
        clientId: msClientId,
        clientSecret: msClientSecret,
      });
      setPendingKey(null);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setMsStatus((current) => ({
        ...current,
        clientId: msClientId.trim(),
        hasClientSecret: current.hasClientSecret || msClientSecret.trim().length > 0,
      }));
      setMsClientSecret("");
      showFeedback({
        type: "success",
        text: t(
          "integrations.microsoft_oauth.feedback.credentials_saved",
          "Microsoft OAuth dati saglabāti.",
        ),
      });
      router.refresh();
    });
  }

  function handleConfigureMicrosoft() {
    clearFeedback();

    if (!msClientId.trim()) {
      showFeedback({
        type: "error",
        text: t(
          "integrations.microsoft_oauth.feedback.client_id_required",
          "Ievadi Microsoft Application (client) ID.",
        ),
      });
      return;
    }

    if (!msStatus.hasClientSecret && !msClientSecret.trim()) {
      showFeedback({
        type: "error",
        text: t(
          "integrations.microsoft_oauth.feedback.client_secret_required",
          "Ievadi Microsoft Client Secret.",
        ),
      });
      return;
    }

    startTransition(async () => {
      setPendingKey("ms-configure");
      if (msCredentialsDirty) {
        const saveResult = await saveMicrosoftOAuthCredentialsAction({
          clientId: msClientId,
          clientSecret: msClientSecret,
        });
        if (!saveResult.ok) {
          setPendingKey(null);
          showFeedback({
            type: "error",
            text: translateActionError(t, saveResult.error),
          });
          return;
        }
        setMsStatus((current) => ({
          ...current,
          clientId: msClientId.trim(),
          hasClientSecret: current.hasClientSecret || msClientSecret.trim().length > 0,
        }));
        setMsClientSecret("");
      }

      const result = await startMicrosoftOAuthConfigureAction(window.location.origin);
      if (!result.ok) {
        setPendingKey(null);
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      window.location.href = result.data.url;
    });
  }

  function handleMicrosoftEnabledToggle(nextEnabled: boolean) {
    if (!msStatus.configured) return;
    clearFeedback();
    setMsEnabled(nextEnabled);

    startTransition(async () => {
      setPendingKey("ms-enabled");
      const result = await setMicrosoftOAuthEnabledAction(nextEnabled);
      setPendingKey(null);
      if (!result.ok) {
        setMsEnabled(msStatus.enabled);
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setMsStatus((current) => ({ ...current, enabled: nextEnabled }));
      showFeedback({
        type: "success",
        text: t(
          "integrations.feedback.status_saved",
          "Integrācijas statuss saglabāts.",
        ),
      });
      router.refresh();
    });
  }

  function handleResetMicrosoft() {
    clearFeedback();
    startTransition(async () => {
      setPendingKey("ms-reset");
      const result = await resetMicrosoftOAuthConfigurationAction();
      setMsResetOpen(false);
      setPendingKey(null);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setMsStatus((current) => ({
        ...current,
        configured: false,
        enabled: false,
        configuredAccountEmail: "",
      }));
      setMsEnabled(false);
      setMsExpanded(false);
      showFeedback({
        type: "success",
        text: t(
          "integrations.microsoft_oauth.feedback.reset",
          "Microsoft OAuth konfigurācija notīrīta.",
        ),
      });
      router.refresh();
    });
  }

  const canConfigureGoogle =
    googleClientId.trim().length > 0 &&
    (googleStatus.hasClientSecret || googleClientSecret.trim().length > 0);
  const canConfigureMicrosoft =
    msClientId.trim().length > 0 &&
    (msStatus.hasClientSecret || msClientSecret.trim().length > 0);

  return (
    <div className="space-y-6">
      <AdminIntegrationCard
        panelId="google-oauth"
        title={t("integrations.google_oauth.title", "Google OAuth")}
        description={t(
          "integrations.google_oauth.description",
          "Konfigurē Google pieslēgšanos login un reģistrācijas lapā.",
        )}
        configured={googleStatus.configured}
        configuredAccountEmail={googleStatus.configuredAccountEmail}
        expanded={googleExpanded}
        onExpandedChange={setGoogleExpanded}
        enabled={googleEnabled}
        onEnabledChange={handleGoogleEnabledToggle}
        enabledAriaLabel={t(
          "integrations.google_oauth.aria.enabled",
          "Google OAuth integrācija ieslēgta",
        )}
        isBusy={isBusy}
      >
        <form onSubmit={handleSaveGoogle} className="space-y-4">
          <div>
            <label
              htmlFor="google-oauth-client-id"
              className="block text-sm font-medium text-zinc-700"
            >
              {t("integrations.google_oauth.client_id", "Client ID")}
            </label>
            <input
              id="google-oauth-client-id"
              value={googleClientId}
              onChange={(event) => {
                setGoogleClientId(event.target.value);
                clearFeedback();
              }}
              disabled={isBusy}
              placeholder="1234567890-abcdef.apps.googleusercontent.com"
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition placeholder:font-sans placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div>
            <label
              htmlFor="google-oauth-client-secret"
              className="block text-sm font-medium text-zinc-700"
            >
              {t("integrations.google_oauth.client_secret", "Client Secret")}
            </label>
            <input
              id="google-oauth-client-secret"
              type="password"
              value={googleClientSecret}
              onChange={(event) => {
                setGoogleClientSecret(event.target.value);
                clearFeedback();
              }}
              disabled={isBusy}
              placeholder={
                googleStatus.hasClientSecret
                  ? t(
                      "integrations.google_oauth.client_secret_placeholder_saved",
                      "Saglabāts — atstāj tukšu, ja nemaina",
                    )
                  : t(
                      "integrations.google_oauth.client_secret_placeholder",
                      "Google OAuth Client Secret",
                    )
              }
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition placeholder:font-sans placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            <p className="font-medium text-zinc-800">
              {t("integrations.google_oauth.redirects.title", "Redirect URI")}
            </p>
            <ul className="mt-2 space-y-1 font-mono text-xs text-zinc-700">
              <li>{googleStatus.callbackUrl}</li>
              <li>{googleStatus.googleDriveCallbackUrl}</li>
            </ul>
            <p className="mt-2 text-xs text-zinc-500">
              {t(
                "integrations.google_oauth.redirects.hint",
                "Pirmo URI izmanto login/signup, otro — komandas Google Drive pieslēgšanai. Google Cloud projektā ieslēdz arī Drive API.",
              )}
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4">
            {googleStatus.configured ? (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setGoogleResetOpen(true)}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("integrations.google_oauth.reset", "Notīrīt konfigurāciju")}
              </button>
            ) : null}
            <button
              type="submit"
              disabled={isBusy || !googleCredentialsDirty}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingKey === "google-save" ? (
                <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
              ) : null}
              {t("actions.save", "Saglabāt")}
            </button>
            <button
              type="button"
              disabled={isBusy || !canConfigureGoogle}
              onClick={handleConfigureGoogle}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingKey === "google-configure" ? (
                <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
              ) : (
                <i className="fab fa-google text-xs" aria-hidden="true" />
              )}
              {googleStatus.configured
                ? t("integrations.google_oauth.reconfigure", "Pārkonfigurēt ar Google")
                : t("integrations.google_oauth.configure", "Konfigurēt ar Google")}
            </button>
          </div>
        </form>
      </AdminIntegrationCard>

      <AdminIntegrationCard
        panelId="microsoft-oauth"
        title={t("integrations.microsoft_oauth.title", "Microsoft OAuth")}
        description={t(
          "integrations.microsoft_oauth.description",
          "Konfigurē Microsoft Azure lietotni, lai lietotāji varētu ienākt un komandas izmantot OneDrive.",
        )}
        configured={msStatus.configured}
        configuredAccountEmail={msStatus.configuredAccountEmail}
        expanded={msExpanded}
        onExpandedChange={setMsExpanded}
        enabled={msEnabled}
        onEnabledChange={handleMicrosoftEnabledToggle}
        enabledAriaLabel={t(
          "integrations.microsoft_oauth.aria.enabled",
          "Microsoft OAuth integrācija ieslēgta",
        )}
        isBusy={isBusy}
      >
        <form onSubmit={handleSaveMicrosoft} className="space-y-4">
          <div>
            <label
              htmlFor="microsoft-oauth-client-id"
              className="block text-sm font-medium text-zinc-700"
            >
              {t(
                "integrations.microsoft_oauth.client_id",
                "Application (client) ID",
              )}
            </label>
            <input
              id="microsoft-oauth-client-id"
              value={msClientId}
              onChange={(event) => {
                setMsClientId(event.target.value);
                clearFeedback();
              }}
              disabled={isBusy}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition placeholder:font-sans placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div>
            <label
              htmlFor="microsoft-oauth-client-secret"
              className="block text-sm font-medium text-zinc-700"
            >
              {t("integrations.microsoft_oauth.client_secret", "Client Secret")}
            </label>
            <input
              id="microsoft-oauth-client-secret"
              type="password"
              value={msClientSecret}
              onChange={(event) => {
                setMsClientSecret(event.target.value);
                clearFeedback();
              }}
              disabled={isBusy}
              placeholder={
                msStatus.hasClientSecret
                  ? t(
                      "integrations.microsoft_oauth.client_secret_placeholder_saved",
                      "Saglabāts — atstāj tukšu, ja nemaina",
                    )
                  : t(
                      "integrations.microsoft_oauth.client_secret_placeholder",
                      "Microsoft Client Secret",
                    )
              }
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition placeholder:font-sans placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            <p className="font-medium text-zinc-800">
              {t("integrations.microsoft_oauth.redirects.title", "Redirect URI")}
            </p>
            <ul className="mt-2 space-y-1 font-mono text-xs text-zinc-700">
              <li>{msStatus.callbackUrl}</li>
              <li>{msStatus.onedriveCallbackUrl}</li>
            </ul>
            <p className="mt-2 text-xs text-zinc-500">
              {t(
                "integrations.microsoft_oauth.redirects.hint",
                "Pirmo URI izmanto konfigurācijai un login/signup, otro — komandas OneDrive. Azure appā pievieno arī Files.ReadWrite atļauju.",
              )}
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4">
            {msStatus.configured ? (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setMsResetOpen(true)}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("integrations.microsoft_oauth.reset", "Notīrīt konfigurāciju")}
              </button>
            ) : null}
            <button
              type="submit"
              disabled={isBusy || !msCredentialsDirty}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingKey === "ms-save" ? (
                <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
              ) : null}
              {t("actions.save", "Saglabāt")}
            </button>
            <button
              type="button"
              disabled={isBusy || !canConfigureMicrosoft}
              onClick={handleConfigureMicrosoft}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingKey === "ms-configure" ? (
                <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
              ) : (
                <i className="fab fa-microsoft text-xs" aria-hidden="true" />
              )}
              {msStatus.configured
                ? t(
                    "integrations.microsoft_oauth.reconfigure",
                    "Pārkonfigurēt ar Microsoft",
                  )
                : t(
                    "integrations.microsoft_oauth.configure",
                    "Konfigurēt ar Microsoft",
                  )}
            </button>
          </div>
        </form>
      </AdminIntegrationCard>

      <AdminApiIntegrationsSection
        initialResend={initialResend}
        initialUmami={initialUmami}
        initialSentry={initialSentry}
        onDirtyChange={setApiDirty}
      />

      <ConfirmModal
        open={googleResetOpen}
        onOpenChange={setGoogleResetOpen}
        title={t(
          "integrations.google_oauth.reset.confirm_title",
          "Notīrīt Google OAuth konfigurāciju?",
        )}
        description={t(
          "integrations.google_oauth.reset.confirm_description",
          "Integrācija tiks izslēgta un lietotāji vairs neredzēs Google pieslēgšanos.",
        )}
        confirmLabel={t("integrations.google_oauth.reset", "Notīrīt konfigurāciju")}
        confirmVariant="danger"
        blocking={pendingKey === "google-reset"}
        onConfirm={handleResetGoogle}
      />

      <ConfirmModal
        open={msResetOpen}
        onOpenChange={setMsResetOpen}
        title={t(
          "integrations.microsoft_oauth.reset.confirm_title",
          "Notīrīt Microsoft OAuth konfigurāciju?",
        )}
        description={t(
          "integrations.microsoft_oauth.reset.confirm_description",
          "Integrācija tiks izslēgta, lietotāji vairs neredzēs Microsoft pieslēgšanos un OneDrive modulis vairs nebūs pieejams.",
        )}
        confirmLabel={t("integrations.microsoft_oauth.reset", "Notīrīt konfigurāciju")}
        confirmVariant="danger"
        blocking={pendingKey === "ms-reset"}
        onConfirm={handleResetMicrosoft}
      />

      <UnsavedChangesConfirmModal
        open={confirmOpen}
        onStay={stayOnPage}
        onLeave={confirmLeave}
      />
    </div>
  );
}
