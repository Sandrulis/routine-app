import type { ReactNode } from "react";

export function PageSectionHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          {title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
