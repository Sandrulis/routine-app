import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";

export type LandingFaqItem = {
  id: string;
  questionKey: string;
  questionFallback: string;
  answerKey: string;
  answerFallback: string;
};

export function resolveLandingFaqItems(
  isEnabled: (moduleKey: string) => boolean,
): LandingFaqItem[] {
  const items: LandingFaqItem[] = [
    {
      id: "what",
      questionKey: "landing.faq.what.question",
      questionFallback: "Kas ir {SYSTEM_NAME}?",
      answerKey: "landing.faq.what.answer",
      answerFallback:
        "{SYSTEM_NAME} ir komandas uzdevumu pārvaldības rīks. Tajā vienā darbvietā ir saraksti, uzdevumi, cilvēki un termiņi, lai komanda redzētu, kas jādara šodien.",
    },
    {
      id: "team_task",
      questionKey: "landing.faq.team_task.question",
      questionFallback: "Kas ir komandas uzdevumu pārvaldība?",
      answerKey: "landing.faq.team_task.answer",
      answerFallback:
        "Tā ir darba organizēšana, kur katram uzdevumam ir atbildīgais, statuss un termiņš, un visa komanda redz to pašu ainu — nevis katrs savu tabulu vai čata pavedienu.",
    },
    {
      id: "who",
      questionKey: "landing.faq.who.question",
      questionFallback: "Kam {SYSTEM_NAME} ir paredzēts?",
      answerKey: "landing.faq.who.answer",
      answerFallback:
        "Mazām un augošām komandām, aģentūrām un attālinātām komandām, kam vajag skaidru darba ainu bez smagas projektu vadības sistēmas.",
    },
    {
      id: "pm",
      questionKey: "landing.faq.pm.question",
      questionFallback: "Vai {SYSTEM_NAME} ir projektu vadības rīks?",
      answerKey: "landing.faq.pm.answer",
      answerFallback:
        "{SYSTEM_NAME} palīdz vadīt projektus kā sarakstus ar uzdevumiem, termiņiem un atbildīgajiem. Tas nav korporatīvs portfeļa pārvaldības rīks — tas ir veidots ikdienas darbam.",
    },
    {
      id: "projects",
      questionKey: "landing.faq.projects.question",
      questionFallback: "Vai varu vadīt projektus un uzdevumus?",
      answerKey: "landing.faq.projects.answer",
      answerFallback:
        "Jā. Izveido sarakstus projektiem vai klientiem, sadali tos uzdevumos, piešķir atbildīgos un seko statusam no darāmā līdz gatavam.",
    },
    {
      id: "invite",
      questionKey: "landing.faq.invite.question",
      questionFallback: "Vai varu uzaicināt komandu?",
      answerKey: "landing.faq.invite.answer",
      answerFallback:
        "Jā. Uzaicini komandas biedrus, piešķir uzdevumus un redzi, kas ir tiešsaistē. Visi strādā vienā darbvietā.",
    },
  ];

  if (isEnabled(FRONTEND_MODULE_KEYS.fileUpload)) {
    items.push({
      id: "files",
      questionKey: "landing.faq.files.question",
      questionFallback: "Vai varu pievienot failus uzdevumiem?",
      answerKey: "landing.faq.files.answer",
      answerFallback:
        "Jā. Dokumentus pievieno tieši pie uzdevuma, lai faili paliek pie darba, nevis e-pastā vai atsevišķā mapē.",
    });
  }

  if (isEnabled(FRONTEND_MODULE_KEYS.fileUpload) && isEnabled(FRONTEND_MODULE_KEYS.googleDrive)) {
    items.push({
      id: "drive",
      questionKey: "landing.faq.drive.question",
      questionFallback: "Vai {SYSTEM_NAME} savienojas ar Google Drive?",
      answerKey: "landing.faq.drive.answer",
      answerFallback:
        "Jā. Failus var glabāt Google Drive un atvērt no saraksta, neizejot no {SYSTEM_NAME}.",
    });
  }

  if (
    isEnabled(FRONTEND_MODULE_KEYS.calendar) &&
    (isEnabled(FRONTEND_MODULE_KEYS.calendarApple) ||
      isEnabled(FRONTEND_MODULE_KEYS.calendarGoogle))
  ) {
    items.push({
      id: "calendar",
      questionKey: "landing.faq.calendar.question",
      questionFallback: "Vai {SYSTEM_NAME} ir kalendāra funkcija?",
      answerKey: "landing.faq.calendar.answer",
      answerFallback:
        "Uzdevumu termiņi var parādīties Apple Calendar vai Google Calendar, lai dienas plāns paliek vienā vietā.",
    });
  }

  items.push({
    id: "free",
    questionKey: "landing.faq.free.question",
    questionFallback: "Vai varu sākt bez maksas?",
    answerKey: "landing.faq.free.answer",
    answerFallback:
      "Jā. Izveido kontu un sāc darbu bez instalēšanas. Nav nedēļas ilgas ieviešanas.",
  });

  return items;
}
