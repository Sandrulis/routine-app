type Translate = (
  key: string,
  fallback: string,
  params?: Record<string, string | number>,
) => string;

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export type LegalDocumentContent = {
  title: string;
  intro: string;
  updatedAt: string;
  sections: LegalSection[];
};

type SectionSpec = {
  id: string;
  titleKey: string;
  titleFallback: string;
  paragraphs: { key: string; fallback: string; params?: Record<string, string | number> }[];
};

function buildSections(t: Translate, specs: SectionSpec[]): LegalSection[] {
  return specs.map((spec) => ({
    id: spec.id,
    title: t(spec.titleKey, spec.titleFallback),
    paragraphs: spec.paragraphs.map((paragraph) =>
      t(paragraph.key, paragraph.fallback, paragraph.params),
    ),
  }));
}

function getUpdatedAt(t: Translate): string {
  return t("legal.common.updated_at", "17.08.26");
}

export function getPrivacyPolicyContent(
  t: Translate,
  legalEmail = "",
): LegalDocumentContent {
  const email = legalEmail.trim();
  const legalContact = email
    ? t(
        "legal.privacy.controller.contact",
        " Par datu apstrādi raksti uz {LEGAL_EMAIL}.",
        { LEGAL_EMAIL: email },
      )
    : "";
  return {
    title: t("legal.privacy.title", "Privātuma politika"),
    intro: t(
      "legal.privacy.intro",
      "Šajā politikā skaidrojam, kādus personas datus apstrādājam, kad tu izmanto {SYSTEM_NAME}, kāpēc to darām un kādas ir tavas tiesības saskaņā ar Vispārīgo datu aizsardzības regulu (ES) 2016/679 (VDAR).",
    ),
    updatedAt: getUpdatedAt(t),
    sections: buildSections(t, [
      {
        id: "controller",
        titleKey: "legal.privacy.controller.title",
        titleFallback: "1. Datu pārzinis",
        paragraphs: [
          {
            key: "legal.privacy.controller.p1",
            fallback:
              "Personas datu pārzinis ir {SYSTEM_NAME} pakalpojuma sniedzējs.{LEGAL_CONTACT} Atbildēsim saprātīgā termiņā un, ja nepieciešams, lūgsim papildu informāciju, lai pārliecinātos par tavu identitāti.",
            params: { LEGAL_CONTACT: legalContact },
          },
          {
            key: "legal.privacy.controller.p2",
            fallback:
              "Ja {SYSTEM_NAME} izmanto sava darba devēja vai klienta uzdevumā, par komandā ievadītajiem darba datiem pārzinis var būt attiecīgais uzņēmums. Šādā gadījumā mēs datus apstrādājam kā apstrādātājs uzņēmuma uzdevumā.",
          },
        ],
      },
      {
        id: "data",
        titleKey: "legal.privacy.data.title",
        titleFallback: "2. Kādus datus apstrādājam",
        paragraphs: [
          {
            key: "legal.privacy.data.p1",
            fallback:
              "Konta dati: vārds, e-pasta adrese, parole (glabājam tikai jaucējkodu), valodas izvēle un profila iestatījumi.",
          },
          {
            key: "legal.privacy.data.p2",
            fallback:
              "Komandas un darba dati: komandas nosaukums, lietotāju vārdi, e-pasti un lomas, saraksti, uzdevumi, apakšuzdevumi, statusi, termiņi, piezīmes, pielikumu nosaukumi un saturs, ko tu vai tava komanda ievada sistēmā.",
          },
          {
            key: "legal.privacy.data.p3",
            fallback:
              "Tehniskie dati: pieslēgšanās laiks, IP adrese, pārlūka un ierīces informācija, kā arī žurnāli, kas nepieciešami drošībai un kļūdu novēršanai.",
          },
          {
            key: "legal.privacy.data.p4",
            fallback:
              "Piekrišanas dati: tava izvēle par sīkdatņu kategorijām un tās veikšanas laiks.",
          },
        ],
      },
      {
        id: "purpose",
        titleKey: "legal.privacy.purpose.title",
        titleFallback: "3. Apstrādes mērķi un juridiskais pamats",
        paragraphs: [
          {
            key: "legal.privacy.purpose.p1",
            fallback:
              "Konta izveide, pieslēgšanās un pakalpojuma sniegšana - līguma izpilde (VDAR 6. panta 1. punkta b) apakšpunkts).",
          },
          {
            key: "legal.privacy.purpose.p2",
            fallback:
              "Sistēmas drošība, ļaunprātīgas izmantošanas un kļūdu novēršana - leģitīmās intereses (VDAR 6. panta 1. punkta f) apakšpunkts).",
          },
          {
            key: "legal.privacy.purpose.p3",
            fallback:
              "Neobligātās sīkdatnes - tava piekrišana (VDAR 6. panta 1. punkta a) apakšpunkts), kuru vari atsaukt jebkurā laikā.",
          },
          {
            key: "legal.privacy.purpose.p4",
            fallback:
              "Grāmatvedības un citu normatīvo prasību izpilde, ja tās attiecas uz pakalpojumu - juridiska pienākuma izpilde (VDAR 6. panta 1. punkta c) apakšpunkts).",
          },
        ],
      },
      {
        id: "cookies",
        titleKey: "legal.privacy.cookies.title",
        titleFallback: "4. Sīkdatnes",
        paragraphs: [
          {
            key: "legal.privacy.cookies.p1",
            fallback:
              "Izmantojam obligātās sīkdatnes, lai saglabātu tavu piekrišanu un nodrošinātu vietnes darbību. Preferenču, statistikas un mārketinga sīkdatnes ieslēdzam tikai ar tavu piekrišanu. Sīkāks saraksts ir sīkdatņu politikā.",
          },
        ],
      },
      {
        id: "recipients",
        titleKey: "legal.privacy.recipients.title",
        titleFallback: "5. Datu saņēmēji",
        paragraphs: [
          {
            key: "legal.privacy.recipients.p1",
            fallback:
              "Datus redz pilnvaroti lietotāji tavā komandā atbilstoši piešķirtajām tiesībām. Tehniskajai uzturēšanai varam piesaistīt mitināšanas un e-pasta pakalpojumu sniedzējus, kas darbojas uz apstrādes līguma pamata.",
          },
          {
            key: "legal.privacy.recipients.p2",
            fallback:
              "Datus nepārdodam un nenododam trešajām personām reklāmas nolūkiem.",
          },
        ],
      },
      {
        id: "retention",
        titleKey: "legal.privacy.retention.title",
        titleFallback: "6. Cik ilgi glabājam",
        paragraphs: [
          {
            key: "legal.privacy.retention.p1",
            fallback:
              "Konta un komandas datus glabājam, kamēr konts ir aktīvs. Pēc konta dzēšanas datus dzēšam vai anonimizējam saprātīgā termiņā, izņemot gadījumus, kad ilgāka glabāšana ir vajadzīga likuma dēļ.",
          },
          {
            key: "legal.privacy.retention.p2",
            fallback:
              "Sīkdatņu piekrišanu glabājam līdz 180 dienām vai līdz brīdim, kad tu to maini. Tehniskos žurnālus glabājam tikai tik ilgi, cik nepieciešams drošībai.",
          },
        ],
      },
      {
        id: "rights",
        titleKey: "legal.privacy.rights.title",
        titleFallback: "7. Tavas tiesības",
        paragraphs: [
          {
            key: "legal.privacy.rights.p1",
            fallback:
              "Tev ir tiesības piekļūt saviem datiem, labot tos, dzēst, ierobežot apstrādi, iebilst pret apstrādi, kas balstīta uz leģitīmajām interesēm, un saņemt datus pārnesamā formātā.",
          },
          {
            key: "legal.privacy.rights.p2",
            fallback:
              "Ja apstrāde balstās uz piekrišanu, vari to jebkurā laikā atsaukt, neietekmējot apstrādi, kas veikta pirms atsaukuma. Sūdzību vari iesniegt Datu valsts inspekcijā (www.dvi.gov.lv).",
          },
        ],
      },
      {
        id: "security",
        titleKey: "legal.privacy.security.title",
        titleFallback: "8. Drošība",
        paragraphs: [
          {
            key: "legal.privacy.security.p1",
            fallback:
              "Izmantojam saprātīgus tehniskos un organizatoriskos pasākumus: šifrētu savienojumu, piekļuves kontroli un paroļu jaucējkodus. Absolūtu drošību internetā nevaram garantēt, tāpēc lūdzam sargāt arī sava konta paroli.",
          },
        ],
      },
      {
        id: "changes",
        titleKey: "legal.privacy.changes.title",
        titleFallback: "9. Izmaiņas",
        paragraphs: [
          {
            key: "legal.privacy.changes.p1",
            fallback:
              "Ja politika būtiski mainās, atjaunināsim šo lapu un norādīsim jauno datumu. Turpinot lietot {SYSTEM_NAME} pēc izmaiņām, tu piekrīti atjauninātajai politikai, ciktāl to pieļauj piemērojamie tiesību akti.",
          },
        ],
      },
    ]),
  };
}

