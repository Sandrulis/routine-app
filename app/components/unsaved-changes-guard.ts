"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

function isInternalNavigationLink(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false;

  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return false;
    return !(
      url.pathname === window.location.pathname && url.search === window.location.search
    );
  } catch {
    return href.startsWith("/");
  }
}

type UseUnsavedChangesGuardOptions = {
  isDirty: boolean;
  enabled?: boolean;
};

export function useUnsavedChangesGuard({
  isDirty,
  enabled = true,
}: UseUnsavedChangesGuardOptions) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingHrefRef = useRef<string | null>(null);
  const allowLeaveRef = useRef(false);

  const requestLeave = useCallback((href: string) => {
    pendingHrefRef.current = href;
    setConfirmOpen(true);
  }, []);

  const stayOnPage = useCallback(() => {
    pendingHrefRef.current = null;
    setConfirmOpen(false);
  }, []);

  const confirmLeave = useCallback(() => {
    const href = pendingHrefRef.current;
    pendingHrefRef.current = null;
    setConfirmOpen(false);
    allowLeaveRef.current = true;
    if (href) router.push(href);
  }, [router]);

  useEffect(() => {
    if (!enabled || !isDirty) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (allowLeaveRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled, isDirty]);

  useEffect(() => {
    if (!enabled || !isDirty) return;
    function handleDocumentClick(event: MouseEvent) {
      if (allowLeaveRef.current) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!isInternalNavigationLink(anchor)) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      event.preventDefault();
      event.stopPropagation();
      requestLeave(href);
    }
    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [enabled, isDirty, requestLeave]);

  useEffect(() => {
    if (!isDirty) allowLeaveRef.current = false;
  }, [isDirty]);

  return { confirmOpen, stayOnPage, confirmLeave };
}
