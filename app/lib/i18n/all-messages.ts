import { ru } from "@/app/lib/i18n/messages-ru";
import { de } from "@/app/lib/i18n/messages-de";
import { fr } from "@/app/lib/i18n/messages-fr";
import { es } from "@/app/lib/i18n/messages-es";
import { nl } from "@/app/lib/i18n/messages-nl";
import { da } from "@/app/lib/i18n/messages-da";
import { no } from "@/app/lib/i18n/messages-no";
import { fi } from "@/app/lib/i18n/messages-fi";
import { pl } from "@/app/lib/i18n/messages-pl";
import { lt } from "@/app/lib/i18n/messages-lt";
import { et } from "@/app/lib/i18n/messages-et";
import { it } from "@/app/lib/i18n/messages-it";
import { sv } from "@/app/lib/i18n/messages-sv";
import type { LanguageCode } from "@/app/lib/i18n/language";
import { messages } from "@/app/lib/i18n/messages";

export type { LanguageCode };

export const allMessages: Record<LanguageCode, Record<string, string>> = {
  lv: messages.lv,
  en: messages.en,
  ru,
  de,
  fr,
  es,
  nl,
  da,
  no,
  fi,
  pl,
  lt,
  et,
  it,
  sv,
};
