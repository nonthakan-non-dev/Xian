/** Client-only: หลังกดเลือกวิชา — ไม่ล็อกเกม/ไม่เปิด modal จน schema ว่า awaitingSkillDraft=false */

/** กดส่ง pick แล้ว (หรือได้ skillDraftComplete) แต่ schema อาจยัง lag */
let draftUiSettled = false;

export function markDraftPickSent(): void {
  draftUiSettled = true;
}

export function clearDraftUiSettled(): void {
  draftUiSettled = false;
}

/** อย่าเปิด modal ซ้ำ / อย่ารับ click ซ้ำ */
export function isDraftPickPending(): boolean {
  return draftUiSettled;
}

/** true = ยังต้อง block เดิน/ต่อสู้ */
export function isPlayerBlockedBySkillDraft(
  awaitingSkillDraft: boolean,
): boolean {
  if (!awaitingSkillDraft) {
    draftUiSettled = false;
    return false;
  }
  return !draftUiSettled;
}
