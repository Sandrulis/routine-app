import { socialShareImage, OG_IMAGE_ALT, OG_IMAGE_SIZE, OG_IMAGE_TYPE } from "@/app/lib/seo/social-image";
import { resolveSystemName } from "@/app/lib/document-title";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export const alt = OG_IMAGE_ALT;
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_TYPE;
export const dynamic = "force-dynamic";

export default async function OpenGraphImage() {
  const [{ t }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);
  const productName = resolveSystemName(settings.systemName, t("app.name", "{SYSTEM_NAME}"));
  const tagline = t(
    "landing.seo.og_tagline",
    "Team tasks in one workspace",
    { name: productName },
  );

  return socialShareImage({ name: productName, tagline });
}
