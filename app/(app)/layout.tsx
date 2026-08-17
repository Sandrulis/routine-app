import type { ReactNode } from "react";
import { AppProviders } from "@/app/components/app-providers";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
