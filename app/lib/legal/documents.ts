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

export type LegalEntityInfo = {
  legalEmail?: string;
  legalEntityName?: string;
  legalEntityRegNo?: string;
  legalEntityAddress?: string;
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
  return t("legal.common.updated_at", "26.08.26");
}

function buildControllerIdentity(t: Translate, entity: LegalEntityInfo): string {
  const name = entity.legalEntityName?.trim() ?? "";
  const regNo = entity.legalEntityRegNo?.trim() ?? "";
  const address = entity.legalEntityAddress?.trim() ?? "";

  if (!name) {
    return t(
      "legal.privacy.controller.identity_provider",
      "{SYSTEM_NAME} pakalpojuma sniedzējs",
    );
  }

  const details: string[] = [name];
  if (regNo) {
    details.push(
      t("legal.privacy.controller.identity_reg", "reģ. nr. {REG_NO}", {
        REG_NO: regNo,
      }),
    );
  }
  if (address) {
    details.push(
      t("legal.privacy.controller.identity_address", "juridiskā adrese: {ADDRESS}", {
        ADDRESS: address,
      }),
    );
  }
  return details.join(", ");
}

export function getPrivacyPolicyContent(
  t: Translate,
  entity: LegalEntityInfo = {},
): LegalDocumentContent {
  const email = entity.legalEmail?.trim() ?? "";
  const legalContact = email
    ? t(
        "legal.privacy.controller.contact",
        " Par datu apstrādi raksti uz {LEGAL_EMAIL}.",
        { LEGAL_EMAIL: email },
      )
    : "";
  const controllerIdentity = buildControllerIdentity(t, entity);

  return {
    title: t("legal.privacy.title", "Privātuma politika"),
    intro: t(
      "legal.privacy.intro",
      "Šajā politikā skaidrojam, kādus personas datus apstrādājam, kad tu izmanto {SYSTEM_NAME}, kāpēc to darām, ar ko datus kopīgojam un kādas ir tavas tiesības saskaņā ar Vispārīgo datu aizsardzības regulu (ES) 2016/679 (VDAR).",
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
              "Personas datu pārzinis ir {CONTROLLER_IDENTITY}.{LEGAL_CONTACT} Atbildēsim saprātīgā termiņā un, ja nepieciešams, lūgsim papildu informāciju, lai pārliecinātos par tavu identitāti.",
            params: { CONTROLLER_IDENTITY: controllerIdentity, LEGAL_CONTACT: legalContact },
          },
          {
            key: "legal.privacy.controller.p2",
            fallback:
              "Ja {SYSTEM_NAME} izmanto sava darba devēja vai klienta uzdevumā, par komandā ievadītajiem darba datiem pārzinis var būt attiecīgais uzņēmums. Šādā gadījumā mēs datus apstrādājam kā apstrādātājs uzņēmuma uzdevumā saskaņā ar piemērojamo līgumu.",
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
              "Konta dati: vārds, uzvārds, e-pasta adrese, parole (glabājam tikai jaucējkodu), valodas izvēle, laika josla, datuma/laika attēlošanas preferences, MFA iestatījumi un paziņojumu preferences.",
          },
          {
            key: "legal.privacy.data.p2",
            fallback:
              "Komandas un darba dati: komandas nosaukums un iestatījumi, lietotāju vārdi, e-pasti un lomas, saraksti, uzdevumi, apakšuzdevumi, statusi, termiņi, piezīmes, aktivitāšu vēsture, pielikumu nosaukumi un saturs, ko tu vai tava komanda ievada sistēmā.",
          },
          {
            key: "legal.privacy.data.p3",
            fallback:
              "Norēķinu dati (maksas plāniem): Stripe klienta un abonementa identifikatori, apmaksāto vietu skaits, norēķinu cikla datumi un abonementa statuss. Maksājumu kartes un rēķinu detaļas glabā Stripe, nevis mūsu datubāzē.",
          },
          {
            key: "legal.privacy.data.p4",
            fallback:
              "Integrāciju dati (ja ieslēdz): OAuth piekļuves un atjaunošanas tokeni (šifrēti), Google/Microsoft konta e-pasts, Google Drive / OneDrive mapes metadati, Gmail savienojuma statuss Chrome spraudnim, kalendāra abonementu tokeni.",
          },
          {
            key: "legal.privacy.data.p5",
            fallback:
              "Tehniskie un drošības dati: pieslēgšanās laiks, IP adrese, pārlūka un ierīces informācija, kļūdu žurnāli (ar PII maskēšanu), botu pārbaudes rezultāti (Cloudflare Turnstile), piekrišanas izvēle par sīkdatnēm un rate limiting ieraksti.",
          },
          {
            key: "legal.privacy.data.p6",
            fallback:
              "Atgriezeniskā saite: kļūdu ziņojumi, funkciju pieprasījumi un atsauksmes, ko iesniedz caur sānjoslu, ar tavu e-pastu un brīvā formā ievadītu tekstu.",
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
              "Konta izveide, pieslēgšanās, komandas sadarbība un pakalpojuma sniegšana - līguma izpilde (VDAR 6. panta 1. punkta b) apakšpunkts).",
          },
          {
            key: "legal.privacy.purpose.p2",
            fallback:
              "Sistēmas drošība, ļaunprātīgas izmantošanas novēršana, kļūdu analīze un pakalpojuma uzturēšana - leģitīmās intereses (VDAR 6. panta 1. punkta f) apakšpunkts), ja vien likums neprasa piekrišanu.",
          },
          {
            key: "legal.privacy.purpose.p3",
            fallback:
              "Neobligātās sīkdatnes un anonīma lietojuma statistika (Umami) - tava piekrišana (VDAR 6. panta 1. punkta a) apakšpunkts), kuru vari atsaukt jebkurā laikā.",
          },
          {
            key: "legal.privacy.purpose.p4",
            fallback:
              "Maksājumu un abonementu apstrāde, grāmatvedības un citu normatīvo prasību izpilde - līguma izpilde un juridiska pienākuma izpilde (VDAR 6. panta 1. punkta b) un c) apakšpunkti).",
          },
          {
            key: "legal.privacy.purpose.p5",
            fallback:
              "E-pasta paziņojumi par uzdevumiem, uzaicinājumiem un atgādinājumiem - līguma izpilde; dažus paziņojumus vari ierobežot profila iestatījumos.",
          },
        ],
      },
      {
        id: "recipients",
        titleKey: "legal.privacy.recipients.title",
        titleFallback: "4. Datu saņēmēji un apstrādātāji",
        paragraphs: [
          {
            key: "legal.privacy.recipients.p1",
            fallback:
              "Datus redz pilnvaroti lietotāji tavā komandā atbilstoši piešķirtajām tiesībām. Tehniskajai uzturēšanai izmantojam uzticamus apstrādātājus, ar kuriem noslēgti datu apstrādes līgumi vai piemērojami ES standarta līguma noteikumi.",
          },
          {
            key: "legal.privacy.recipients.p2",
            fallback:
              "Galvenie apstrādātāji: Supabase (datubāze un autentifikācija), Vercel (lietotnes mitināšana), Resend (transakcionālie e-pasti), Stripe (maksājumi), Google (OAuth, Drive, Gmail API spraudnim), Microsoft (OAuth, OneDrive), Cloudflare (Turnstile botu aizsardzība), Sentry (kļūdu uzraudzība, ja ieslēgta) un Umami (anonīma statistika, ja ieslēgta un tu piekrīti).",
          },
          {
            key: "legal.privacy.recipients.p3",
            fallback:
              "Datus nepārdodam un nenododam trešajām personām reklāmas nolūkos. Apstrādātāji drīkst apstrādāt datus tikai mūsu uzdevumā un saskaņā ar instrukcijām.",
          },
        ],
      },
      {
        id: "transfers",
        titleKey: "legal.privacy.transfers.title",
        titleFallback: "5. Starptautiskie datu pārnesumi",
        paragraphs: [
          {
            key: "legal.privacy.transfers.p1",
            fallback:
              "Dati galvenokārt tiek glabāti Eiropas Ekonomikas zonā (EEZ). Daži apstrādātāji (piem., Stripe, Google, Microsoft, Cloudflare, Sentry) var apstrādāt datus arī ārpus EEZ, piemēram ASV, ja tu izmanto attiecīgo integrāciju.",
          },
          {
            key: "legal.privacy.transfers.p2",
            fallback:
              "Šādos gadījumos paļaujamies uz Eiropas Komisijas lēmumiem par pietiekamību, ES standarta līguma noteikumiem vai citiem VDAR atļautajiem mehānismiem, ko nodrošina attiecīgais apstrādātājs.",
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
              "Konta un komandas datus glabājam, kamēr konts ir aktīvs. Pēc konta dzēšanas pieprasījuma konts tiek deaktivizēts uz 30 dienām; pēc termiņa dati tiek neatgriezeniski dzēsti, izņemot gadījumus, kad ilgāka glabāšana ir vajadzīga likuma dēļ.",
          },
          {
            key: "legal.privacy.retention.p2",
            fallback:
              "Ja pieslēdzies atkārtoti deaktivizācijas periodā, konts automātiski tiek atjaunots. Komandas īpašnieka konta dzēšana var ietekmēt komandas datus saskaņā ar konta dzēšanas plūsmu.",
          },
          {
            key: "legal.privacy.retention.p3",
            fallback:
              "Sīkdatņu piekrišanu glabājam līdz 180 dienām. Pieslēgšanās sesiju ar Atcerēties mani - līdz 30 dienām. Tehniskos žurnālus un drošības ierakstus glabājam tikai tik ilgi, cik nepieciešams drošībai un normatīvajām prasībām.",
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
              "Kontu vari dzēst sadaļā Personīgie uzstādījumi (/settings/profile). Datu kopijas pieprasījumu vari nosūtīt uz juridisko e-pastu, kas norādīts šīs politikas sadaļā par datu pārzini. Atbildēsim saprātīgā termiņā.",
          },
          {
            key: "legal.privacy.rights.p3",
            fallback:
              "Ja apstrāde balstās uz piekrišanu (neobligātās sīkdatnes), vari to jebkurā laikā atsaukt sīkdatņu iestatījumos. Sūdzību vari iesniegt Datu valsts inspekcijā (www.dvi.gov.lv).",
          },
        ],
      },
      {
        id: "cookies",
        titleKey: "legal.privacy.cookies.title",
        titleFallback: "8. Sīkdatnes",
        paragraphs: [
          {
            key: "legal.privacy.cookies.p1",
            fallback:
              "Izmantojam obligātās sīkdatnes, lai saglabātu tavu piekrišanu, uzturētu pieslēgšanās sesiju un nodrošinātu vietnes darbību. Preferenču un statistikas sīkdatnes ieslēdzam tikai ar tavu piekrišanu. Pilns saraksts un pārvaldība ir sīkdatņu politikā.",
          },
        ],
      },
      {
        id: "integrations",
        titleKey: "legal.privacy.integrations.title",
        titleFallback: "9. Integrācijas un trešo pušu pakalpojumi",
        paragraphs: [
          {
            key: "legal.privacy.integrations.p1",
            fallback:
              "Ja savieno Google Drive, OneDrive, Gmail spraudni vai kalendāra abonementu, attiecīgais pakalpojumu sniedzējs apstrādā datus saskaņā ar savu privātuma politiku. Mēs glabājam tikai tos tokenus un metadatus, kas nepieciešami integrācijas darbībai.",
          },
          {
            key: "legal.privacy.integrations.p2",
            fallback:
              "Gmail Chrome spraudnis darbojas tikai pēc tavas pieslēgšanās un piekļuves piešķiršanas. Spraudnis var lasīt e-pasta metadatus un saturu, lai pievienotu e-pastus uzdevumiem vai izveidotu apakšuzdevumus.",
          },
        ],
      },
      {
        id: "security",
        titleKey: "legal.privacy.security.title",
        titleFallback: "10. Drošība",
        paragraphs: [
          {
            key: "legal.privacy.security.p1",
            fallback:
              "Izmantojam saprātīgus tehniskos un organizatoriskos pasākumus: šifrētu savienojumu (HTTPS), piekļuves kontroli, paroļu jaucējkodus, OAuth tokenu šifrēšanu datubāzē un ierobežotas piekļuves politikas (RLS). Absolūtu drošību internetā nevaram garantēt, tāpēc lūdzam sargāt arī sava konta paroli.",
          },
        ],
      },
      {
        id: "changes",
        titleKey: "legal.privacy.changes.title",
        titleFallback: "11. Izmaiņas",
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

export function getTermsContent(
  t: Translate,
  entity: LegalEntityInfo = {},
): LegalDocumentContent {
  const email = entity.legalEmail?.trim() ?? "";
  const legalContact = email
    ? t("legal.terms.contact.email", " Raksti uz {LEGAL_EMAIL}.", { LEGAL_EMAIL: email })
    : "";

  return {
    title: t("legal.terms.title", "Lietošanas noteikumi"),
    intro: t(
      "legal.terms.intro",
      "Šie noteikumi regulē {SYSTEM_NAME} vietnes, lietotnes un Chrome Gmail spraudņa lietošanu. Reģistrējoties, ienākot ar e-pastu vai OAuth (Google/Microsoft), tu apstiprini, ka esi tos izlasījis un piekrīti. Ja nepiekrīti, lūdzu, nelieto pakalpojumu.",
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
              "{SYSTEM_NAME} ir komandas darba rīks sarakstiem, uzdevumiem, failiem un sadarbībai. Mēs sniedzam piekļuvi programmatūrai tādā stāvoklī, kādā tā ir (as is), lai tu un tava komanda varētu plānot un izpildīt darbu.",
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
              "Tu atbildi par paroles slepenību un par visām darbībām, kas veiktas no tava konta. Ja aizdomājies par nesankcionētu piekļuvi, nekavējoties nomaini paroli un sazinies ar mums.",
          },
          {
            key: "legal.terms.account.p3",
            fallback:
              "Ienākot ar Google vai Microsoft, tu piekrīti, ka attiecīgais pakalpojumu sniedzējs nodod mums profila datus (vārds, e-pasts), kas nepieciešami konta izveidei vai pieslēgšanai.",
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
        id: "billing",
        titleKey: "legal.terms.billing.title",
        titleFallback: "5. Maksas plāni un norēķini",
        paragraphs: [
          {
            key: "legal.terms.billing.p1",
            fallback:
              "Maksas plāni tiek apmaksāti caur Stripe. Cenas, norēķinu periods un vietu skaits ir norādīti abonementu lapā pirms maksājuma. Vadītāja vieta komandā parasti ir bez maksas; maksā par papildu lietotāju vietām saskaņā ar plānu.",
          },
          {
            key: "legal.terms.billing.p2",
            fallback:
              "Abonementu vari atcelt perioda beigās abonementu sadaļā; piekļuve paliek līdz apmaksātā perioda beigām. Atmaksas politiku piemērojam saskaņā ar piemērojamajiem patērētāju tiesību aktiem un Stripe noteikumiem.",
          },
          {
            key: "legal.terms.billing.p3",
            fallback:
              "Stripe apstrādā maksājumu un rēķinu datus saskaņā ar savu privātuma politiku. Maksājumu karte netiek glabāta mūsu datubāzē.",
          },
          {
            key: "legal.terms.billing.p4",
            fallback:
              "Katram komandai ir viens Stripe abonements. Norēķini notiek par lietotāju vietām: komandas īpašnieka vai vadītāja vieta ir bez maksas (1 vieta); par katru papildu aktīvo lietotāju nepieciešama atsevišķa apmaksāta vieta saskaņā ar izvēlēto plānu un norēķinu periodu (mēnesis vai gads).",
          },
          {
            key: "legal.terms.billing.p5",
            fallback:
              "Norēķinus par komandas abonementu veic komandas īpašnieks vai cits dalībnieks ar tiesībām pārvaldīt komandas uzstādījumus un norēķinus (sadaļa Komanda → Norēķini). Pārējie komandas lietotāji neapmaksā pakalpojumu individuāli; viņu piekļuve komandas datiem un funkcijām ir atkarīga no aktīva un apmaksāta komandas abonementa.",
          },
          {
            key: "legal.terms.billing.p6",
            fallback:
              "Ja uzaicini jaunu lietotāju, bet komandā nav brīvas apmaksātas vietas, pirms uzaicinājuma apstiprināšanas jānopērk papildu vieta. Jauna vieta cikla laikā tiek iekasēta proporcionāli (prorata) par atlikušo norēķinu periodu; orientējošo un faktisko summu rāda norēķinu lapa un Stripe Checkout.",
          },
          {
            key: "legal.terms.billing.p7",
            fallback:
              "Apmaksātas, bet neaizņemtas vietas paliek komandā līdz pašreizējā norēķinu perioda beigām — vari uzaicināt citu lietotāju bez jaunas maksas, kamēr vieta ir brīva. Nākamajā norēķinu periodā abonementā tiek iekļautas tikai faktiski aizņemtās vietas; neizmantotās vietas tiek noņemtas bez atmaksas par jau apmaksāto periodu.",
          },
          {
            key: "legal.terms.billing.p8",
            fallback:
              "Abonements automātiski atjaunojas katrā norēķinu periodā, ja to neesi atcēlis. Atcelšanu vari veikt norēķinu sadaļā — tā stājas spēkā perioda beigās, un līdz tam piekļuve paliek aktīva. Pirms perioda beigām vari atcelt plānoto atcelšanu un atjaunot automātisko pagarināšanu.",
          },
          {
            key: "legal.terms.billing.p9",
            fallback:
              "Cenas lapā un norēķinos ir norādītas eiro (EUR) bez PVN. PVN, ja piemērojams, Stripe aprēķina un iekasē maksājuma brīdī atbilstoši tavai valstij un norēķinu informācijai. Atmaksas politiku piemērojam saskaņā ar piemērojamajiem patērētāju tiesību aktiem un Stripe noteikumiem.",
          },
          {
            key: "legal.terms.billing.p10",
            fallback:
              "Ja sistēmas administratoram ir ieslēgts izmēģinājuma (trial) periods, jaunas komandas var saņemt noteiktu plānu uz ierobežotu dienu skaitu; trial laikā jaunu lietotāju uzaicināšanai parasti nav nepieciešama atsevišķa apmaksāta vieta. Early Bird ir ierobežots kopējais vietu skaits ar īpašu cenu visā sistēmā; vieta kļūst Early Bird pirkuma brīdī, ja poolā vēl ir brīvas vietas. Ja lietotājs tiek noņemts un vieta netiek aizpildīta līdz cikla beigām, Early Bird statuss netiek atjaunots poolā.",
          },
          {
            key: "legal.terms.billing.p11",
            fallback:
              "Ja maksājums netiek saņemts, Stripe mēģina to atkārtoti; varam ierobežot piekļuvi komandas funkcijām lietotājiem, kas nav īpašnieks vai nav ar norēķinu tiesībām, līdz parāds ir nomaksāts vai abonements atjaunots. Pēc abonementa beigām vai ilgstošas neapmaksas piekļuve maksas funkcijām var tikt bloķēta visiem komandas lietotājiem, izņemot personu ar tiesībām pārvaldīt norēķinus.",
          },
        ],
      },
      {
        id: "integrations",
        titleKey: "legal.terms.integrations.title",
        titleFallback: "6. Integrācijas",
        paragraphs: [
          {
            key: "legal.terms.integrations.p1",
            fallback:
              "Google Drive, OneDrive, Gmail un kalendāra integrācijas ir brīvprātīgas. Tu esi atbildīgs par to, ka tev ir tiesības piešķirt piekļuvi attiecīgajiem kontiem un mapēm.",
          },
          {
            key: "legal.terms.integrations.p2",
            fallback:
              "Mēs neesam atbildīgi par trešo pušu pakalpojumu (Google, Microsoft u.c.) pieejamību, cenu vai satura zudumu ārpus {SYSTEM_NAME}.",
          },
        ],
      },
      {
        id: "extension",
        titleKey: "legal.terms.extension.title",
        titleFallback: "7. Gmail Chrome spraudnis",
        paragraphs: [
          {
            key: "legal.terms.extension.p1",
            fallback:
              "Chrome spraudnis darbojas papildus web lietotnei. Lietojot spraudni, tu piekrīti, ka tas var piekļūt Gmail kontam tikai tādā apjomā, kādu piešķir Google OAuth, lai pievienotu e-pastus uzdevumiem.",
          },
          {
            key: "legal.terms.extension.p2",
            fallback:
              "Spraudņa sesija glabājas Chrome ierīcē. Tu vari atvienot spraudni jebkurā laikā, izdzēšot savienojumu profilā vai noņemot spraudni no pārlūka.",
          },
        ],
      },
      {
        id: "availability",
        titleKey: "legal.terms.availability.title",
        titleFallback: "8. Pieejamība",
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
        titleFallback: "9. Atbildība",
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
        titleFallback: "10. Izbeigšana",
        paragraphs: [
          {
            key: "legal.terms.termination.p1",
            fallback:
              "Tu vari pārtraukt lietošanu un pieprasīt konta dzēšanu Personīgajos uzstādījumos. Pēc pieprasījuma konts tiek deaktivizēts uz 30 dienām; atkārtota pieslēgšanās to atjauno. Pēc termiņa dati tiek dzēsti saskaņā ar privātuma politiku.",
          },
          {
            key: "legal.terms.termination.p2",
            fallback:
              "Mēs varam slēgt kontu, ja tu būtiski pārkāp šos noteikumus vai ja pakalpojumu pārtraucam. Maksas abonementu pārtraukšana neatbrīvo no jau uzkrātajām maksājumu saistībām, ja piemērojams.",
          },
        ],
      },
      {
        id: "law",
        titleKey: "legal.terms.law.title",
        titleFallback: "11. Piemērojamie tiesību akti",
        paragraphs: [
          {
            key: "legal.terms.law.p1",
            fallback:
              "Noteikumiem piemērojami Latvijas Republikas tiesību akti. Strīdus vispirms risināsim sarunās. Ja tas neizdodas, strīds ir piekritīgs Latvijas tiesām, ja vien patērētāja aizsardzības normas nenosaka citādi.",
          },
        ],
      },
      {
        id: "contact",
        titleKey: "legal.terms.contact.title",
        titleFallback: "12. Saziņa",
        paragraphs: [
          {
            key: "legal.terms.contact.p1",
            fallback:
              "Jautājumi par noteikumiem un pakalpojumu:{LEGAL_CONTACT} Atbildēsim saprātīgā termiņā.",
            params: { LEGAL_CONTACT: legalContact },
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
      "Šī politika paskaidro, kādas sīkdatnes un līdzīgas tehnoloģijas {SYSTEM_NAME} izmanto, kāpēc tās ir vajadzīgas un kā tu vari pārvaldīt piekrišanu. Tā jālasa kopā ar privātuma politiku.",
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
              "Līdzīgas tehnoloģijas, piemēram, vietējā krātuve (localStorage), var tikt izmantotas tam pašam mērķim. Šajā politikā tās apzīmējam kopā ar sīkdatnēm, ja tās glabā preferences vai stāvokli tavā pārlūkā.",
          },
        ],
      },
      {
        id: "categories",
        titleKey: "legal.cookies.categories.title",
        titleFallback: "2. Piekrišanas kategorijas",
        paragraphs: [
          {
            key: "legal.cookies.categories.p1",
            fallback:
              "Obligātās sīkdatnes vienmēr ir ieslēgtas. Preferenču, statistikas un mārketinga sīkdatnes izmantojam tikai ar tavu piekrišanu, ko vari mainīt jebkurā laikā.",
          },
          {
            key: "legal.cookies.categories.p2",
            fallback:
              "Mārketinga izsekošanu pašlaik neizmantojam. Kategorija ir sagatavota nākotnes rīkiem; piekrišana tos neieslēdz automātiski, kamēr tādi rīki nav pievienoti.",
          },
        ],
      },
      {
        id: "necessary",
        titleKey: "legal.cookies.necessary.title",
        titleFallback: "3. Obligātās sīkdatnes",
        paragraphs: [
          {
            key: "legal.cookies.necessary.p1",
            fallback:
              "Obligātās sīkdatnes ir vajadzīgas, lai vietne darbotos: saglabājam tavu sīkdatņu izvēli (routine-app-cookie-consent), uzturam pieslēgšanās sesiju (Supabase auth token, routine-app-remember-session līdz 30 dienām) un OAuth stāvokli integrācijām.",
          },
          {
            key: "legal.cookies.necessary.p2",
            fallback:
              "Valodas izvēli (routine-app-language, routine-app-language-chosen) glabājam, lai rādītu pareizo saskarnes valodu. Tās ir funkcionāli nepieciešamas un netiek izmantotas reklāmai.",
          },
          {
            key: "legal.cookies.necessary.p3",
            fallback:
              "Šīs sīkdatnes nevar izslēgt produktā. Tās vari bloķēt pārlūka iestatījumos, taču tad {SYSTEM_NAME} var nestrādāt pareizi.",
          },
        ],
      },
      {
        id: "preferences",
        titleKey: "legal.cookies.preferences.title",
        titleFallback: "4. Preferenču sīkdatnes",
        paragraphs: [
          {
            key: "legal.cookies.preferences.p1",
            fallback:
              "Preferenču sīkdatnes atceras saskarnes izvēles, piemēram, saraksta logu (Uzdevumi, Faili, Saraksts) kārtību (routine-app-list-window-order).",
          },
          {
            key: "legal.cookies.preferences.p2",
            fallback:
              "Šīs sīkdatnes rakstām tikai tad, ja tu tām piekrīti. Ja atsakies, izvēles paliek tikai līdz lapas pārlādei.",
          },
        ],
      },
      {
        id: "analytics",
        titleKey: "legal.cookies.analytics.title",
        titleFallback: "5. Statistikas sīkdatnes",
        paragraphs: [
          {
            key: "legal.cookies.analytics.p1",
            fallback:
              "Ja administrators ir ieslēdzis Umami analītiku un tu piekrīti statistikas sīkdatnēm, ielādējam Umami skriptu, lai anonīmi skaitītu lapas apmeklējumus. Umami var izmantot savas sīkdatnes vai līdzīgas identifikatorus.",
          },
          {
            key: "legal.cookies.analytics.p2",
            fallback:
              "Bez tavas piekrišanas Umami netiek ielādēts. Analītika nav obligāta pakalpojuma darbībai.",
          },
        ],
      },
      {
        id: "third_party",
        titleKey: "legal.cookies.third_party.title",
        titleFallback: "6. Citi tehnoloģiju partneri",
        paragraphs: [
          {
            key: "legal.cookies.third_party.p1",
            fallback:
              "Cloudflare Turnstile (pieslēgšanās un reģistrācija) var iestatīt sīkdatnes vai apstrādāt IP adresi botu pārbaudei. Sentry (ja ieslēgts) var vākt kļūdu informāciju un ierīces datus, lai uzlabotu stabilitāti; PII tiek maskēts pirms sūtīšanas.",
          },
          {
            key: "legal.cookies.third_party.p2",
            fallback:
              "Stripe maksājumu lapās var izmantot savas sīkdatnes maksājumu drošībai. Google un Microsoft OAuth plūsmās var tikt izmantotas to pakalpojumu sīkdatnes, ja tu jau esi pieslēdzies attiecīgajā kontā.",
          },
        ],
      },
      {
        id: "local_storage",
        titleKey: "legal.cookies.local_storage.title",
        titleFallback: "7. Vietējā krātuve (localStorage)",
        paragraphs: [
          {
            key: "legal.cookies.local_storage.p1",
            fallback:
              "Lietojam localStorage, lai saglabātu sānjoslas koka stāvokli, aktīvās komandas izvēli, laika joslas sinhronizāciju un dažu failu kešu ātrākai ielādei. Šie dati paliek tavā pārlūkā un netiek pārdoti trešajām personām.",
          },
          {
            key: "legal.cookies.local_storage.p2",
            fallback:
              "localStorage vari notīrīt pārlūka iestatījumos; daļa preferences var pazust, bet konta dati paliek serverī.",
          },
        ],
      },
      {
        id: "manage",
        titleKey: "legal.cookies.manage.title",
        titleFallback: "8. Kā pārvaldīt piekrišanu",
        paragraphs: [
          {
            key: "legal.cookies.manage.p1",
            fallback:
              "Pirmo reizi atverot vietni, parādās sīkdatņu logs. Vari piekrist visām, atteikt neobligātās vai pielāgot kategorijas.",
          },
          {
            key: "legal.cookies.manage.p2",
            fallback:
              "Izvēli vari mainīt jebkurā laikā ar Sīkdatņu iestatījumi lapas kājenē. Piekrišanu glabājam līdz 180 dienām.",
          },
        ],
      },
      {
        id: "changes",
        titleKey: "legal.cookies.changes.title",
        titleFallback: "9. Izmaiņas",
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
