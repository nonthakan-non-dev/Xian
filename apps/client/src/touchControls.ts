/** Normalized stick direction from pixel delta (testable). */
export function joystickDeltaToMoveVector(
  dx: number,
  dy: number,
  maxRadius: number,
  deadZoneRatio = 0.12,
): { x: number; y: number } {
  if (maxRadius <= 0) return { x: 0, y: 0 };
  const len = Math.hypot(dx, dy);
  const dead = maxRadius * deadZoneRatio;
  if (len <= dead) return { x: 0, y: 0 };
  const clamped = Math.min(len, maxRadius);
  const nx = dx / len;
  const ny = dy / len;
  const magnitude = clamped / maxRadius;
  return { x: nx * magnitude, y: ny * magnitude };
}

/** Attack-button drag uses the same stick math (test hook). */
export function pointerDeltaToAimVector(
  dx: number,
  dy: number,
  maxRadius: number,
  deadZoneRatio = 0.12,
): { x: number; y: number } {
  return joystickDeltaToMoveVector(dx, dy, maxRadius, deadZoneRatio);
}

export function isTouchUiActive(): boolean {
  if (typeof window === "undefined") return false;
  if ("ontouchstart" in window) return true;
  return window.matchMedia("(pointer: coarse)").matches;
}

export type TouchControlsBridge = {
  skill: () => void;
};

let moveVector = { x: 0, y: 0 };
let attackHoldActive = false;
let attackAimVector = { x: 0, y: 0 };
/** Last non-zero drag aim while holding attack (kept after release for skill aim). */
let lastAttackAimVector = { x: 0, y: 0 };
let bound = false;

export function getMoveVector(): { x: number; y: number } {
  return moveVector;
}

export function getAttackHoldActive(): boolean {
  return attackHoldActive;
}

/** Current drag aim, or last drag direction if finger is in dead zone / released. */
export function getAttackAimVector(): { x: number; y: number } {
  if (attackAimVector.x !== 0 || attackAimVector.y !== 0) {
    return attackAimVector;
  }
  return lastAttackAimVector;
}

export function unbindTouchControls(): void {
  moveVector = { x: 0, y: 0 };
  attackHoldActive = false;
  attackAimVector = { x: 0, y: 0 };
  lastAttackAimVector = { x: 0, y: 0 };
  bound = false;
}

export function bindTouchControls(
  root: HTMLElement,
  bridge: TouchControlsBridge,
): void {
  if (!isTouchUiActive()) {
    root.classList.add("hidden");
    return;
  }
  root.classList.remove("hidden");
  if (bound) return;
  bound = true;

  const stickZone = root.querySelector(".touch-joystick") as HTMLElement | null;
  const stickKnob = root.querySelector(".touch-joystick-knob") as HTMLElement | null;
  const attackBtn = root.querySelector(
    "[data-touch-action='attack']",
  ) as HTMLButtonElement | null;
  const skillBtn = root.querySelector(
    "[data-touch-action='skill']",
  ) as HTMLButtonElement | null;

  if (!stickZone || !stickKnob || !attackBtn || !skillBtn) return;

  const maxRadius = () => {
    const rect = stickZone.getBoundingClientRect();
    return Math.min(rect.width, rect.height) * 0.38;
  };

  const attackDragRadius = () => {
    const rect = attackBtn.getBoundingClientRect();
    return Math.min(rect.width, rect.height) * 0.45;
  };

  let pointerId: number | null = null;
  let originX = 0;
  let originY = 0;

  const resetStick = () => {
    pointerId = null;
    moveVector = { x: 0, y: 0 };
    stickKnob.style.transform = "translate(-50%, -50%)";
  };

  stickZone.addEventListener(
    "pointerdown",
    (e) => {
      if (pointerId !== null) return;
      pointerId = e.pointerId;
      originX = e.clientX;
      originY = e.clientY;
      stickZone.setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    { passive: false },
  );

  stickZone.addEventListener("pointermove", (e) => {
    if (e.pointerId !== pointerId) return;
    const dx = e.clientX - originX;
    const dy = e.clientY - originY;
    const r = maxRadius();
    moveVector = joystickDeltaToMoveVector(dx, dy, r);
    const visualR = Math.min(Math.hypot(dx, dy), r);
    const angle = Math.atan2(dy, dx);
    const vx = Math.cos(angle) * visualR;
    const vy = Math.sin(angle) * visualR;
    stickKnob.style.transform = `translate(calc(-50% + ${vx}px), calc(-50% + ${vy}px))`;
    e.preventDefault();
  });

  const endStick = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    try {
      stickZone.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    resetStick();
  };

  stickZone.addEventListener("pointerup", endStick);
  stickZone.addEventListener("pointercancel", endStick);

  let attackPointerId: number | null = null;
  let attackOriginX = 0;
  let attackOriginY = 0;

  const updateAttackAimFromEvent = (e: PointerEvent) => {
    const dx = e.clientX - attackOriginX;
    const dy = e.clientY - attackOriginY;
    const r = attackDragRadius();
    attackAimVector = pointerDeltaToAimVector(dx, dy, r);
    if (attackAimVector.x !== 0 || attackAimVector.y !== 0) {
      lastAttackAimVector = { ...attackAimVector };
    }
  };

  const endAttackHold = (e: PointerEvent) => {
    if (e.pointerId !== attackPointerId) return;
    try {
      attackBtn.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    attackPointerId = null;
    attackHoldActive = false;
    attackAimVector = { x: 0, y: 0 };
    attackBtn.classList.remove("touch-btn-attack-active");
  };

  attackBtn.addEventListener(
    "pointerdown",
    (e) => {
      if (attackPointerId !== null) return;
      attackPointerId = e.pointerId;
      attackOriginX = e.clientX;
      attackOriginY = e.clientY;
      attackHoldActive = true;
      attackAimVector = { x: 0, y: 0 };
      attackBtn.setPointerCapture(e.pointerId);
      attackBtn.classList.add("touch-btn-attack-active");
      e.preventDefault();
    },
    { passive: false },
  );

  attackBtn.addEventListener("pointermove", (e) => {
    if (e.pointerId !== attackPointerId) return;
    updateAttackAimFromEvent(e);
    e.preventDefault();
  });

  attackBtn.addEventListener("pointerup", endAttackHold);
  attackBtn.addEventListener("pointercancel", endAttackHold);

  const onAction = (fn: () => void) => (e: Event) => {
    e.preventDefault();
    fn();
  };

  skillBtn.addEventListener("click", onAction(bridge.skill));
}
