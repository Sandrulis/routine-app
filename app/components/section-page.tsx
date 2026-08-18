import { PageSectionHeader } from "@/app/components/page-section-header";
import type { ReactNode } from "react";

export function SectionPage({
  title,
  subtitle,
  actions,
  children,
}: {
  title: ReactNode;
  subtitle: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="page">
      <div className="space-y-3">
        <PageSectionHeader
          title={title}
          subtitle={subtitle}
          actions={actions}
        />
        {children}
      </div>
    </main>
  );
}
