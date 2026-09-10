"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { LoadingState } from "@/app/components/loading-state";

export const LANDING_REVEAL_EVENT = "landing:reveal";

function DefaultLazyFallback() {
  return <LoadingState className="min-h-[16rem]" />;
}

export function LazyOnVisible({
  children,
  fallback,
  rootMargin = "480px 0px",
}: {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (visible) return;
    const node = ref.current;
    if (!node) return;

    const reveal = () => setVisible(true);
    const hash = window.location.hash.replace(/^#/, "");
    if (hash === "features" || hash === "pricing" || hash === "faq") {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        reveal();
        observer.disconnect();
      },
      { rootMargin, threshold: 0.01 },
    );
    observer.observe(node);
    window.addEventListener(LANDING_REVEAL_EVENT, reveal);
    return () => {
      observer.disconnect();
      window.removeEventListener(LANDING_REVEAL_EVENT, reveal);
    };
  }, [rootMargin, visible]);

  useEffect(() => {
    if (!visible || ready) return;
    let inner = 0;
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => setReady(true));
    });
    return () => {
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
    };
  }, [ready, visible]);

  return (
    <div ref={ref}>
      {ready ? children : (fallback ?? <DefaultLazyFallback />)}
    </div>
  );
}
