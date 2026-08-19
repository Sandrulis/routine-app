import type { ReactNode } from "react";
import type { Metadata } from "next";
import { translatedPageMetadata } from "@/app/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("nav.settings", "Uzstādījumi");
}

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children;
}
