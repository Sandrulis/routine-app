import { type LanguageCode } from "@/app/lib/i18n/language";
import { messages } from "@/app/lib/i18n/messages";

const extraLoaders: Record<
  Exclude<LanguageCode, "lv" | "en">,
  () => Promise<Record<string, string>>
> = {
  ru: () => import("@/app/lib/i18n/messages-ru").then((mod) => mod.ru),
  de: () => import("@/app/lib/i18n/messages-de").then((mod) => mod.de),
  fr: () => import("@/app/lib/i18n/messages-fr").then((mod) => mod.fr),
  es: () => import("@/app/lib/i18n/messages-es").then((mod) => mod.es),
  nl: () => import("@/app/lib/i18n/messages-nl").then((mod) => mod.nl),
  da: () => import("@/app/lib/i18n/messages-da").then((mod) => mod.da),
  no: () => import("@/app/lib/i18n/messages-no").then((mod) => mod.no),
  fi: () => import("@/app/lib/i18n/messages-fi").then((mod) => mod.fi),
  pl: () => import("@/app/lib/i18n/messages-pl").then((mod) => mod.pl),
  lt: () => import("@/app/lib/i18n/messages-lt").then((mod) => mod.lt),
  et: () => import("@/app/lib/i18n/messages-et").then((mod) => mod.et),
  it: () => import("@/app/lib/i18n/messages-it").then((mod) => mod.it),
  sv: () => import("@/app/lib/i18n/messages-sv").then((mod) => mod.sv),
};

export async function loadMessages(
  code: LanguageCode,
): Promise<Record<string, string>> {
  if (code === "lv" || code === "en") {
    return messages[code];
  }
  const loader = extraLoaders[code];
  if (!loader) return messages.lv;
  return loader();
}
