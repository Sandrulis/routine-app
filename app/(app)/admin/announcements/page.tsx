import type { Metadata } from "next";
import { AdminAnnouncementsManager } from "@/app/components/admin-announcements-manager";
import { listSiteAnnouncements } from "@/app/lib/announcements/repository";
import { translatedPageMetadata } from "@/app/lib/page-metadata";
import { listSiteLanguages } from "@/app/lib/site-admin/repository";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("admin.nav.announcements", "Paziņojumi");
}

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const [announcements, languages] = await Promise.all([
    listSiteAnnouncements(),
    listSiteLanguages(),
  ]);

  return (
    <AdminAnnouncementsManager
      announcements={announcements}
      languages={languages}
    />
  );
}
