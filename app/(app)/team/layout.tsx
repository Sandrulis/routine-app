import type { ReactNode } from "react";
import type { Metadata } from "next";
import { translatedPageMetadata } from "@/app/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("nav.team", "Komanda");
}

export default function TeamLayout({ children }: { children: ReactNode }) {
  return children;
}
