import { interpolate } from "@/app/lib/i18n/interpolate";
import { sendResendEmail } from "@/app/lib/integrations/resend/client";
import {
  getSiteSettings,
  getSiteTranslationDictionary,
  listSiteLanguages,
} from "@/app/lib/site-admin/repository";
import { logError } from "@/app/lib/security/log-error";
import { buildEmailHtml } from "@/app/lib/email/build-email-html";
import {
  FALLBACK_TEMPLATES,
  TEMPLATE_KEYS,
  fallbackButton,
  fallbackFooter,
  fallbackFor,
  type EmailTemplateKind,
} from "@/app/lib/email/templates";

export type EmailTemplateParams = Record<string, string>;

export async function resolveEmailLanguageCode(
  languageCode?: string | null,
): Promise<string> {
  const languages = await listSiteLanguages();
  const requested = languageCode?.trim().toLowerCase() ?? "";
  if (requested && languages.some((language) => language.code === requested)) {
    return requested;
  }
  return (
    languages.find((language) => language.isDefault)?.code ??
    languages[0]?.code ??
    "lv"
  );
}

export async function sendTemplatedEmail(input: {
  kind: EmailTemplateKind;
  to: string;
  languageCode?: string | null;
  params: EmailTemplateParams;
  heading?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.to.trim().toLowerCase();
  if (!email) {
    return { ok: false, error: "errors.email_invalid" };
  }

  const link = input.params.link?.trim() ?? "";
  if (!link) {
    return { ok: false, error: "errors.email_link_missing" };
  }

  const [settings, lang] = await Promise.all([
    getSiteSettings(),
    resolveEmailLanguageCode(input.languageCode),
  ]);
  const systemName = settings.systemName.trim() || "Routine";
  const params: EmailTemplateParams = {
    name: email.split("@")[0] || email,
    team: systemName,
    title: systemName,
    message: "",
    inviter: "",
    ...input.params,
    system: input.params.system?.trim() || systemName,
    link,
  };

  const dictionary = await getSiteTranslationDictionary(lang);
  const keys = TEMPLATE_KEYS[input.kind];
  const fallback = FALLBACK_TEMPLATES[input.kind];
  const subject = interpolate(
    dictionary[keys.subjectKey]?.trim() || fallbackFor(input.kind, lang, "subject"),
    params,
  );
  const body = interpolate(
    dictionary[keys.bodyKey]?.trim() || fallbackFor(input.kind, lang, "body"),
    params,
  );
  const buttonLabel = interpolate(
    dictionary[keys.buttonKey]?.trim() || fallbackButton(input.kind, lang),
    params,
  );
  const footerHint = interpolate(
    dictionary["email.footer_hint"]?.trim() || fallbackFooter(lang),
    params,
  );

  const html = buildEmailHtml({
    systemName,
    heading: input.heading?.trim() || params.team || systemName,
    bodyText: body,
    buttonLabel,
    actionLink: link,
    footerHint,
  });
  const text = `${body}\n\n${buttonLabel}:\n${link}\n`;

  const sent = await sendResendEmail({
    to: email,
    subject: subject || fallback.subject.lv,
    html,
    text,
  });

  if (!sent.ok) {
    logError("sendTemplatedEmail failed", sent.error);
    return { ok: false, error: sent.error };
  }

  return { ok: true };
}
