const OVERLAY_ROOT_ID = "routine-app-overlay-root";

let overlayRoot: HTMLElement | null = null;
let overflowLockCount = 0;
let savedBodyOverflow = "";

export function getOverlayPortalRoot(): HTMLElement {
  if (overlayRoot?.isConnected) return overlayRoot;

  const existing = document.getElementById(OVERLAY_ROOT_ID);
  if (existing instanceof HTMLElement) {
    overlayRoot = existing;
    return overlayRoot;
  }

  const root = document.createElement("div");
  root.id = OVERLAY_ROOT_ID;
  document.body.appendChild(root);
  overlayRoot = root;
  return overlayRoot;
}

export function lockBodyOverflow() {
  if (overflowLockCount === 0) {
    savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  overflowLockCount += 1;
}

export function unlockBodyOverflow() {
  overflowLockCount = Math.max(0, overflowLockCount - 1);
  if (overflowLockCount === 0) {
    document.body.style.overflow = savedBodyOverflow;
  }
}
