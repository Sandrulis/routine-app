import type { Metadata } from "next";
import { DashboardHomePage } from "@/app/components/dashboard-home-page";
import { translatedPageMetadata } from "@/app/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("nav.home", "Sākums");
}

export default function DashboardPage() {
  return <DashboardHomePage />;
}
