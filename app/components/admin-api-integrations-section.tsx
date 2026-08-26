"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminIntegrationCard } from "@/app/components/admin-integration-card";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { SITE_INTEGRATION_KEYS } from "@/app/lib/integrations/keys";
import {
  resetSimpleIntegrationAction,
  saveSimpleIntegrationCredentialsAction,
  setSimpleIntegrationEnabledAction,
} from "@/app/lib/integrations/simple/actions";
import { DEFAULT_UMAMI_SCRIPT_URL } from "@/app/lib/integrations/simple/definitions";
import { stripeWebhookUrl } from "@/app/lib/billing/urls";
import type { SimpleIntegrationStatus } from "@/app/lib/integrations/types";

type ApiIntegrationKind = "turnstile" | "resend" | "umami" | "sentry" | "stripe";

type DraftState = {
  status: SimpleIntegrationStatus;
  clientId: string;
  clientSecret: string;
  replyToEmail: string;
  enabled: boolean;
  expanded: boolean;
};

function createDraft(status: SimpleIntegrationStatus): DraftState {
  return {
    status,
    clientId: status.clientId,
    clientSecret: "",
    replyToEmail: status.replyToEmail,
    enabled: status.enabled,
    expanded: status.configured,
  };
}

function isDraftDirty(draft: DraftState, replyToIsSecret = false) {
  const credentialsDirty =
    draft.clientId.trim() !== draft.status.clientId ||
    draft.clientSecret.trim().length > 0 ||
    (replyToIsSecret
      ? draft.replyToEmail.trim().length > 0
      : draft.replyToEmail.trim() !== draft.status.replyToEmail);
  const enabledDirty =
    draft.status.configured && draft.enabled !== draft.status.enabled;
  return credentialsDirty || enabledDirty;
}

