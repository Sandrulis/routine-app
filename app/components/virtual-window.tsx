"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

const DEFAULT_THRESHOLD = 40;
const DEFAULT_OVERSCAN = 8;

export function VirtualWindow({
  count,
  itemHeight,
  overscan = DEFAULT_OVERSCAN,
  threshold = DEFAULT_THRESHOLD,
  className = "",
  mode = "div",
  colSpan = 1,
  scrollerRef,
  children,
}: {
  count: number;
  itemHeight: number;
  overscan?: number;
  threshold?: number;
  className?: string;
  mode?: "div" | "table";
  colSpan?: number;
  scrollerRef?: RefObject<HTMLElement | null>;
  children: (index: number) => ReactNode;
}) {
  const innerScrollerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(itemHeight * 12);

  useEffect(() => {
    const node = scrollerRef?.current ?? innerScrollerRef.current;
    if (!node) return;

    function sync() {
      if (!node) return;
      setScrollTop(node.scrollTop);
      setViewportHeight(node.clientHeight || itemHeight * 12);
    }

    sync();
    node.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => {
      node.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, [itemHeight, scrollerRef]);

  function spacer(height: number, key: string) {
    if (height <= 0) return null;
    if (mode === "table") {
      return (
        <tr key={key} aria-hidden="true">
          <td
            colSpan={colSpan}
            style={{ height, padding: 0, border: 0 }}
          />
        </tr>
      );
    }
    return <div key={key} style={{ height }} />;
  }

  const items =
    count <= threshold
      ? Array.from({ length: count }, (_, index) => children(index))
      : (() => {
          const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
          const visibleCount = Math.ceil(viewportHeight / itemHeight) + overscan * 2;
          const end = Math.min(count, start + visibleCount);
          return (
            <>
              {spacer(start * itemHeight, "start")}
              {Array.from({ length: end - start }, (_, offset) =>
                children(start + offset),
              )}
              {spacer((count - end) * itemHeight, "end")}
            </>
          );
        })();

  if (mode === "table" || scrollerRef) {
    return <>{items}</>;
  }

  return (
    <div ref={innerScrollerRef} className={className}>
      {items}
    </div>
  );
}
