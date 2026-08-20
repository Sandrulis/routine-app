import { Suspense } from "react";
import type { Metadata } from "next";
import { TeamOneDrivePage } from "@/app/components/team-onedrive-page";
import { LoadingState } from "@/app/components/loading-state";
import { requireFrontendModules } from "@/app/lib/frontend-modules/access";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { translatedPageMetadata } from "@/app/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("nav.onedrive", "OneDrive Integrācija");
}

export default async function TeamOneDriveRoute() {
  await requireFrontendModules([
    FRONTEND_MODULE_KEYS.onedrive,
    FRONTEND_MODULE_KEYS.fileUpload,
  ]);
  return (
    <Suspense fallback={<LoadingState />}>
      <TeamOneDrivePage />
    </Suspense>
  );
}
