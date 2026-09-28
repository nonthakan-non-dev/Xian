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
let touchAimVector = { x: 0, y: 0 };
/** Last non-zero drag aim from attack/skill pads (kept after release). */
let lastTouchAimVector = { x: 0, y: 0 };
let bound = false;
let touchControlsRoot: HTMLElement | null = null;

export type TouchPadCooldownState = {
  attackRemainingMs: number;
  attackTotalMs: number;
  skillRemainingMs: number;
  skillTotalMs: number;
};

function applyPadCooldown(
  pad: HTMLElement | null,
  remainingMs: number,
  totalMs: number,
) {
  if (!pad) return;
  const overlay = pad.querySelector(
    ".touch-pad-cooldown",
  ) as HTMLElement | null;
  const text = pad.querySelector(
    ".touch-pad-cooldown-text",
  ) as HTMLElement | null;
  if (!overlay || !text) return;
  if (remainingMs <= 0 || totalMs <= 0) {
    pad.classList.remove("touch-pad-cooling");
    overlay.style.removeProperty("--cd-ratio");
    text.textContent = "";
    return;
  }
  const ratio = remainingMs / totalMs;
  pad.classList.add("touch-pad-cooling");
  overlay.style.setProperty("--cd-ratio", String(ratio));
  text.textContent = (remainingMs / 1000).toFixed(1);
}

export function updateTouchPadCooldowns(state: TouchPadCooldownState): void {
  if (!touchControlsRoot) return;
  applyPadCooldown(
    touchControlsRoot.querySelector(".touch-pad-attack"),
    state.attackRemainingMs,
    state.attackTotalMs,
  );
  applyPadCooldown(
    touchControlsRoot.querySelector(".touch-pad-skill"),
    state.skillRemainingMs,
    state.skillTotalMs,
  );
}

export function getMoveVector(): { x: number; y: number } {
  return moveVector;
}

export function getAttackHoldActive(): boolean {
  return attackHoldActive;
}

/** Current drag aim, or last drag direction if finger is in dead zone / released. */
export function getTouchAimVector(): { x: number; y: number } {
  if (touchAimVector.x !== 0 || touchAimVector.y !== 0) {
    return touchAimVector;
  }
  return lastTouchAimVector;
}

/** @deprecated use getTouchAimVector */
export const getAttackAimVector = getTouchAimVector;

export function unbindTouchControls(): void {
  moveVector = { x: 0, y: 0 };
  attackHoldActive = false;
  touchAimVector = { x: 0, y: 0 };
  lastTouchAimVector = { x: 0, y: 0 };
  bound = false;
  touchControlsRoot = null;
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
  touchControlsRoot = root;

  const stickZone = root.querySelector(".touch-pad-move") as HTMLElement | null;
  const stickKnob = stickZone?.querySelector(
    ".touch-pad-knob",
  ) as HTMLElement | null;
  const attackBtn = root.querySelector(
    "[data-touch-action='attack']",
  ) as HTMLButtonElement | null;
  const skillBtn = root.querySelector(
    "[data-touch-action='skill']",
  ) as HTMLButtonElement | null;
  const attackKnob = attackBtn?.querySelector(
    ".touch-pad-knob",
  ) as HTMLElement | null;
  const skillKnob = skillBtn?.querySelector(
    ".touch-pad-knob",
  ) as HTMLElement | null;

  if (
    !stickZone ||
    !stickKnob ||
    !attackBtn ||
    !skillBtn ||
    !attackKnob ||
    !skillKnob
  ) {
    return;
  }

  const padDragRadius = (pad: HTMLElement) => {
    const rect = pad.getBoundingClientRect();
    return Math.min(rect.width, rect.height) * 0.38;
  };

  const maxRadius = () => padDragRadius(stickZone);

  const setKnobOffset = (
    knob: HTMLElement,
    dx: number,
    dy: number,
    maxR: number,
  ) => {
    const visualR = Math.min(Math.hypot(dx, dy), maxR);
    const angle = Math.atan2(dy, dx);
    const vx = Math.cos(angle) * visualR;
    const vy = Math.sin(angle) * visualR;
    knob.style.transform = `translate(calc(-50% + ${vx}px), calc(-50% + ${vy}px))`;
  };

  const resetKnob = (knob: HTMLElement) => {
    knob.style.transform = "translate(-50%, -50%)";
  };

  let pointerId: number | null = null;
  let originX = 0;
  let originY = 0;

  const resetStick = () => {
    pointerId = null;
    moveVector = { x: 0, y: 0 };
    resetKnob(stickKnob);
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
    setKnobOffset(stickKnob, dx, dy, r);
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

  const applyPadAim = (
    originX: number,
    originY: number,
    e: PointerEvent,
    pad: HTMLElement,
    knob: HTMLElement,
  ) => {
    const dx = e.clientX - originX;
    const dy = e.clientY - originY;
    const r = padDragRadius(pad);
    touchAimVector = pointerDeltaToAimVector(dx, dy, r);
    if (touchAimVector.x !== 0 || touchAimVector.y !== 0) {
      lastTouchAimVector = { ...touchAimVector };
    }
    setKnobOffset(knob, dx, dy, r);
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
    touchAimVector = { x: 0, y: 0 };
    resetKnob(attackKnob);
    attackBtn.classList.remove("touch-pad-attack-active");
  };

  attackBtn.addEventListener(
    "pointerdown",
    (e) => {
      if (attackPointerId !== null) return;
      attackPointerId = e.pointerId;
      attackOriginX = e.clientX;
      attackOriginY = e.clientY;
      attackHoldActive = true;
      touchAimVector = { x: 0, y: 0 };
      attackBtn.setPointerCapture(e.pointerId);
      attackBtn.classList.add("touch-pad-attack-active");
      e.preventDefault();
    },
    { passive: false },
  );

  attackBtn.addEventListener("pointermove", (e) => {
    if (e.pointerId !== attackPointerId) return;
    applyPadAim(attackOriginX, attackOriginY, e, attackBtn, attackKnob);
    e.preventDefault();
  });

  attackBtn.addEventListener("pointerup", endAttackHold);
  attackBtn.addEventListener("pointercancel", endAttackHold);

  let skillPointerId: number | null = null;
  let skillOriginX = 0;
  let skillOriginY = 0;

  const endSkillGesture = (e: PointerEvent) => {
    if (e.pointerId !== skillPointerId) return;
    try {
      skillBtn.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    skillPointerId = null;
    touchAimVector = { x: 0, y: 0 };
    resetKnob(skillKnob);
    skillBtn.classList.remove("touch-pad-skill-active");
    bridge.skill();
  };

  skillBtn.addEventListener(
    "pointerdown",
    (e) => {
      if (skillPointerId !== null) return;
      skillPointerId = e.pointerId;
      skillOriginX = e.clientX;
      skillOriginY = e.clientY;
      touchAimVector = { x: 0, y: 0 };
      skillBtn.setPointerCapture(e.pointerId);
      skillBtn.classList.add("touch-pad-skill-active");
      e.preventDefault();
    },
    { passive: false },
  );

  skillBtn.addEventListener("pointermove", (e) => {
    if (e.pointerId !== skillPointerId) return;
    applyPadAim(skillOriginX, skillOriginY, e, skillBtn, skillKnob);
    e.preventDefault();
  });

  skillBtn.addEventListener("pointerup", endSkillGesture);
  skillBtn.addEventListener("pointercancel", endSkillGesture);
}
