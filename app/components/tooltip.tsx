"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type TooltipProps = {
  label: string;
  children: ReactNode;
  className?: string;
  align?: "center" | "start" | "end";
};

type TooltipPosition = {
  top: number;
  left: number;
};

const GAP_PX = 6;
const VIEWPORT_PADDING_PX = 12;
const DESKTOP_HOVER_UI = "(min-width: 1024px)";

function useDesktopHoverUi() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_HOVER_UI);
    function sync() {
      setEnabled(media.matches);
    }
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return enabled;
}

function computeTooltipPosition(
  triggerRect: DOMRect,
  tooltipSize: { width: number; height: number },
  align: "center" | "start" | "end",
): TooltipPosition {
  const preferTop =
    triggerRect.top >= tooltipSize.height + GAP_PX + VIEWPORT_PADDING_PX;

  const top = preferTop
    ? triggerRect.top - GAP_PX - tooltipSize.height
    : triggerRect.bottom + GAP_PX;

  let left: number;
  if (align === "start") {
    left = triggerRect.left;
  } else if (align === "end") {
    left = triggerRect.right - tooltipSize.width;
  } else {
    left = triggerRect.left + triggerRect.width / 2 - tooltipSize.width / 2;
  }

  const maxLeft = Math.max(
    VIEWPORT_PADDING_PX,
    window.innerWidth - VIEWPORT_PADDING_PX - tooltipSize.width,
  );
  const maxTop = Math.max(
    VIEWPORT_PADDING_PX,
    window.innerHeight - VIEWPORT_PADDING_PX - tooltipSize.height,
  );

  return {
    top: Math.min(Math.max(VIEWPORT_PADDING_PX, top), maxTop),
    left: Math.min(Math.max(VIEWPORT_PADDING_PX, left), maxLeft),
  };
}

export function OptionalTooltip({
  label,
  children,
  className = "",
  align = "start",
}: {
  label?: string | null;
  children: ReactNode;
  className?: string;
  align?: "center" | "start" | "end";
}) {
  const text = label?.trim();
  if (!text) return children;
  return (
    <Tooltip label={text} className={className} align={align}>
      {children}
    </Tooltip>
  );
}

export function Tooltip({
  label,
  children,
  className = "",
  align = "center",
}: TooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const [isPositioned, setIsPositioned] = useState(false);
  const [mounted, setMounted] = useState(false);
  const desktopHover = useDesktopHoverUi();

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    setPosition(
      computeTooltipPosition(
        trigger.getBoundingClientRect(),
        { width: tooltip.offsetWidth, height: tooltip.offsetHeight },
        align,
      ),
    );
    setIsPositioned(true);
  }, [align]);

  const show = useCallback(() => {
    if (!desktopHover) return;
    setIsPositioned(false);
    setVisible(true);
  }, [desktopHover]);

  const hide = useCallback(() => {
    setVisible(false);
    setIsPositioned(false);
    setPosition(null);
  }, []);

  useEffect(() => {
    if (!desktopHover) hide();
  }, [desktopHover, hide]);

  useLayoutEffect(() => {
    if (!visible || !mounted) return;
    updatePosition();
  }, [visible, mounted, label, align, updatePosition]);

  useEffect(() => {
    if (!visible) return;

    function handleReposition() {
      updatePosition();
    }

    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);

    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [visible, updatePosition]);

  const textAlignClass =
    align === "start" ? "text-left" : align === "end" ? "text-right" : "text-center";

  const tooltipNode =
    visible && mounted
      ? createPortal(
          <span
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            style={{
              position: "fixed",
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              zIndex: 80,
              opacity: isPositioned ? 1 : 0,
              pointerEvents: "none",
            }}
            className={`w-max max-w-[min(22rem,calc(100vw-1.5rem))] whitespace-pre-wrap rounded-md bg-black px-3 py-1.5 text-[11px] font-medium leading-snug text-white shadow-lg ${textAlignClass}`}
          >
            {label}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={triggerRef}
        className={`inline-flex ${className}`.trim()}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            hide();
          }
        }}
      >
        {children}
      </span>
      {tooltipNode}
    </>
  );
}

function isElementOverflowing(element: HTMLElement): boolean {
  return (
    element.scrollWidth > element.clientWidth + 1 ||
    element.scrollHeight > element.clientHeight + 1
  );
}

export function OverflowTooltip({
  label,
  extraLabel,
  children,
  className = "",
  align = "start",
}: {
  label: string;
  extraLabel?: string | null;
  children: ReactNode;
  className?: string;
  align?: "center" | "start" | "end";
}) {
  const measureRef = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  const updateTruncation = useCallback(() => {
    const root = measureRef.current;
    if (!root) return;
    const nodes = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];
    setTruncated(nodes.some(isElementOverflowing));
  }, []);

  useLayoutEffect(() => {
    updateTruncation();
    const root = measureRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateTruncation);
    observer.observe(root);
    return () => observer.disconnect();
  }, [extraLabel, label, updateTruncation]);

  const extra = extraLabel?.trim() || "";
  const tooltipText = truncated
    ? [label.trim(), extra].filter(Boolean).join("\n")
    : extra;

  const content = (
    <span ref={measureRef} className={`min-w-0 ${className}`.trim()}>
      {children}
    </span>
  );

  if (!tooltipText) return content;

  return (
    <Tooltip label={tooltipText} className={className} align={align}>
      {content}
    </Tooltip>
  );
}
