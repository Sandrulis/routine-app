import { listColorById } from "@/app/lib/lists";
import {
  DEFAULT_SITE_LOGO_COLOR,
  siteHeadIconUrl,
} from "@/app/lib/site-admin/branding";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export async function getExtensionBranding() {
  const settings = await getSiteSettings();
  const logoColor = settings.logoColor || DEFAULT_SITE_LOGO_COLOR;
  const tone = listColorById(logoColor);
  return {
    systemName: settings.systemName,
    logoUrl: siteHeadIconUrl(
      settings.logoUrl,
      settings.faviconUrl,
      settings.systemName,
      logoColor,
    ),
    logoColor: tone.id,
    logoColorBg: tone.bg,
    logoColorFg: tone.fg,
    uploadedLogoUrl: settings.logoUrl,
  };
}
