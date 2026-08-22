import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NO_INDEX_ROBOTS } from "@/app/lib/seo/metadata";

export const metadata: Metadata = {
  robots: NO_INDEX_ROBOTS,
};

export default function InviteLayout({ children }: { children: ReactNode }) {
  return children;
}
