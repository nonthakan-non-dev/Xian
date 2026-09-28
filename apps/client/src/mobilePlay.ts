import { isTouchUiActive } from "./touchControls.js";

function isMobilePlayTarget(): boolean {
  if (isTouchUiActive()) return true;
  return window.matchMedia("(pointer: coarse)").matches;
}

export async function requestLandscapeLock(): Promise<void> {
  if (!isMobilePlayTarget()) return;
  const orientation = screen.orientation as ScreenOrientation & {
    lock?: (orientation: string) => Promise<void>;
  };
  if (typeof orientation?.lock !== "function") return;
  try {
    await orientation.lock("landscape");
  } catch {
    /* ต้อง user gesture / PWA — ใช้ overlay หมุนเครื่องสำรอง */
  }
}

export function initMobilePlayRestrictions(
  rotateOverlay: HTMLElement,
): void {
  const portraitMq = window.matchMedia("(orientation: portrait)");

  const syncPortraitBlocker = () => {
    const block = isMobilePlayTarget() && portraitMq.matches;
    rotateOverlay.classList.toggle("hidden", !block);
    rotateOverlay.setAttribute("aria-hidden", block ? "false" : "true");
  };

  syncPortraitBlocker();
  portraitMq.addEventListener("change", syncPortraitBlocker);
  window.addEventListener("orientationchange", syncPortraitBlocker);

  document.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false },
  );

  document.addEventListener("gesturestart", (e) => {
    e.preventDefault();
  });

  document.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey) e.preventDefault();
    },
    { passive: false },
  );
}
