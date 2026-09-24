import { Suspense } from "react";
import type { Metadata } from "next";
import { FactoryPageLazy } from "@/app/components/lazy-heavy-pages";
import { LoadingState } from "@/app/components/loading-state";
import { requireFrontendModule } from "@/app/lib/frontend-modules/access";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { translatedPageMetadata } from "@/app/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata(
    "frontend_modules.label.module_factory",
    "Rūpnīca",
  );
}

export default async function TeamFactoryRoute() {
  await requireFrontendModule(FRONTEND_MODULE_KEYS.factory);
  return (
    <Suspense fallback={<LoadingState />}>
      <FactoryPageLazy />
    </Suspense>
  );
}
