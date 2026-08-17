import type { Metadata } from "next";
import { LandingPage } from "@/app/components/landing-page";

export const metadata: Metadata = {
  title: "Routine",
  description: "Komandas darba rīks sarakstiem, uzdevumiem un komandai.",
};

export default function HomePage() {
  return <LandingPage />;
}
