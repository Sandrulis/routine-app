import {
  FRONTEND_MODULE_KEYS,
  isCalendarIntegrationVisible,
} from "@/app/lib/frontend-modules/keys";

export type LandingCopy = {
  key: string;
  fallback: string;
};

export type LandingFeature = {
  id: string;
  icon: string;
  titleKey: string;
  titleFallback: string;
  descriptionKey: string;
  descriptionFallback: string;
};

export type LandingPageContent = {
  heroTogether: LandingCopy;
  features: LandingFeature[];
};

const CORE_LISTS_WITH_FILES: LandingFeature = {
  id: "lists",
  icon: "fas fa-list-ul",
  titleKey: "landing.features.lists.title",
  titleFallback: "Saraksti, kas atbilst tavam darbam",
  descriptionKey: "landing.features.lists.description",
  descriptionFallback:
    "Projekti, klienti, mapes un faili vienā kokā. Katram uzdevumam ir statuss, termiņš un atbildīgais — nevis vēl viena Excel tabula.",
};

const CORE_LISTS_NO_FILES: LandingFeature = {
  ...CORE_LISTS_WITH_FILES,
  descriptionKey: "landing.features.lists.description_no_files",
  descriptionFallback:
    "Projekti, klienti un mapes vienā kokā. Katram uzdevumam ir statuss, termiņš un atbildīgais — nevis vēl viena Excel tabula.",
};

const CORE_TEAM_WITH_FILES: LandingFeature = {
  id: "team",
  icon: "fas fa-users",
  titleKey: "landing.features.team.title",
  titleFallback: "Visa komanda redz to pašu",
  descriptionKey: "landing.features.team.description",
  descriptionFallback:
    "Uzaicini komandas biedrus, piešķir darbus un zini, kas ir tiešsaistē. Nav jāmeklē čatā, kur palika fails vai kurš ko sola.",
};

const CORE_TEAM_NO_FILES: LandingFeature = {
  ...CORE_TEAM_WITH_FILES,
  descriptionKey: "landing.features.team.description_no_files",
  descriptionFallback:
    "Uzaicini komandas biedrus, piešķir darbus un zini, kas ir tiešsaistē. Nav jāmeklē čatā, kurš ko sola.",
};

const CORE_DASHBOARD: LandingFeature = {
  id: "dashboard",
  icon: "fas fa-table-columns",
  titleKey: "landing.features.dashboard.title",
  titleFallback: "Sākums ir dienas tāfele",
  descriptionKey: "landing.features.dashboard.description",
  descriptionFallback:
    "Atverot {SYSTEM_NAME}, redzi darāmo, procesā un gatavo. Vilc kartītes un turi fokusu uz to, kas jāpabeidz šodien.",
};

function calendarFeature(isEnabled: (moduleKey: string) => boolean): LandingFeature | null {
  if (!isCalendarIntegrationVisible(isEnabled)) return null;

  const apple = isEnabled(FRONTEND_MODULE_KEYS.calendarApple);
  const google = isEnabled(FRONTEND_MODULE_KEYS.calendarGoogle);

  if (apple && google) {
    return {
      id: "calendar",
      icon: "fas fa-calendar-days",
      titleKey: "landing.features.calendar.title",
      titleFallback: "Kalendāra integrācija",
      descriptionKey: "landing.features.calendar.description_both",
      descriptionFallback:
        "Uzdevumu termiņi parādās Apple Calendar un Google Calendar, lai diena paliktu vienā vietā.",
    };
  }

  if (apple) {
    return {
      id: "calendar",
      icon: "fas fa-calendar-days",
      titleKey: "landing.features.calendar.title",
      titleFallback: "Kalendāra integrācija",
      descriptionKey: "landing.features.calendar.description_apple",
      descriptionFallback:
        "Uzdevumu termiņi parādās Apple Calendar, lai diena paliktu vienā vietā.",
    };
  }

  return {
    id: "calendar",
    icon: "fas fa-calendar-days",
    titleKey: "landing.features.calendar.title",
    titleFallback: "Kalendāra integrācija",
    descriptionKey: "landing.features.calendar.description_google",
    descriptionFallback:
      "Uzdevumu termiņi parādās Google Calendar, lai diena paliktu vienā vietā.",
  };
}