export function getTermsContent(t: Translate): LegalDocumentContent {
  return {
    title: t("legal.terms.title", "Lietošanas noteikumi"),
    intro: t(
      "legal.terms.intro",
      "Šie noteikumi regulē {SYSTEM_NAME} vietnes un lietotnes lietošanu. Reģistrējoties vai ienākot, tu apstiprini, ka esi tos izlasījis un piekrīti. Ja nepiekrīti, lūdzu, nelieto pakalpojumu.",
    ),
    updatedAt: getUpdatedAt(t),
    sections: buildSections(t, [
      {
        id: "service",
        titleKey: "legal.terms.service.title",
        titleFallback: "1. Pakalpojums",
        paragraphs: [
          {
            key: "legal.terms.service.p1",
            fallback:
              "{SYSTEM_NAME} ir komandas darba rīks sarakstiem, uzdevumiem, failiem un sadarbībai. Mēs sniedzam piekļuvi programmatūrai tādā stāvoklī, kādā tā ir, lai tu un tava komanda varētu plānot un izpildīt darbu.",
          },
          {
            key: "legal.terms.service.p2",
            fallback:
              "Funkcijas varam uzlabot, papildināt vai pārtraukt, ja tas nepieciešams produkta attīstībai vai drošībai. Par būtiskām izmaiņām informēsim vietnē vai e-pastā.",
          },
        ],
      },
      {
        id: "account",
        titleKey: "legal.terms.account.title",
        titleFallback: "2. Konts",
        paragraphs: [
          {
            key: "legal.terms.account.p1",
            fallback:
              "Kontu drīkst izveidot persona, kas ir vismaz 16 gadus veca un ir tiesīga slēgt līgumu. Tu apņemies sniegt precīzus datus un uzturēt aktuālu e-pasta adresi.",
          },
          {
            key: "legal.terms.account.p2",
            fallback:
              "Tu atbildi par paroles slepenību un par visām darbībām, kas veiktas no tava konta. Ja aizdomājies par nesankcionētu piekļuvi, nekavējoties nomaini paroli un raksti mums.",
          },
        ],
      },
      {
        id: "content",
        titleKey: "legal.terms.content.title",
        titleFallback: "3. Saturs",
        paragraphs: [
          {
            key: "legal.terms.content.p1",
            fallback:
              "Saraksti, uzdevumi, faili un citi dati, ko ievadi {SYSTEM_NAME}, paliek tev vai tavam uzņēmumam. Mēs tos izmantojam tikai pakalpojuma nodrošināšanai, drošībai un atbalstam.",
          },
          {
            key: "legal.terms.content.p2",
            fallback:
              "Tu garantē, ka tev ir tiesības ievadīt šo saturu un ka tas nepārkāpj citu personu tiesības, konfidencialitāti vai piemērojamos likumus.",
          },
        ],
      },
      {
        id: "acceptable",
        titleKey: "legal.terms.acceptable.title",
        titleFallback: "4. Pieļaujamā lietošana",
        paragraphs: [
          {
            key: "legal.terms.acceptable.p1",
            fallback:
              "Nedrīkst mēģināt ielauzties sistēmā, pārslogot to, apiet drošību, kopēt citu komandu datus vai izmantot {SYSTEM_NAME} pretlikumīgiem mērķiem.",
          },
          {
            key: "legal.terms.acceptable.p2",
            fallback:
              "Ja pārkāpums ir būtisks, mēs varam ierobežot vai slēgt kontu. Par acīmredzami prettiesisku saturu varam ziņot kompetentajām iestādēm.",
          },
        ],
      },
      {
        id: "availability",
        titleKey: "legal.terms.availability.title",
        titleFallback: "5. Pieejamība",
        paragraphs: [
          {
            key: "legal.terms.availability.p1",
            fallback:
              "Cenšamies, lai {SYSTEM_NAME} būtu pieejams bez pārtraukuma, taču nevaram garantēt 100% darbības laiku. Plānoti darbi un ārkārtas labojumi var īslaicīgi pārtraukt piekļuvi.",
          },
        ],
      },
      {
        id: "liability",
        titleKey: "legal.terms.liability.title",
        titleFallback: "6. Atbildība",
        paragraphs: [
          {
            key: "legal.terms.liability.p1",
            fallback:
              "{SYSTEM_NAME} palīdz organizēt darbu, taču tu esi atbildīgs par lēmumiem, ko pieņem, balstoties uz sistēmā redzamo informāciju. Ciktāl to pieļauj likums, mēs neatbildam par netiešiem zaudējumiem, peļņas zudumu vai datu zudumu, kas radies no pakalpojuma lietošanas.",
          },
          {
            key: "legal.terms.liability.p2",
            fallback:
              "Ja likums neļauj izslēgt atbildību, mūsu atbildība ir ierobežota ar summu, ko tu esi samaksājis par {SYSTEM_NAME} pēdējo 12 mēnešu laikā, vai 100 EUR, ja maksa nav bijusi.",
          },
        ],
      },
      {
        id: "termination",
        titleKey: "legal.terms.termination.title",
        titleFallback: "7. Izbeigšana",
        paragraphs: [
          {
            key: "legal.terms.termination.p1",
            fallback:
              "Tu vari pārtraukt lietošanu un dzēst kontu jebkurā laikā. Mēs varam slēgt kontu, ja tu būtiski pārkāp šos noteikumus vai ja pakalpojumu pārtraucam.",
          },
        ],
      },
      {
        id: "law",
        titleKey: "legal.terms.law.title",
        titleFallback: "8. Piemērojamie tiesību akti",
        paragraphs: [
          {
            key: "legal.terms.law.p1",
            fallback:
              "Noteikumiem piemērojami Latvijas Republikas tiesību akti. Strīdus vispirms risināsim sarunās. Ja tas neizdodas, strīds ir piekritīgs Latvijas tiesām, ja vien patērētāja aizsardzības normas nenosaka citādi.",
          },
        ],
      },
    ]),
  };
}

