export type EmailTemplateKind =
  | "signup"
  | "password_reset"
  | "invite"
  | "notification";

export type EmailTemplateDraft = {
  kind: EmailTemplateKind;
  subjectKey: string;
  bodyKey: string;
  buttonKey: string;
  subjects: Record<string, string>;
  bodies: Record<string, string>;
  buttons: Record<string, string>;
};

export const EMAIL_TEMPLATE_KINDS: EmailTemplateKind[] = [
  "signup",
  "password_reset",
  "invite",
  "notification",
];

export const TEMPLATE_KEYS: Record<
  EmailTemplateKind,
  { subjectKey: string; bodyKey: string; buttonKey: string }
> = {
  signup: {
    subjectKey: "email.signup.subject",
    bodyKey: "email.signup.body",
    buttonKey: "email.signup.button",
  },
  password_reset: {
    subjectKey: "email.password_reset.subject",
    bodyKey: "email.password_reset.body",
    buttonKey: "email.password_reset.button",
  },
  invite: {
    subjectKey: "email.invite.subject",
    bodyKey: "email.invite.body",
    buttonKey: "email.invite.button",
  },
  notification: {
    subjectKey: "email.notification.subject",
    bodyKey: "email.notification.body",
    buttonKey: "email.notification.button",
  },
};

type LangPack = { lv: string; en: string; ru: string };

export const BUTTON_FALLBACK: Record<EmailTemplateKind, LangPack> = {
  signup: {
    lv: "Apstiprināt e-pastu",
    en: "Confirm email",
    ru: "Подтвердить e-mail",
  },
  password_reset: {
    lv: "Atjaunot paroli",
    en: "Reset password",
    ru: "Сбросить пароль",
  },
  invite: {
    lv: "Pievienoties komandai",
    en: "Join the team",
    ru: "Присоединиться к команде",
  },
  notification: {
    lv: "Atvērt",
    en: "Open",
    ru: "Открыть",
  },
};

export const FOOTER_FALLBACK: LangPack = {
  lv: "Ja poga nedarbojas, atver šo saiti pārlūkā:",
  en: "If the button does not work, open this link in your browser:",
  ru: "Если кнопка не работает, откройте эту ссылку в браузере:",
};

export const FALLBACK_TEMPLATES: Record<
  EmailTemplateKind,
  { subject: LangPack; body: LangPack }
> = {
  signup: {
    subject: {
      lv: "Apstiprini e-pastu — {system}",
      en: "Confirm your email — {system}",
      ru: "Подтвердите e-mail — {system}",
    },
    body: {
      lv: "Sveiki, {name}!\n\nPaldies, ka reģistrējies sistēmā {system}.\n\nNospied pogu zemāk, lai apstiprinātu e-pastu un aktivizētu kontu.",
      en: "Hello, {name}!\n\nThanks for signing up to {system}.\n\nPress the button below to confirm your email and activate your account.",
      ru: "Здравствуйте, {name}!\n\nСпасибо за регистрацию в {system}.\n\nНажмите кнопку ниже, чтобы подтвердить e-mail и активировать аккаунт.",
    },
  },
  password_reset: {
    subject: {
      lv: "Atjauno paroli — {system}",
      en: "Reset your password — {system}",
      ru: "Сброс пароля — {system}",
    },
    body: {
      lv: "Sveiki, {name}!\n\nSaņēmām pieprasījumu atjaunot paroli sistēmā {system}.\n\nNospied pogu zemāk, lai izvēlētos jaunu paroli. Ja tu to nepieprasīji, vari ignorēt šo e-pastu.",
      en: "Hello, {name}!\n\nWe received a request to reset your password for {system}.\n\nPress the button below to choose a new password. If you did not request this, you can ignore this email.",
      ru: "Здравствуйте, {name}!\n\nМы получили запрос на сброс пароля в {system}.\n\nНажмите кнопку ниже, чтобы выбрать новый пароль. Если вы этого не запрашивали, просто проигнорируйте письмо.",
    },
  },
  invite: {
    subject: {
      lv: "Uzaicinājums komandai {team}",
      en: "Invitation to the {team} team",
      ru: "Приглашение в команду {team}",
    },
    body: {
      lv: "Sveiki, {name}!\n\n{inviter} uzaicina tevi pievienoties komandai „{team}” sistēmā {system}.\n\nNospied pogu zemāk, lai apstiprinātu uzaicinājumu.",
      en: "Hello, {name}!\n\n{inviter} invited you to join the team “{team}” in {system}.\n\nPress the button below to accept the invitation.",
      ru: "Здравствуйте, {name}!\n\n{inviter} приглашает вас присоединиться к команде «{team}» в {system}.\n\nНажмите кнопку ниже, чтобы принять приглашение.",
    },
  },
  notification: {
    subject: {
      lv: "{system}: {title}",
      en: "{system}: {title}",
      ru: "{system}: {title}",
    },
    body: {
      lv: "Sveiki, {name}!\n\n{message}\n\nNospied pogu zemāk, lai atvērtu ierakstu sistēmā {system}.",
      en: "Hello, {name}!\n\n{message}\n\nPress the button below to open this item in {system}.",
      ru: "Здравствуйте, {name}!\n\n{message}\n\nНажмите кнопку ниже, чтобы открыть запись в {system}.",
    },
  },
};

function packValue(pack: LangPack, languageCode: string): string {
  if (languageCode === "en") return pack.en;
  if (languageCode === "ru") return pack.ru;
  return pack.lv;
}

export function fallbackFor(
  kind: EmailTemplateKind,
  languageCode: string,
  part: "subject" | "body",
): string {
  return packValue(FALLBACK_TEMPLATES[kind][part], languageCode);
}

export function fallbackButton(
  kind: EmailTemplateKind,
  languageCode: string,
): string {
  return packValue(BUTTON_FALLBACK[kind], languageCode);
}

export function fallbackFooter(languageCode: string): string {
  return packValue(FOOTER_FALLBACK, languageCode);
}

export function emailTemplateHasButton(_kind: EmailTemplateKind): boolean {
  return true;
}
