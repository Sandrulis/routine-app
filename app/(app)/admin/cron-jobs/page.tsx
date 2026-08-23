import type { Metadata } from "next";
import { AdminCronJobsForm } from "@/app/components/admin-cron-jobs-form";
import { listCronJobs } from "@/app/lib/cron-jobs/repository";
import { translatedPageMetadata } from "@/app/lib/page-metadata";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("admin.nav.cron_jobs", "Cron jobs");
}

export default async function AdminCronJobsPage() {
  await requireAdmin();
  const jobs = await listCronJobs();
  return <AdminCronJobsForm initialJobs={jobs} />;
}
