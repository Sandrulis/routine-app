import { Suspense } from "react";
import type { Metadata } from "next";
import { TeamGoogleDrivePage } from "@/app/components/team-google-drive-page";
import { LoadingState } from "@/app/components/loading-state";
import { requireFrontendModules } from "@/app/lib/frontend-modules/access";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { translatedPageMetadata } from "@/app/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("nav.google_drive", "Google Drive Integrācija");
}

export default async function TeamGoogleDriveRoute() {
  await requireFrontendModules([
    FRONTEND_MODULE_KEYS.googleDrive,
    FRONTEND_MODULE_KEYS.fileUpload,
  ]);
  return (
    <Suspense fallback={<LoadingState />}>
      <TeamGoogleDrivePage />
    </Suspense>
  );
}
