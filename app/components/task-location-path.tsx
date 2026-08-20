"use client";

import Link from "next/link";
import { Fragment, type MouseEvent } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import type { TaskLocationSegment } from "@/app/lib/lists";

const segmentClassName =
  "inline-flex min-w-0 max-w-[9rem] items-center gap-1 text-zinc-500 sm:max-w-[12rem]";
const linkClassName = `${segmentClassName} underline-offset-2 transition hover:text-blue-700 hover:underline`;

function segmentIconClass(type: TaskLocationSegment["type"]): string {
  if (type === "list") return "fas fa-list-ul";
  if (type === "folder") return "far fa-folder";
  return "fas fa-list-check";
}

function SegmentLabel({
  type,
  label,
}: {
  type: TaskLocationSegment["type"];
  label: string;
}) {
  return (
    <>
      <i
        className={`${segmentIconClass(type)} shrink-0 text-[9px] text-zinc-400`}
        aria-hidden="true"
      />
      <span className="truncate">{label}</span>
    </>
  );
}

export function TaskLocationPath({
  segments,
  align = "right",
  interactive = true,
  onNavigate,
  className = "",
}: {
  segments: TaskLocationSegment[];
  align?: "left" | "right";
  interactive?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const { t } = useTranslations();

  if (segments.length === 0) return null;

  function handleNavigate(event: MouseEvent<HTMLAnchorElement>) {
    event.stopPropagation();
    onNavigate?.();
  }

  const Wrapper = interactive ? "nav" : "span";

  return (
    <Wrapper
      aria-label={t("breadcrumb.label", "Ceļš")}
      className={`flex min-w-0 flex-wrap items-center gap-1 text-[11px] ${
        align === "right" ? "justify-end" : "justify-start"
      } ${className}`.trim()}
    >
      {segments.map((segment, index) => {
        const href =
          segment.type === "list"
            ? `/lists/${segment.listId}`
            : `/lists/${segment.listId}/tasks/${segment.taskId}`;
        return (
          <Fragment
            key={
              segment.type === "list"
                ? `list-${segment.listId}`
                : `task-${segment.taskId}`
            }
          >
            {index > 0 ? (
              <i
                className="fas fa-angle-right shrink-0 text-[9px] text-zinc-300"
                aria-hidden="true"
              />
            ) : null}
            {interactive ? (
              <Link
                href={href}
                onClick={handleNavigate}
                className={linkClassName}
                title={segment.label}
              >
                <SegmentLabel type={segment.type} label={segment.label} />
              </Link>
            ) : (
              <span className={segmentClassName} title={segment.label}>
                <SegmentLabel type={segment.type} label={segment.label} />
              </span>
            )}
          </Fragment>
        );
      })}
    </Wrapper>
  );
}
