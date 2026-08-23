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

type LangPack = Record<string, string>;

const EXTRA_BUTTON = {
  de: {
    signup: "E-Mail bestätigen",
    password_reset: "Passwort zurücksetzen",
    invite: "Dem Team beitreten",
    notification: "Öffnen",
  },
  fr: {
    signup: "Confirmer l'e-mail",
    password_reset: "Réinitialiser le mot de passe",
    invite: "Rejoindre l'équipe",
    notification: "Ouvrir",
  },
  es: {
    signup: "Confirmar correo",
    password_reset: "Restablecer contraseña",
    invite: "Unirse al equipo",
    notification: "Abrir",
  },
  nl: {
    signup: "E-mail bevestigen",
    password_reset: "Wachtwoord resetten",
    invite: "Lid worden van het team",
    notification: "Openen",
  },
  da: {
    signup: "Bekræft e-mail",
    password_reset: "Nulstil adgangskode",
    invite: "Tilslut dig teamet",
    notification: "Åbn",
  },
  no: {
    signup: "Bekreft e-post",
    password_reset: "Tilbakestill passord",
    invite: "Bli med i teamet",
    notification: "Åpne",
  },
  fi: {
    signup: "Vahvista sähköposti",
    password_reset: "Nollaa salasana",
    invite: "Liity tiimiin",
    notification: "Avaa",
  },
  pl: {
    signup: "Potwierdź e-mail",
    password_reset: "Zresetuj hasło",
    invite: "Dołącz do zespołu",
    notification: "Otwórz",
  },
  lt: {
    signup: "Patvirtinti el. paštą",
    password_reset: "Atkurti slaptažodį",
    invite: "Prisijungti prie komandos",
    notification: "Atidaryti",
  },
  et: {
    signup: "Kinnita e-post",
    password_reset: "Lähtesta parool",
    invite: "Liitu meeskonnaga",
    notification: "Ava",
  },
  it: {
    signup: "Conferma e-mail",
    password_reset: "Reimposta password",
    invite: "Unisciti al team",
    notification: "Apri",
  },
  sv: {
    signup: "Bekräfta e-post",
    password_reset: "Återställ lösenord",
    invite: "Gå med i teamet",
    notification: "Öppna",
  },
} as const;

function extraButtons(kind: EmailTemplateKind): Record<string, string> {
  return Object.fromEntries(
    Object.entries(EXTRA_BUTTON).map(([code, pack]) => [code, pack[kind]]),
  );
}

export const BUTTON_FALLBACK: Record<EmailTemplateKind, LangPack> = {
  signup: {
    lv: "Apstiprināt e-pastu",
    en: "Confirm email",
    ru: "Подтвердить e-mail",
    ...extraButtons("signup"),
  },
  password_reset: {
    lv: "Atjaunot paroli",
    en: "Reset password",
    ru: "Сбросить пароль",
    ...extraButtons("password_reset"),
  },
  invite: {
    lv: "Pievienoties komandai",
    en: "Join the team",
    ru: "Присоединиться к команде",
    ...extraButtons("invite"),
  },
  notification: {
    lv: "Atvērt",
    en: "Open",
    ru: "Открыть",
    ...extraButtons("notification"),
  },
};

