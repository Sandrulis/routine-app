"use client";

import dynamic from "next/dynamic";
import { LoadingState } from "@/app/components/loading-state";

const loading = () => <LoadingState />;

export const TeamGoogleDrivePageLazy = dynamic(
  () =>
    import("@/app/components/team-google-drive-page").then((mod) => ({
      default: mod.TeamGoogleDrivePage,
    })),
  { ssr: false, loading },
);

export const TeamOneDrivePageLazy = dynamic(
  () =>
    import("@/app/components/team-onedrive-page").then((mod) => ({
      default: mod.TeamOneDrivePage,
    })),
  { ssr: false, loading },
);

export const TeamBillingPageLazy = dynamic(
  () =>
    import("@/app/components/team-billing-page").then((mod) => ({
      default: mod.TeamBillingPage,
    })),
  { ssr: false, loading },
);
