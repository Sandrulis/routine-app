import type { Metadata } from "next";
import { ListsOverviewPage } from "@/app/components/lists-overview-page";
import { translatedPageMetadata } from "@/app/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("nav.lists", "Saraksts");
}

export default function ListsIndexPage() {
  return <ListsOverviewPage />;
}
