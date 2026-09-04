"use client";

import Link from "next/link";
import { Fragment, type MouseEvent } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import type { TaskLocationSegment } from "@/app/lib/lists";

const truncatedSegmentClassName =
  "inline-flex min-w-0 max-w-[9rem] items-center gap-1 whitespace-nowrap text-zinc-500 sm:max-w-[12rem]";
const expandedSegmentClassName =
  "inline-flex min-w-0 items-center gap-1 whitespace-nowrap text-zinc-500";

function segmentIconClass(type: TaskLocationSegment["type"]): string {
  if (type === "list") return "fas fa-list-ul";
  if (type === "folder") return "far fa-folder";
  return "fas fa-list-check";
}

function SegmentLabel({
  type,
  label,
  truncate,
}: {
  type: TaskLocationSegment["type"];
  label: string;
  truncate: boolean;
}) {
  return (
    <>
      <i
        className={`${segmentIconClass(type)} shrink-0 text-[9px] text-zinc-400`}
        aria-hidden="true"
      />
      <span className={truncate ? "truncate" : ""}>{label}</span>
    </>
  );
}

export function TaskLocationPath({
  segments,
  align = "right",
  interactive = true,
  nowrap = false,
  fill = false,
  onNavigate,
  className = "",
}: {
  segments: TaskLocationSegment[];
  align?: "left" | "right";
  interactive?: boolean;
  nowrap?: boolean;
  fill?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const { t } = useTranslations();
  const segmentClassName =
    nowrap || fill ? expandedSegmentClassName : truncatedSegmentClassName;
  const linkClassName = `${segmentClassName} underline-offset-2 transition hover:text-blue-700 hover:underline`;

  if (segments.length === 0) return null;

  function handleNavigate(event: MouseEvent<HTMLAnchorElement>) {
    event.stopPropagation();
    onNavigate?.();
  }

  const Wrapper = interactive ? "nav" : "span";

  return (
    <Wrapper
      aria-label={t("breadcrumb.label", "Ceļš")}
      className={`flex min-w-0 items-center gap-1 text-[11px] ${
        fill ? "w-full" : ""
      } ${
        nowrap
          ? "flex-nowrap overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "flex-wrap"
      } ${align === "right" ? "justify-end" : "justify-start"} ${className}`.trim()}
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
                <SegmentLabel
                  type={segment.type}
                  label={segment.label}
                  truncate={!nowrap}
                />
              </Link>
            ) : (
              <span className={segmentClassName} title={segment.label}>
                <SegmentLabel
                  type={segment.type}
                  label={segment.label}
                  truncate={!nowrap}
                />
              </span>
            )}
          </Fragment>
        );
      })}
    </Wrapper>
  );
}
