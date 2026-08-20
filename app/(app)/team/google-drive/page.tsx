import { Suspense } from "react";
import type { Metadata } from "next";
import { TeamGoogleDrivePageLazy } from "@/app/components/lazy-heavy-pages";
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
      <TeamGoogleDrivePageLazy />
    </Suspense>
  );
}
