"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLanguageCode, LANGUAGE_COOKIE } from "@/app/lib/i18n/language";

export async function setLanguageAction(languageCode: string) {
  if (!isLanguageCode(languageCode)) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(LANGUAGE_COOKIE, languageCode, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
