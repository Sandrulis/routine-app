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
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-2">
      <div className="min-w-0 flex-1">
        <h1 className="min-w-0 max-w-full text-base font-semibold tracking-tight text-zinc-900 sm:text-xl">
          {title}
        </h1>
        <p className="mt-1 line-clamp-2 text-sm break-words text-zinc-500">
          {subtitle}
        </p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