export function resolveLandingPageContent(
  isEnabled: (moduleKey: string) => boolean,
): LandingPageContent {
  const filesOn = isEnabled(FRONTEND_MODULE_KEYS.fileUpload);
  const features: LandingFeature[] = [
    filesOn ? CORE_LISTS_WITH_FILES : CORE_LISTS_NO_FILES,
    filesOn ? CORE_TEAM_WITH_FILES : CORE_TEAM_NO_FILES,
    CORE_DASHBOARD,
  ];

  if (isEnabled(FRONTEND_MODULE_KEYS.privateList)) {
    features.push({
      id: "private_list",
      icon: "fas fa-user-lock",
      titleKey: "landing.features.private_list.title",
      titleFallback: "Privāti saraksti",
      descriptionKey: "landing.features.private_list.description",
      descriptionFallback:
        "Paslēp sarakstu no pārējās komandas. Redz tikai tu un izvēlētie komandas biedri vai lomas.",
    });
  }

  if (isEnabled(FRONTEND_MODULE_KEYS.templates)) {
    features.push({
      id: "templates",
      icon: "fas fa-copy",
      titleKey: "landing.features.templates.title",
      titleFallback: "Šabloni",
      descriptionKey: "landing.features.templates.description",
      descriptionFallback:
        "Saglabā atkārtojamu darbu kā šablonu un izveido jaunu mapi ar gatavu struktūru.",
    });
  }

  if (isEnabled(FRONTEND_MODULE_KEYS.automations)) {
    features.push({
      id: "automations",
      icon: "fas fa-bolt",
      titleKey: "landing.features.automations.title",
      titleFallback: "Automatizācijas",
      descriptionKey: "landing.features.automations.description",
      descriptionFallback:
        "Kad statuss mainās, piešķir atbildīgo vai aizver darbu. Mazāk manuālas pārcelšanas.",
    });
  }

  if (filesOn) {
    features.push({
      id: "files",
      icon: "fas fa-paperclip",
      titleKey: "landing.features.files.title",
      titleFallback: "Faili pie uzdevuma",
      descriptionKey: "landing.features.files.description",
      descriptionFallback:
        "Pievieno dokumentus tieši pie darba. Nav jāmeklē pielikums e-pastā vai koplietotā mapē.",
    });
  }

  if (isEnabled(FRONTEND_MODULE_KEYS.checklist)) {
    features.push({
      id: "checklist",
      icon: "fas fa-list-check",
      titleKey: "landing.features.checklist.title",
      titleFallback: "Check List",
      descriptionKey: "landing.features.checklist.description",
      descriptionFallback:
        "Sadali uzdevumu punktos, ko var atzīmēt, nezaudējot kontekstu un termiņu.",
    });
  }

  const calendar = calendarFeature(isEnabled);
  if (calendar) features.push(calendar);

  if (filesOn && isEnabled(FRONTEND_MODULE_KEYS.googleDrive)) {
    features.push({
      id: "google_drive",
      icon: "fas fa-cloud",
      titleKey: "landing.features.google_drive.title",
      titleFallback: "Google Drive",
      descriptionKey: "landing.features.google_drive.description",
      descriptionFallback:
        "Glabā failus Google Drive un atver tos no saraksta, neizejot no {SYSTEM_NAME}.",
    });
  }

  if (filesOn && isEnabled(FRONTEND_MODULE_KEYS.onedrive)) {
    features.push({
      id: "onedrive",
      icon: "fas fa-cloud",
      titleKey: "landing.features.onedrive.title",
      titleFallback: "OneDrive",
      descriptionKey: "landing.features.onedrive.description",
      descriptionFallback:
        "Glabā failus OneDrive un atver tos no saraksta, neizejot no {SYSTEM_NAME}.",
    });
  }

  if (isEnabled(FRONTEND_MODULE_KEYS.gmailPlugin)) {
    features.push({
      id: "gmail",
      icon: "fas fa-envelope",
      titleKey: "landing.features.gmail.title",
      titleFallback: "Gmail spraudnis",
      descriptionKey: "landing.features.gmail.description",
      descriptionFallback:
        "No Gmail pievieno e-pastu un pielikumus pie uzdevuma, lai sarakste paliktu pie darba.",
    });
  }

  return {
    heroTogether: filesOn
      ? {
          key: "landing.hero.stat_together",
          fallback: "Atbildīgais, termiņš un fails paliek pie uzdevuma.",
        }
      : {
          key: "landing.hero.stat_together_no_files",
          fallback: "Atbildīgais un termiņš paliek pie uzdevuma.",
        },
    features,
  };
}
