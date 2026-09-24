import type { Metadata } from "next";
import { FactoryPortal } from "@/app/components/factory-portal";
import {
  factoryPortalAvailable,
  factoryPortalTimeTracking,
  listFactorySharedJobs,
  loadFactoryPortalUser,
} from "@/app/lib/factory/portal";
import { NO_INDEX_ROBOTS } from "@/app/lib/seo/metadata";

export const metadata: Metadata = {
  title: "Factory",
  robots: NO_INDEX_ROBOTS,
};

export default async function FactoryPortalPage() {
  const [available, user, timeTracking] = await Promise.all([
    factoryPortalAvailable(),
    loadFactoryPortalUser(),
    factoryPortalTimeTracking(),
  ]);
  const jobs = user ? await listFactorySharedJobs() : [];

  return (
    <FactoryPortal
      available={available}
      user={user}
      jobs={jobs}
      timeTracking={timeTracking}
    />
  );
}
