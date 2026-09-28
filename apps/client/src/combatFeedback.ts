let onSkillCooldownBlocked: (() => void) | null = null;
let lastCooldownNotifyAt = 0;

export function setSkillCooldownBlockedHandler(fn: (() => void) | null): void {
  onSkillCooldownBlocked = fn;
}

export function notifySkillCooldownBlocked(): void {
  const now = performance.now();
  if (now - lastCooldownNotifyAt < 700) return;
  lastCooldownNotifyAt = now;
  onSkillCooldownBlocked?.();
}
