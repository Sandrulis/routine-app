"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const DEFAULT_THRESHOLD = 40;
const DEFAULT_OVERSCAN = 8;

export function VirtualWindow({
  count,
  itemHeight,
  overscan = DEFAULT_OVERSCAN,
  threshold = DEFAULT_THRESHOLD,
  className = "",
  children,
}: {
  count: number;
  itemHeight: number;
  overscan?: number;
  threshold?: number;
  className?: string;
  children: (index: number) => ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(itemHeight * 12);

  useEffect(() => {
    const node = scrollerRef.current;
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
  }, [itemHeight]);

  if (count <= threshold) {
    return (
      <div className={className}>
        {Array.from({ length: count }, (_, index) => children(index))}
      </div>
    );
  }

  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(viewportHeight / itemHeight) + overscan * 2;
  const end = Math.min(count, start + visibleCount);

  return (
    <div ref={scrollerRef} className={className}>
      <div style={{ height: start * itemHeight }} />
      {Array.from({ length: end - start }, (_, offset) =>
        children(start + offset),
      )}
      <div style={{ height: (count - end) * itemHeight }} />
    </div>
  );
}
