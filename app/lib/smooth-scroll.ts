let scrollToken = 0;
let pollToken = 0;
const pendingTargets = new Map<string, HTMLElement>();

function headerOffset(): number {
  const header = document.querySelector("header");
  if (!(header instanceof HTMLElement)) return 0;
  return header.getBoundingClientRect().height;
}

function setRootScrollBehavior(value: string) {
  document.documentElement.style.scrollBehavior = value;
}

function findHashTarget(id: string): HTMLElement | null {
  const current = document.getElementById(id);
  if (current) return current;
  const pending = pendingTargets.get(id);
  return pending && pending.isConnected ? pending : null;
}

function animateWindowScroll(top: number, reducedMotion: boolean, onDone: () => void) {
  const token = ++scrollToken;
  const finish = () => {
    if (token !== scrollToken) return;
    setRootScrollBehavior("");
    onDone();
  };

  setRootScrollBehavior("auto");

  if (reducedMotion) {
    window.scrollTo({ top, behavior: "auto" });
    finish();
    return;
  }

  const from = window.scrollY;
  const distance = top - from;
  if (Math.abs(distance) < 2) {
    finish();
    return;
  }

  const duration = Math.min(900, Math.max(450, Math.abs(distance) * 0.45));
  const start = performance.now();
  const ease = (progress: number) => 1 - (1 - progress) ** 3;

  const step = (now: number) => {
    if (token !== scrollToken) return;
    const progress = Math.min(1, (now - start) / duration);
    window.scrollTo({
      top: from + distance * ease(progress),
      behavior: "auto",
    });
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      finish();
    }
  };

  window.requestAnimationFrame(step);
}

function waitForStableTarget(target: HTMLElement, onReady: () => void) {
  let lastTop = target.getBoundingClientRect().top;
  let stableFrames = 0;
  let frames = 0;
  const maxFrames = 24;

  const tick = () => {
    if (!target.isConnected) {
      onReady();
      return;
    }
    const top = target.getBoundingClientRect().top;
    if (Math.abs(top - lastTop) < 1) {
      stableFrames += 1;
    } else {
      stableFrames = 0;
      lastTop = top;
    }
    frames += 1;
    if (stableFrames >= 2 || frames >= maxFrames) {
      onReady();
      return;
    }
    window.requestAnimationFrame(tick);
  };

  window.requestAnimationFrame(tick);
}

export function scrollToHashIdWhenReady(
  id: string,
  url?: string,
  options?: { attempts?: number; intervalMs?: number },
): void {
  const attempts = options?.attempts ?? 40;
  const intervalMs = options?.intervalMs ?? 50;
  const token = ++pollToken;
  scrollToken += 1;
  let remaining = attempts;

  const tryScroll = () => {
    if (token !== pollToken) return;
    const target = findHashTarget(id);
    if (!target) {
      remaining -= 1;
      if (remaining <= 0) return;
      window.setTimeout(tryScroll, intervalMs);
      return;
    }
    waitForStableTarget(target, () => {
      if (token !== pollToken) return;
      scrollToHashId(id, url);
    });
  };

  tryScroll();
}

export function scrollToHashId(id: string, url?: string): boolean {
  const target = findHashTarget(id);
  if (!target) return false;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const top = Math.max(
    0,
    window.scrollY + target.getBoundingClientRect().top - headerOffset(),
  );

  const nextUrl = url ?? "";
  const currentUrl = `${window.location.pathname}${window.location.hash}`;
  const shouldUpdateUrl = Boolean(nextUrl) && currentUrl !== nextUrl;

  if (shouldUpdateUrl && target.id === id) {
    pendingTargets.set(id, target);
    target.removeAttribute("id");
    window.history.replaceState(null, "", nextUrl);
  }

  animateWindowScroll(top, reducedMotion, () => {
    if (pendingTargets.get(id) === target && !target.id) {
      target.id = id;
    }
    pendingTargets.delete(id);
  });
  return true;
}