export function AdminApiIntegrationsSection({
  initialTurnstile,
  initialResend,
  initialUmami,
  initialSentry,
  initialStripe,
  onDirtyChange,
}: {
  initialTurnstile: SimpleIntegrationStatus;
  initialResend: SimpleIntegrationStatus;
  initialUmami: SimpleIntegrationStatus;
  initialSentry: SimpleIntegrationStatus;
  initialStripe: SimpleIntegrationStatus;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const router = useRouter();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [turnstile, setTurnstile] = useState(() => createDraft(initialTurnstile));
  const [resend, setResend] = useState(() => createDraft(initialResend));
  const [umami, setUmami] = useState(() => createDraft(initialUmami));
  const [sentry, setSentry] = useState(() => createDraft(initialSentry));
  const [stripe, setStripe] = useState(() => createDraft(initialStripe));
  const [resetTarget, setResetTarget] = useState<ApiIntegrationKind | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isBusy = isPending || pendingKey !== null;

  const isDirty =
    isDraftDirty(turnstile) ||
    isDraftDirty(resend) ||
    isDraftDirty(umami) ||
    isDraftDirty(sentry) ||
    isDraftDirty(stripe, true);

  useEffect(() => {
    setTurnstile(createDraft(initialTurnstile));
  }, [initialTurnstile]);

  useEffect(() => {
    setResend(createDraft(initialResend));
  }, [initialResend]);

  useEffect(() => {
    setUmami(createDraft(initialUmami));
  }, [initialUmami]);

  useEffect(() => {
    setSentry(createDraft(initialSentry));
  }, [initialSentry]);

  useEffect(() => {
    setStripe(createDraft(initialStripe));
  }, [initialStripe]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (isDraftDirty(turnstile)) {
      setTurnstile((current) =>
        current.expanded ? current : { ...current, expanded: true },
      );
    }
  }, [turnstile.clientId, turnstile.clientSecret, turnstile.enabled, turnstile.status]);

  useEffect(() => {
    if (isDraftDirty(resend)) {
      setResend((current) =>
        current.expanded ? current : { ...current, expanded: true },
      );
    }
  }, [resend.clientId, resend.replyToEmail, resend.clientSecret, resend.enabled, resend.status]);

  useEffect(() => {
    if (isDraftDirty(umami)) {
      setUmami((current) =>
        current.expanded ? current : { ...current, expanded: true },
      );
    }
  }, [umami.clientId, umami.clientSecret, umami.enabled, umami.status]);

  useEffect(() => {
    if (isDraftDirty(sentry)) {
      setSentry((current) =>
        current.expanded ? current : { ...current, expanded: true },
      );
    }
  }, [sentry.clientId, sentry.clientSecret, sentry.enabled, sentry.status]);

  useEffect(() => {
    if (isDraftDirty(stripe, true)) {
      setStripe((current) =>
        current.expanded ? current : { ...current, expanded: true },
      );
    }
  }, [
    stripe.clientId,
    stripe.clientSecret,
    stripe.replyToEmail,
    stripe.enabled,
    stripe.status,
  ]);

  function draftFor(kind: ApiIntegrationKind) {
    if (kind === "turnstile") return turnstile;
    if (kind === "resend") return resend;
    if (kind === "umami") return umami;
    if (kind === "sentry") return sentry;
    return stripe;
  }

  function setDraft(kind: ApiIntegrationKind, updater: (current: DraftState) => DraftState) {
    if (kind === "turnstile") setTurnstile(updater);
    else if (kind === "resend") setResend(updater);
    else if (kind === "umami") setUmami(updater);
    else if (kind === "sentry") setSentry(updater);
    else setStripe(updater);
  }

  function integrationKey(kind: ApiIntegrationKind) {
    if (kind === "turnstile") return SITE_INTEGRATION_KEYS.turnstile;
    if (kind === "resend") return SITE_INTEGRATION_KEYS.resend;
    if (kind === "umami") return SITE_INTEGRATION_KEYS.umami;
    if (kind === "sentry") return SITE_INTEGRATION_KEYS.sentry;
    return SITE_INTEGRATION_KEYS.stripe;
  }

  function handleSave(kind: ApiIntegrationKind, event: React.FormEvent) {
    event.preventDefault();
    clearFeedback();
    const draft = draftFor(kind);
    startTransition(async () => {
      setPendingKey(`${kind}-save`);
      const result = await saveSimpleIntegrationCredentialsAction(integrationKey(kind), {
        clientId: draft.clientId,
        clientSecret: draft.clientSecret,
        replyToEmail: kind === "resend" || kind === "stripe" ? draft.replyToEmail : undefined,
      });
      setPendingKey(null);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      showFeedback({
        type: "success",
        text: t(
          `integrations.${kind}.feedback.credentials_saved`,
          "Integrācijas dati saglabāti.",
        ),
      });
      router.refresh();
    });
  }

  function handleEnabledToggle(kind: ApiIntegrationKind, nextEnabled: boolean) {
    const draft = draftFor(kind);
    if (!draft.status.configured) return;
    clearFeedback();
    setDraft(kind, (current) => ({ ...current, enabled: nextEnabled }));
    startTransition(async () => {
      setPendingKey(`${kind}-enabled`);
      const result = await setSimpleIntegrationEnabledAction(
        integrationKey(kind),
        nextEnabled,
      );
      setPendingKey(null);
      if (!result.ok) {
        setDraft(kind, (current) => ({
          ...current,
          enabled: current.status.enabled,
        }));
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
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

  function handleReset() {
    if (!resetTarget) return;
    const kind = resetTarget;
    clearFeedback();
    startTransition(async () => {
      setPendingKey(`${kind}-reset`);
      const result = await resetSimpleIntegrationAction(integrationKey(kind));
      setPendingKey(null);
      setResetTarget(null);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      showFeedback({
        type: "success",
        text: t(`integrations.${kind}.feedback.reset`, "Integrācijas konfigurācija notīrīta."),
      });
      router.refresh();
    });
  }

  function renderFields(kind: ApiIntegrationKind) {
    const draft = draftFor(kind);
    const credentialsDirty =
      draft.clientId.trim() !== draft.status.clientId ||
      draft.replyToEmail.trim() !== draft.status.replyToEmail ||
      draft.clientSecret.trim().length > 0;

    if (kind === "turnstile") {
      return (
        <form onSubmit={(event) => handleSave("turnstile", event)} className="space-y-4">
          <div>
            <label
              htmlFor="turnstile-site-key"
              className="block text-sm font-medium text-zinc-700"
            >
              {t("integrations.turnstile.site_key", "Site Key")}
            </label>
            <input
              id="turnstile-site-key"
              value={draft.clientId}
              onChange={(event) => {
                setTurnstile((current) => ({ ...current, clientId: event.target.value }));
                clearFeedback();
              }}
              disabled={isBusy}
              placeholder="0x4AAAAAAA…"
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition placeholder:font-sans placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              {t(
                "integrations.turnstile.site_key_hint",
                "Publiskā atslēga no Cloudflare Turnstile. Tā tiek rādīta login un reģistrācijas lapās.",
              )}
            </p>
          </div>
          <div>
            <label
              htmlFor="turnstile-secret-key"
              className="block text-sm font-medium text-zinc-700"
            >
              {t("integrations.turnstile.secret_key", "Secret Key")}
            </label>
            <input
              id="turnstile-secret-key"
              type="password"
              value={draft.clientSecret}
              onChange={(event) => {
                setTurnstile((current) => ({
                  ...current,
                  clientSecret: event.target.value,
                }));
                clearFeedback();
              }}
              disabled={isBusy}
              placeholder={
                draft.status.hasClientSecret
                  ? t(
                      "integrations.turnstile.secret_key_placeholder_saved",
                      "Saglabāts — atstāj tukšu, ja nemaina",
                    )
                  : t("integrations.turnstile.secret_key_placeholder", "0x4AAAAAAA…")
              }
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition placeholder:font-sans placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <p className="text-xs text-zinc-500">
            {t(
              "integrations.turnstile.hint",
              "Kad integrācija ir aktīva, e-pasta reģistrācija un Google ienākšana bez komandas prasa Cloudflare Turnstile pārbaudi.",
            )}
          </p>
          {renderFooter("turnstile", credentialsDirty)}
        </form>
      );
    }

    if (kind === "resend") {
      return (
        <form onSubmit={(event) => handleSave("resend", event)} className="space-y-4">
          <div>
            <label
              htmlFor="resend-from-email"
              className="block text-sm font-medium text-zinc-700"
            >
              {t("integrations.resend.from_email", "From e-pasts")}
            </label>
            <input
              id="resend-from-email"
              value={draft.clientId}
              onChange={(event) => {
                setResend((current) => ({ ...current, clientId: event.target.value }));
                clearFeedback();
              }}
              disabled={isBusy}
              placeholder="no-reply@your-domain.com"
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              {t(
                "integrations.resend.from_hint",
                "No šīs adreses sistēma sūta vēstules. Tai jābūt verificētā Resend domēnā.",
              )}
            </p>
          </div>
          <div>
            <label
              htmlFor="resend-reply-to"
              className="block text-sm font-medium text-zinc-700"
            >
              {t("integrations.resend.reply_to", "Reply-To e-pasts")}
            </label>
            <input
              id="resend-reply-to"
              type="email"
              value={draft.replyToEmail}
              onChange={(event) => {
                setResend((current) => ({ ...current, replyToEmail: event.target.value }));
                clearFeedback();
              }}
              disabled={isBusy}
              placeholder="hello@gmail.com"
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              {t(
                "integrations.resend.reply_to_hint",
                "Atbildes uz vēstulēm iet uz šo adresi. Var būt Gmail vai cita publiska pastkaste.",
              )}
            </p>
          </div>
          <div>
            <label
              htmlFor="resend-api-key"
              className="block text-sm font-medium text-zinc-700"
            >
              {t("integrations.resend.api_key", "API Key")}
            </label>
            <input
              id="resend-api-key"
              type="password"
              value={draft.clientSecret}
              onChange={(event) => {
                setResend((current) => ({
                  ...current,
                  clientSecret: event.target.value,
                }));
                clearFeedback();
              }}
              disabled={isBusy}
              placeholder={
                draft.status.hasClientSecret
                  ? t(
                      "integrations.resend.api_key_placeholder_saved",
                      "Saglabāts — atstāj tukšu, ja nemaina",
                    )
                  : t("integrations.resend.api_key_placeholder", "re_…")
              }
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition placeholder:font-sans placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <p className="text-xs text-zinc-500">
            {t(
              "integrations.resend.hint",
              "From adresei jābūt verificētā Resend domēnā. Reply-To var būt Gmail, lai atbildes nonāktu tavā pastkastē.",
            )}
          </p>
          {renderFooter("resend", credentialsDirty)}
        </form>
      );
    }

    if (kind === "umami") {
      return (
        <form onSubmit={(event) => handleSave("umami", event)} className="space-y-4">
          <div>
            <label
              htmlFor="umami-website-id"
              className="block text-sm font-medium text-zinc-700"
            >
              {t("integrations.umami.website_id", "Website ID")}
            </label>
            <input
              id="umami-website-id"
              value={draft.clientId}
              onChange={(event) => {
                setUmami((current) => ({ ...current, clientId: event.target.value }));
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
              htmlFor="umami-script-url"
              className="block text-sm font-medium text-zinc-700"
            >
              {t("integrations.umami.script_url", "Script URL")}
            </label>
            <input
              id="umami-script-url"
              value={draft.clientSecret}
              onChange={(event) => {
                setUmami((current) => ({
                  ...current,
                  clientSecret: event.target.value,
                }));
                clearFeedback();
              }}
              disabled={isBusy}
              placeholder={
                draft.status.hasClientSecret
                  ? t(
                      "integrations.umami.script_url_placeholder_saved",
                      "Saglabāts — atstāj tukšu, ja nemaina",
                    )
                  : DEFAULT_UMAMI_SCRIPT_URL
              }
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition placeholder:font-sans placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <p className="text-xs text-zinc-500">
            {t(
              "integrations.umami.hint",
              "Kad integrācija ir aktīva un lietotājs piekrīt statistikas sīkdatnēm, Umami skripts tiek ielādēts lapas head daļā.",
            )}
          </p>
          {renderFooter("umami", credentialsDirty)}
        </form>
      );
    }

    if (kind === "stripe") {
      const webhookUrl = stripeWebhookUrl();
      return (
        <form onSubmit={(event) => handleSave("stripe", event)} className="space-y-4">
          <div>
            <label
              htmlFor="stripe-publishable-key"
              className="block text-sm font-medium text-zinc-700"
            >
              {t("integrations.stripe.publishable_key", "Publishable key")}
            </label>
            <input
              id="stripe-publishable-key"
              value={draft.clientId}
              onChange={(event) => {
                setStripe((current) => ({ ...current, clientId: event.target.value }));
                clearFeedback();
              }}
              disabled={isBusy}
              placeholder={t(
                "integrations.stripe.publishable_key_placeholder",
                "pk_live_… vai pk_test_…",
              )}
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition placeholder:font-sans placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              {t(
                "integrations.stripe.publishable_hint",
                "Publiskā atslēga no Stripe Dashboard. Sākas ar pk_.",
              )}
            </p>
          </div>
          <div>
            <label
              htmlFor="stripe-secret-key"
              className="block text-sm font-medium text-zinc-700"
            >
              {t("integrations.stripe.secret_key", "Secret key")}
            </label>
            <input
              id="stripe-secret-key"
              type="password"
              value={draft.clientSecret}
              onChange={(event) => {
                setStripe((current) => ({
                  ...current,
                  clientSecret: event.target.value,
                }));
                clearFeedback();
              }}
              disabled={isBusy}
              placeholder={
                draft.status.hasClientSecret
                  ? t(
                      "integrations.stripe.secret_key_placeholder_saved",
                      "Saglabāts — atstāj tukšu, ja nemaina",
                    )
                  : t("integrations.stripe.secret_key_placeholder", "sk_live_… vai sk_test_…")
              }
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition placeholder:font-sans placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label
              htmlFor="stripe-webhook-secret"
              className="block text-sm font-medium text-zinc-700"
            >
              {t("integrations.stripe.webhook_secret", "Webhook signing secret")}
            </label>
            <input
              id="stripe-webhook-secret"
              type="password"
              value={draft.replyToEmail}
              onChange={(event) => {
                setStripe((current) => ({
                  ...current,
                  replyToEmail: event.target.value,
                }));
                clearFeedback();
              }}
              disabled={isBusy}
              placeholder={
                draft.status.hasWebhookSecret
                  ? t(
                      "integrations.stripe.webhook_secret_placeholder_saved",
                      "Saglabāts — atstāj tukšu, ja nemaina",
                    )
                  : t("integrations.stripe.webhook_secret_placeholder", "whsec_…")
              }
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition placeholder:font-sans placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              {t(
                "integrations.stripe.webhook_url_hint",
                "Stripe Dashboard webhook URL: {url}",
                { url: webhookUrl },
              )}
            </p>
          </div>
          <p className="text-xs text-zinc-500">
            {t(
              "integrations.stripe.hint",
              "Kad integrācija ir aktīva, komandas maksā par vietām Stripe Checkout un abonementā. Webhook notikumi: checkout.session.completed, invoice.created, invoice.paid, invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted.",
            )}
          </p>
          {renderFooter("stripe", credentialsDirty)}
        </form>
      );
    }

    return (
      <form onSubmit={(event) => handleSave("sentry", event)} className="space-y-4">
        <div>
          <label
            htmlFor="sentry-environment"
            className="block text-sm font-medium text-zinc-700"
          >
            {t("integrations.sentry.environment", "Environment")}
          </label>
          <input
            id="sentry-environment"
            value={draft.clientId}
            onChange={(event) => {
              setSentry((current) => ({ ...current, clientId: event.target.value }));
              clearFeedback();
            }}
            disabled={isBusy}
            placeholder="production"
            className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div>
          <label htmlFor="sentry-dsn" className="block text-sm font-medium text-zinc-700">
            {t("integrations.sentry.dsn", "DSN")}
          </label>
          <input
            id="sentry-dsn"
            type="password"
            value={draft.clientSecret}
            onChange={(event) => {
              setSentry((current) => ({
                ...current,
                clientSecret: event.target.value,
              }));
              clearFeedback();
            }}
            disabled={isBusy}
            placeholder={
              draft.status.hasClientSecret
                ? t(
                    "integrations.sentry.dsn_placeholder_saved",
                    "Saglabāts — atstāj tukšu, ja nemaina",
                  )
                : "https://…@….ingest.sentry.io/…"
            }
            className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition placeholder:font-sans placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <p className="text-xs text-zinc-500">
          {t(
            "integrations.sentry.hint",
            "Kad integrācija ir aktīva, pārlūkā inicializējas Sentry kļūdu uzskaite.",
          )}
        </p>
        {renderFooter("sentry", credentialsDirty)}
      </form>
    );
  }

  function renderFooter(kind: ApiIntegrationKind, credentialsDirty: boolean) {
    const draft = draftFor(kind);
    return (
      <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4">
        {draft.status.configured ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => setResetTarget(kind)}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t(`integrations.${kind}.reset`, "Notīrīt konfigurāciju")}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isBusy || !credentialsDirty}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingKey === `${kind}-save` ? (
            <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
          ) : null}
          {t("actions.save", "Saglabāt")}
        </button>
      </div>
    );
  }

  const resetTitle =
    resetTarget === "turnstile"
      ? t("integrations.turnstile.reset.confirm_title", "Notīrīt Turnstile konfigurāciju?")
      : resetTarget === "resend"
      ? t("integrations.resend.reset.confirm_title", "Notīrīt Resend konfigurāciju?")
      : resetTarget === "umami"
        ? t("integrations.umami.reset.confirm_title", "Notīrīt Umami konfigurāciju?")
        : resetTarget === "stripe"
          ? t("integrations.stripe.reset.confirm_title", "Notīrīt Stripe konfigurāciju?")
          : t("integrations.sentry.reset.confirm_title", "Notīrīt Sentry konfigurāciju?");

  const resetDescription =
    resetTarget === "turnstile"
      ? t(
          "integrations.turnstile.reset.confirm_description",
          "Atslēgas tiks dzēstas un botu pārbaude login/reģistrācijā tiks izslēgta.",
        )
      : resetTarget === "resend"
      ? t(
          "integrations.resend.reset.confirm_description",
          "API atslēga tiks dzēsta un e-pastu sūtīšana caur Resend tiks izslēgta.",
        )
      : resetTarget === "umami"
        ? t(
            "integrations.umami.reset.confirm_description",
            "Website ID tiks dzēsts un Umami skripts vairs netiks ielādēts.",
          )
        : resetTarget === "stripe"
          ? t(
              "integrations.stripe.reset.confirm_description",
              "Stripe atslēgas tiks dzēstas un vietu norēķini tiks izslēgti.",
            )
          : t(
              "integrations.sentry.reset.confirm_description",
              "DSN tiks dzēsts un Sentry kļūdu uzskaite tiks izslēgta.",
            );

  return (
    <>
      <AdminIntegrationCard
        panelId="turnstile"
        title={t("integrations.turnstile.title", "Cloudflare Turnstile")}
        description={t(
          "integrations.turnstile.description",
          "Botu pārbaude e-pasta reģistrācijā un Google ienākšanā, ja vēl nav komandas.",
        )}
        configured={turnstile.status.configured}
        expanded={turnstile.expanded}
        onExpandedChange={(expanded) =>
          setTurnstile((current) => ({ ...current, expanded }))
        }
        enabled={turnstile.enabled}
        onEnabledChange={(enabled) => handleEnabledToggle("turnstile", enabled)}
        enabledAriaLabel={t(
          "integrations.turnstile.aria.enabled",
          "Turnstile integrācija ieslēgta",
        )}
        isBusy={isBusy}
      >
        {renderFields("turnstile")}
      </AdminIntegrationCard>

      <AdminIntegrationCard
        panelId="resend"
        title={t("integrations.resend.title", "Resend")}
        description={t(
          "integrations.resend.description",
          "Transakciju e-pasti caur Resend API.",
        )}
        configured={resend.status.configured}
        expanded={resend.expanded}
        onExpandedChange={(expanded) =>
          setResend((current) => ({ ...current, expanded }))
        }
        enabled={resend.enabled}
        onEnabledChange={(enabled) => handleEnabledToggle("resend", enabled)}
        enabledAriaLabel={t(
          "integrations.resend.aria.enabled",
          "Resend integrācija ieslēgta",
        )}
        isBusy={isBusy}
      >
        {renderFields("resend")}
      </AdminIntegrationCard>

      <AdminIntegrationCard
        panelId="umami"
        title={t("integrations.umami.title", "Umami")}
        description={t(
          "integrations.umami.description",
          "Anonīma lapu statistika. Aktīvam skripts tiek ielādēts head daļā pēc statistikas piekrišanas.",
        )}
        configured={umami.status.configured}
        expanded={umami.expanded}
        onExpandedChange={(expanded) =>
          setUmami((current) => ({ ...current, expanded }))
        }
        enabled={umami.enabled}
        onEnabledChange={(enabled) => handleEnabledToggle("umami", enabled)}
        enabledAriaLabel={t(
          "integrations.umami.aria.enabled",
          "Umami integrācija ieslēgta",
        )}
        isBusy={isBusy}
      >
        {renderFields("umami")}
      </AdminIntegrationCard>

      <AdminIntegrationCard
        panelId="sentry"
        title={t("integrations.sentry.title", "Sentry")}
        description={t(
          "integrations.sentry.description",
          "Kļūdu un izņēmumu uzskaite pārlūkā caur sentry.io.",
        )}
        configured={sentry.status.configured}
        expanded={sentry.expanded}
        onExpandedChange={(expanded) =>
          setSentry((current) => ({ ...current, expanded }))
        }
        enabled={sentry.enabled}
        onEnabledChange={(enabled) => handleEnabledToggle("sentry", enabled)}
        enabledAriaLabel={t(
          "integrations.sentry.aria.enabled",
          "Sentry integrācija ieslēgta",
        )}
        isBusy={isBusy}
      >
        {renderFields("sentry")}
      </AdminIntegrationCard>

      <AdminIntegrationCard
        panelId="stripe"
        title={t("integrations.stripe.title", "Stripe")}
        description={t(
          "integrations.stripe.description",
          "Vietu norēķini: viena komandas abonements, jaunie lietotāji pēc samaksas.",
        )}
        configured={stripe.status.configured}
        expanded={stripe.expanded}
        onExpandedChange={(expanded) =>
          setStripe((current) => ({ ...current, expanded }))
        }
        enabled={stripe.enabled}
        onEnabledChange={(enabled) => handleEnabledToggle("stripe", enabled)}
        enabledAriaLabel={t(
          "integrations.stripe.aria.enabled",
          "Stripe integrācija ieslēgta",
        )}
        isBusy={isBusy}
      >
        {renderFields("stripe")}
      </AdminIntegrationCard>

      <ConfirmModal
        open={resetTarget !== null}
        onOpenChange={(open) => {
          if (!open) setResetTarget(null);
        }}
        title={resetTitle}
        description={resetDescription}
        confirmLabel={
          resetTarget
            ? t(`integrations.${resetTarget}.reset`, "Notīrīt konfigurāciju")
            : t("actions.delete", "Dzēst")
        }
        confirmVariant="danger"
        blocking={pendingKey?.endsWith("-reset") === true}
        onConfirm={handleReset}
      />
    </>
  );
}
