"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "@/app/components/translations-provider";

const overlayBaseClassName =
  "fixed inset-0 flex items-center justify-center p-4";
const defaultOverlayZClassName = "z-50";

const backdropClassName = "absolute inset-0 bg-zinc-900/40";

const panelBaseClassName =
  "relative max-h-[calc(100%-2rem)] w-full overflow-x-hidden overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl";

const defaultPanelMaxWidthClassName = "max-w-md";

let openModalCount = 0;

export const appModalWidePanelMaxWidthClassName = "max-w-[33.6rem]";
export const appModalExtraWidePanelMaxWidthClassName = "max-w-[40.04rem]";
export const appModalSplitPanelMaxWidthClassName = "max-w-5xl";

function isBackdropDismissTarget(target: Node, panel: HTMLElement | null): boolean {
  if (panel?.contains(target)) {
    return false;
  }

  if (target instanceof Element && target.closest("[data-app-modal-ignore-backdrop]")) {
    return false;
  }

  return true;
}

type AppModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  blocking?: boolean;
  dirty?: boolean;
  panelMaxWidthClassName?: string;
  overlayZClassName?: string;
  headerMeta?: ReactNode;
};

export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  blocking = false,
  dirty = false,
  panelMaxWidthClassName = defaultPanelMaxWidthClassName,
  overlayZClassName = defaultOverlayZClassName,
  headerMeta,
}: AppModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const confirmPanelRef = useRef<HTMLDivElement>(null);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const modalDepthRef = useRef(0);
  const { t } = useTranslations();

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeDirectly = useCallback(() => {
    if (blocking) return;
    setConfirmExitOpen(false);
    onOpenChange(false);
  }, [blocking, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setConfirmExitOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    openModalCount += 1;
    modalDepthRef.current = openModalCount;
    return () => {
      openModalCount -= 1;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function submitModalForm(target: EventTarget | null) {
      const element = target instanceof HTMLElement ? target : null;
      if (
        element?.tagName === "TEXTAREA" ||
        element?.tagName === "SELECT" ||
        (element instanceof HTMLButtonElement && element.type !== "submit")
      ) {
        return;
      }

      const form =
        element?.closest("form") ??
        panelRef.current?.querySelector<HTMLFormElement>("form");

      if (!form) return;
      form.requestSubmit();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (modalDepthRef.current !== openModalCount) return;

      if (event.key === "Escape") {
        if (blocking) return;
        if (confirmExitOpen) {
          event.preventDefault();
          setConfirmExitOpen(false);
          return;
        }

        event.preventDefault();
        closeDirectly();
        return;
      }

      if (event.key !== "Enter" || event.shiftKey) return;

      if (confirmExitOpen) {
        event.preventDefault();
        setConfirmExitOpen(false);
        return;
      }

      const form = panelRef.current?.querySelector<HTMLFormElement>("form");
      if (!form) return;

      event.preventDefault();
      submitModalForm(event.target);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, blocking, confirmExitOpen, closeDirectly]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (blocking || confirmExitOpen) return;
    if (!isBackdropDismissTarget(event.target as Node, panelRef.current)) return;
    if (dirty) {
      setConfirmExitOpen(true);
      return;
    }
    closeDirectly();
  }

  function handleConfirmBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (confirmPanelRef.current?.contains(event.target as Node)) return;
    setConfirmExitOpen(false);
  }

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <>
      <div
        className={`${overlayBaseClassName} ${overlayZClassName}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onMouseDown={handleBackdropClick}
      >
        <div className={backdropClassName} aria-hidden="true" />
        <div
          ref={panelRef}
          className={`${panelBaseClassName} ${panelMaxWidthClassName}`}
        >
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-lg font-semibold text-zinc-900">
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="mt-1 text-sm text-zinc-500">
                    {description}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {headerMeta}
                {blocking ? null : (
                  <button
                    type="button"
                    onClick={closeDirectly}
                    aria-label={t("actions.close", "Aizvērt")}
                    className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                  >
                    <i className="fas fa-times" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>

      {confirmExitOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-exit-title"
          onMouseDown={handleConfirmBackdropClick}
        >
          <div className="absolute inset-0 bg-zinc-900/50" aria-hidden="true" />
          <div
            ref={confirmPanelRef}
            className={`${panelBaseClassName} max-w-sm`}
          >
            <div className="p-6">
              <h2 id="confirm-exit-title" className="text-lg font-semibold text-zinc-900">
                {t("modal.confirm_exit.title", "Izbeigt darbību?")}
              </h2>
              <p className="mt-2 text-sm text-zinc-600">
                {t(
                  "modal.confirm_exit.description",
                  "Vai vēlaties izbeigt šo darbību?",
                )}
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmExitOpen(false)}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  {t("actions.continue", "Turpināt")}
                </button>
                <button
                  type="button"
                  onClick={closeDirectly}
                  className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
                >
                  {t("actions.end", "Izbeigt")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>,
    document.body,
  );
}