export const FOOTER_FALLBACK: LangPack = {
  lv: "Ja poga nedarbojas, atver šo saiti pārlūkā:",
  en: "If the button does not work, open this link in your browser:",
  ru: "Если кнопка не работает, откройте эту ссылку в браузере:",
  de: "Wenn die Schaltfläche nicht funktioniert, öffne diesen Link im Browser:",
  fr: "Si le bouton ne fonctionne pas, ouvre ce lien dans ton navigateur :",
  es: "Si el botón no funciona, abre este enlace en el navegador:",
  nl: "Als de knop niet werkt, open deze link in je browser:",
  da: "Hvis knappen ikke virker, så åbn dette link i din browser:",
  no: "Hvis knappen ikke virker, åpne denne lenken i nettleseren:",
  fi: "Jos painike ei toimi, avaa tämä linkki selaimessa:",
  pl: "Jeśli przycisk nie działa, otwórz ten link w przeglądarce:",
  lt: "Jei mygtukas neveikia, atidaryk šią nuorodą naršyklėje:",
  et: "Kui nupp ei tööta, ava see link brauseris:",
  it: "Se il pulsante non funziona, apri questo link nel browser:",
  sv: "Om knappen inte fungerar, öppna den här länken i webbläsaren:",
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
      de: "Bestätige deine E-Mail — {system}",
      fr: "Confirme ton e-mail — {system}",
      es: "Confirma tu correo — {system}",
      nl: "Bevestig je e-mail — {system}",
      da: "Bekræft din e-mail — {system}",
      no: "Bekreft e-posten din — {system}",
      fi: "Vahvista sähköpostisi — {system}",
      pl: "Potwierdź e-mail — {system}",
      lt: "Patvirtink el. paštą — {system}",
      et: "Kinnita oma e-post — {system}",
      it: "Conferma la tua e-mail — {system}",
      sv: "Bekräfta din e-post — {system}",
    },
    body: {
      lv: "Sveiki, {name}!\n\nPaldies, ka reģistrējies sistēmā {system}.\n\nNospied pogu zemāk, lai apstiprinātu e-pastu un aktivizētu kontu.",
      en: "Hello, {name}!\n\nThanks for signing up to {system}.\n\nPress the button below to confirm your email and activate your account.",
      ru: "Здравствуйте, {name}!\n\nСпасибо за регистрацию в {system}.\n\nНажмите кнопку ниже, чтобы подтвердить e-mail и активировать аккаунт.",
      de: "Hallo, {name}!\n\nDanke, dass du dich bei {system} registriert hast.\n\nDrücke die Schaltfläche unten, um deine E-Mail zu bestätigen und das Konto zu aktivieren.",
      fr: "Bonjour {name} !\n\nMerci de t'être inscrit à {system}.\n\nAppuie sur le bouton ci-dessous pour confirmer ton e-mail et activer le compte.",
      es: "Hola, {name}!\n\nGracias por registrarte en {system}.\n\nPulsa el botón de abajo para confirmar tu correo y activar la cuenta.",
      nl: "Hallo, {name}!\n\nBedankt voor je registratie bij {system}.\n\nDruk op de knop hieronder om je e-mail te bevestigen en je account te activeren.",
      da: "Hej {name}!\n\nTak fordi du tilmeldte dig {system}.\n\nTryk på knappen nedenfor for at bekræfte din e-mail og aktivere kontoen.",
      no: "Hei, {name}!\n\nTakk for at du registrerte deg i {system}.\n\nTrykk på knappen nedenfor for å bekrefte e-posten og aktivere kontoen.",
      fi: "Hei {name}!\n\nKiitos, että rekisteröidyit palveluun {system}.\n\nPaina alla olevaa painiketta vahvistaaksesi sähköpostin ja aktivoidaksesi tilin.",
      pl: "Cześć, {name}!\n\nDziękujemy za rejestrację w {system}.\n\nNaciśnij przycisk poniżej, aby potwierdzić e-mail i aktywować konto.",
      lt: "Sveiki, {name}!\n\nAčiū, kad užsiregistravai sistemoje {system}.\n\nPaspausk mygtuką žemiau, kad patvirtintum el. paštą ir aktyvuotum paskyrą.",
      et: "Tere, {name}!\n\nAitäh, et registreerusid süsteemis {system}.\n\nVajuta allolevale nupule, et kinnitada e-post ja aktiveerida konto.",
      it: "Ciao, {name}!\n\nGrazie per esserti registrato su {system}.\n\nPremi il pulsante qui sotto per confermare l'e-mail e attivare l'account.",
      sv: "Hej {name}!\n\nTack för att du registrerade dig i {system}.\n\nTryck på knappen nedan för att bekräfta e-postadressen och aktivera kontot.",
    },
  },
  password_reset: {
    subject: {
      lv: "Atjauno paroli — {system}",
      en: "Reset your password — {system}",
      ru: "Сброс пароля — {system}",
      de: "Passwort zurücksetzen — {system}",
      fr: "Réinitialise ton mot de passe — {system}",
      es: "Restablece tu contraseña — {system}",
      nl: "Reset je wachtwoord — {system}",
      da: "Nulstil din adgangskode — {system}",
      no: "Tilbakestill passordet — {system}",
      fi: "Nollaa salasanasi — {system}",
      pl: "Zresetuj hasło — {system}",
      lt: "Atkurk slaptažodį — {system}",
      et: "Lähtesta parool — {system}",
      it: "Reimposta la password — {system}",
      sv: "Återställ ditt lösenord — {system}",
    },
    body: {
      lv: "Sveiki, {name}!\n\nSaņēmām pieprasījumu atjaunot paroli sistēmā {system}.\n\nNospied pogu zemāk, lai izvēlētos jaunu paroli. Ja tu to nepieprasīji, vari ignorēt šo e-pastu.",
      en: "Hello, {name}!\n\nWe received a request to reset your password for {system}.\n\nPress the button below to choose a new password. If you did not request this, you can ignore this email.",
      ru: "Здравствуйте, {name}!\n\nМы получили запрос на сброс пароля в {system}.\n\nНажмите кнопку ниже, чтобы выбрать новый пароль. Если вы этого не запрашивали, просто проигнорируйте письмо.",
      de: "Hallo, {name}!\n\nWir haben eine Anfrage erhalten, dein Passwort für {system} zurückzusetzen.\n\nDrücke die Schaltfläche unten, um ein neues Passwort zu wählen. Wenn du das nicht angefordert hast, kannst du diese E-Mail ignorieren.",
      fr: "Bonjour {name} !\n\nNous avons reçu une demande de réinitialisation du mot de passe pour {system}.\n\nAppuie sur le bouton ci-dessous pour choisir un nouveau mot de passe. Si tu n'as pas fait cette demande, tu peux ignorer cet e-mail.",
      es: "Hola, {name}!\n\nHemos recibido una solicitud para restablecer tu contraseña de {system}.\n\nPulsa el botón de abajo para elegir una nueva contraseña. Si no lo pediste, puedes ignorar este correo.",
      nl: "Hallo, {name}!\n\nWe hebben een verzoek ontvangen om je wachtwoord voor {system} te resetten.\n\nDruk op de knop hieronder om een nieuw wachtwoord te kiezen. Als jij dit niet hebt gevraagd, kun je deze e-mail negeren.",
      da: "Hej {name}!\n\nVi har modtaget en anmodning om at nulstille din adgangskode til {system}.\n\nTryk på knappen nedenfor for at vælge en ny adgangskode. Hvis du ikke har bedt om det, kan du ignorere denne e-mail.",
      no: "Hei, {name}!\n\nVi har mottatt en forespørsel om å tilbakestille passordet ditt for {system}.\n\nTrykk på knappen nedenfor for å velge et nytt passord. Hvis du ikke ba om dette, kan du ignorere e-posten.",
      fi: "Hei {name}!\n\nSaimme pyynnön nollata salasanasi palvelussa {system}.\n\nPaina alla olevaa painiketta valitaksesi uuden salasanan. Jos et pyytänyt tätä, voit ohittaa viestin.",
      pl: "Cześć, {name}!\n\nOtrzymaliśmy prośbę o zresetowanie hasła w {system}.\n\nNaciśnij przycisk poniżej, aby wybrać nowe hasło. Jeśli tego nie prosiłeś, zignoruj tę wiadomość.",
      lt: "Sveiki, {name}!\n\nGavome prašymą atkurti slaptažodį sistemoje {system}.\n\nPaspausk mygtuką žemiau, kad pasirinktum naują slaptažodį. Jei to neprašei, šį laišką gali ignoruoti.",
      et: "Tere, {name}!\n\nSaime taotluse lähtestada parool süsteemis {system}.\n\nVajuta allolevale nupule, et valida uus parool. Kui sa seda ei taotlenud, võid kirja eirata.",
      it: "Ciao, {name}!\n\nAbbiamo ricevuto una richiesta per reimpostare la password di {system}.\n\nPremi il pulsante qui sotto per scegliere una nuova password. Se non l'hai richiesta tu, puoi ignorare questa e-mail.",
      sv: "Hej {name}!\n\nVi har fått en begäran om att återställa ditt lösenord för {system}.\n\nTryck på knappen nedan för att välja ett nytt lösenord. Om du inte begärde detta kan du ignorera mejlet.",
    },
  },
  invite: {
    subject: {
      lv: "Uzaicinājums komandai {team}",
      en: "Invitation to the {team} team",
      ru: "Приглашение в команду {team}",
      de: "Einladung zum Team {team}",
      fr: "Invitation à l'équipe {team}",
      es: "Invitación al equipo {team}",
      nl: "Uitnodiging voor het team {team}",
      da: "Invitation til teamet {team}",
      no: "Invitasjon til teamet {team}",
      fi: "Kutsu tiimiin {team}",
      pl: "Zaproszenie do zespołu {team}",
      lt: "Kvietimas į komandą {team}",
      et: "Kutse meeskonda {team}",
      it: "Invito al team {team}",
      sv: "Inbjudan till teamet {team}",
    },
    body: {
      lv: "Sveiki, {name}!\n\n{inviter} uzaicina tevi pievienoties komandai „{team}” sistēmā {system}.\n\nNospied pogu zemāk, lai apstiprinātu uzaicinājumu.",
      en: "Hello, {name}!\n\n{inviter} invited you to join the team “{team}” in {system}.\n\nPress the button below to accept the invitation.",
      ru: "Здравствуйте, {name}!\n\n{inviter} приглашает вас присоединиться к команде «{team}» в {system}.\n\nНажмите кнопку ниже, чтобы принять приглашение.",
      de: "Hallo, {name}!\n\n{inviter} lädt dich ein, dem Team „{team}“ in {system} beizutreten.\n\nDrücke die Schaltfläche unten, um die Einladung anzunehmen.",
      fr: "Bonjour {name} !\n\n{inviter} t'invite à rejoindre l'équipe « {team} » dans {system}.\n\nAppuie sur le bouton ci-dessous pour accepter l'invitation.",
      es: "Hola, {name}!\n\n{inviter} te invita a unirte al equipo “{team}” en {system}.\n\nPulsa el botón de abajo para aceptar la invitación.",
      nl: "Hallo, {name}!\n\n{inviter} nodigt je uit om lid te worden van het team “{team}” in {system}.\n\nDruk op de knop hieronder om de uitnodiging te accepteren.",
      da: "Hej {name}!\n\n{inviter} inviterer dig til at slutte dig til teamet „{team}” i {system}.\n\nTryk på knappen nedenfor for at acceptere invitationen.",
      no: "Hei, {name}!\n\n{inviter} inviterer deg til å bli med i teamet «{team}» i {system}.\n\nTrykk på knappen nedenfor for å godta invitasjonen.",
      fi: "Hei {name}!\n\n{inviter} kutsuu sinut liittymään tiimiin ”{team}” palvelussa {system}.\n\nPaina alla olevaa painiketta hyväksyäksesi kutsun.",
      pl: "Cześć, {name}!\n\n{inviter} zaprasza Cię do zespołu „{team}” w {system}.\n\nNaciśnij przycisk poniżej, aby przyjąć zaproszenie.",
      lt: "Sveiki, {name}!\n\n{inviter} kviečia tave prisijungti prie komandos „{team}” sistemoje {system}.\n\nPaspausk mygtuką žemiau, kad patvirtintum kvietimą.",
      et: "Tere, {name}!\n\n{inviter} kutsub sind liituma meeskonnaga „{team}” süsteemis {system}.\n\nVajuta allolevale nupule, et kutse vastu võtta.",
      it: "Ciao, {name}!\n\n{inviter} ti invita a unirti al team “{team}” in {system}.\n\nPremi il pulsante qui sotto per accettare l'invito.",
      sv: "Hej {name}!\n\n{inviter} bjuder in dig att gå med i teamet ”{team}” i {system}.\n\nTryck på knappen nedan för att acceptera inbjudan.",
    },
  },
  notification: {
    subject: {
      lv: "{system}: {title}",
      en: "{system}: {title}",
      ru: "{system}: {title}",
      de: "{system}: {title}",
      fr: "{system} : {title}",
      es: "{system}: {title}",
      nl: "{system}: {title}",
      da: "{system}: {title}",
      no: "{system}: {title}",
      fi: "{system}: {title}",
      pl: "{system}: {title}",
      lt: "{system}: {title}",
      et: "{system}: {title}",
      it: "{system}: {title}",
      sv: "{system}: {title}",
    },
    body: {
      lv: "Sveiki, {name}!\n\n{message}\n\nNospied pogu zemāk, lai atvērtu ierakstu sistēmā {system}.",
      en: "Hello, {name}!\n\n{message}\n\nPress the button below to open this item in {system}.",
      ru: "Здравствуйте, {name}!\n\n{message}\n\nНажмите кнопку ниже, чтобы открыть запись в {system}.",
      de: "Hallo, {name}!\n\n{message}\n\nDrücke die Schaltfläche unten, um den Eintrag in {system} zu öffnen.",
      fr: "Bonjour {name} !\n\n{message}\n\nAppuie sur le bouton ci-dessous pour ouvrir l'élément dans {system}.",
      es: "Hola, {name}!\n\n{message}\n\nPulsa el botón de abajo para abrir este elemento en {system}.",
      nl: "Hallo, {name}!\n\n{message}\n\nDruk op de knop hieronder om dit item in {system} te openen.",
      da: "Hej {name}!\n\n{message}\n\nTryk på knappen nedenfor for at åbne elementet i {system}.",
      no: "Hei, {name}!\n\n{message}\n\nTrykk på knappen nedenfor for å åpne oppføringen i {system}.",
      fi: "Hei {name}!\n\n{message}\n\nPaina alla olevaa painiketta avataksesi kohteen palvelussa {system}.",
      pl: "Cześć, {name}!\n\n{message}\n\nNaciśnij przycisk poniżej, aby otworzyć wpis w {system}.",
      lt: "Sveiki, {name}!\n\n{message}\n\nPaspausk mygtuką žemiau, kad atidarytum įrašą sistemoje {system}.",
      et: "Tere, {name}!\n\n{message}\n\nVajuta allolevale nupule, et avada kirje süsteemis {system}.",
      it: "Ciao, {name}!\n\n{message}\n\nPremi il pulsante qui sotto per aprire l'elemento in {system}.",
      sv: "Hej {name}!\n\n{message}\n\nTryck på knappen nedan för att öppna posten i {system}.",
    },
  },
};

function packValue(pack: LangPack, languageCode: string): string {
  return pack[languageCode] || pack.en || pack.lv || "";
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
