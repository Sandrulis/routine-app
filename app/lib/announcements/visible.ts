import { cookies } from "next/headers";
import { listActiveSiteAnnouncements } from "@/app/lib/announcements/repository";
import { announcementSeenCookieName } from "@/app/lib/announcements/seen-cookie";
import type { SiteAnnouncementSummary } from "@/app/lib/announcements/types";

export async function listVisibleSiteAnnouncements(): Promise<
  SiteAnnouncementSummary[]
> {
  const announcements = await listActiveSiteAnnouncements();
  if (announcements.length === 0) return [];

  const cookieStore = await cookies();
  return announcements.filter(
    (item) => cookieStore.get(announcementSeenCookieName(item.id))?.value !== "1",
  );
}