export function getCookiePolicyContent(t: Translate): LegalDocumentContent {
  return {
    title: t("legal.cookies.title", "Sīkdatņu politika"),
    intro: t(
      "legal.cookies.intro",
      "Šī politika paskaidro, kādas sīkdatnes {SYSTEM_NAME} izmanto, kāpēc tās ir vajadzīgas un kā tu vari pārvaldīt piekrišanu. Tā jālasa kopā ar privātuma politiku.",
    ),
    updatedAt: getUpdatedAt(t),
    sections: buildSections(t, [
      {
        id: "what",
        titleKey: "legal.cookies.what.title",
        titleFallback: "1. Kas ir sīkdatnes",
        paragraphs: [
          {
            key: "legal.cookies.what.p1",
            fallback:
              "Sīkdatnes ir nelieli teksta faili, ko pārlūks saglabā tavā ierīcē. Tās palīdz atcerēties iestatījumus, saglabāt piekrišanu un, ja tu atļauj, mērīt lietojumu.",
          },
          {
            key: "legal.cookies.what.p2",
            fallback:
              "Līdzīgas tehnoloģijas, piemēram, vietējā krātuve (localStorage), var tikt izmantotas tam pašam mērķim. Šajā politikā tās apzīmējam kopā ar sīkdatnēm.",
          },
        ],
      },
      {
        id: "necessary",
        titleKey: "legal.cookies.necessary.title",
        titleFallback: "2. Obligātās sīkdatnes",
        paragraphs: [
          {
            key: "legal.cookies.necessary.p1",
            fallback:
              "Obligātās sīkdatnes ir vajadzīgas, lai vietne darbotos: saglabājam tavu sīkdatņu izvēli un nodrošinām drošu pārlūkošanu. Bez tām piekrišanas logs atkārtotos katrā apmeklējumā un daļa funkciju nebūtu pieejama.",
          },
          {
            key: "legal.cookies.necessary.p2",
            fallback:
              "Šīs sīkdatnes nevar izslēgt sistēmā. Tās vari bloķēt pārlūka iestatījumos, taču tad {SYSTEM_NAME} var nestrādāt pareizi.",
          },
        ],
      },
      {
        id: "preferences",
        titleKey: "legal.cookies.preferences.title",
        titleFallback: "3. Preferenču sīkdatnes",
        paragraphs: [
          {
            key: "legal.cookies.preferences.p1",
            fallback:
              "Preferenču sīkdatnes atceras saskarnes izvēles, piemēram, saraksta logu (Uzdevumi, Faili, Saraksts) kārtību. Tās palīdz, lai tev nebūtu jāiestata skats no jauna katrā apmeklējumā.",
          },
          {
            key: "legal.cookies.preferences.p2",
            fallback:
              "Šīs sīkdatnes rakstām tikai tad, ja tu tām piekrīti. Ja atsakies, izvēles paliek tikai līdz lapas pārlādei.",
          },
        ],
      },
      {
        id: "optional",
        titleKey: "legal.cookies.optional.title",
        titleFallback: "4. Statistikas un mārketinga sīkdatnes",
        paragraphs: [
          {
            key: "legal.cookies.optional.p1",
            fallback:
              "Statistikas sīkdatnes ļautu anonīmi saprast, kuras lapas palīdz un kuras mulsina. Mārketinga sīkdatnes ļautu mērīt kampaņas. Šobrīd {SYSTEM_NAME} šādus rīkus neieslēdz.",
          },
          {
            key: "legal.cookies.optional.p2",
            fallback:
              "Ja nākotnē tos pievienosim, tie darbosies tikai ar tavu piekrišanu. Līdz tam izvēle “Piekrist visām” saglabā gatavību, bet neieslēdz trešo pušu izsekošanu.",
          },
        ],
      },
      {
        id: "manage",
        titleKey: "legal.cookies.manage.title",
        titleFallback: "5. Kā pārvaldīt piekrišanu",
        paragraphs: [
          {
            key: "legal.cookies.manage.p1",
            fallback:
              "Pirmo reizi atverot vietni, parādās sīkdatņu logs. Vari piekrist visām, atteikt neobligātās vai pielāgot kategorijas.",
          },
          {
            key: "legal.cookies.manage.p2",
            fallback:
              "Izvēli vari mainīt jebkurā laikā ar “Sīkdatņu iestatījumi” lapas kājenē vai šajā lapā. Piekrišanu glabājam līdz 180 dienām.",
          },
        ],
      },
      {
        id: "changes",
        titleKey: "legal.cookies.changes.title",
        titleFallback: "6. Izmaiņas",
        paragraphs: [
          {
            key: "legal.cookies.changes.p1",
            fallback:
              "Ja mainās sīkdatņu kategorijas vai to mērķis, atjaunināsim šo politiku un, ja nepieciešams, no jauna lūgsim tavu piekrišanu.",
          },
        ],
      },
    ]),
  };
}
