import type { Metadata } from "next";
import { TemplatesPage } from "@/app/components/templates-page";
import { requireFrontendModule } from "@/app/lib/frontend-modules/access";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { translatedPageMetadata } from "@/app/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("nav.templates", "Šabloni");
}

export default async function TemplatesIndexPage() {
  await requireFrontendModule(FRONTEND_MODULE_KEYS.templates);
  return <TemplatesPage />;
}
