import type { Metadata } from "next";
import { TemplatesPage } from "@/app/components/templates-page";
import { translatedPageMetadata } from "@/app/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("nav.templates", "Šabloni");
}

export default function TemplatesIndexPage() {
  return <TemplatesPage />;
}
