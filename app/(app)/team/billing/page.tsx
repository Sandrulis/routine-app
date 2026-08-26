import { Suspense } from "react";
import type { Metadata } from "next";
import { TeamBillingPageLazy } from "@/app/components/lazy-heavy-pages";
import { LoadingState } from "@/app/components/loading-state";
import { translatedPageMetadata } from "@/app/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("team.billing.title", "Abonementi");
}

export default function TeamBillingRoute() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TeamBillingPageLazy />
    </Suspense>
  );
}
