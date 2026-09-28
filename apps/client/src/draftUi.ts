/** Client-only: หลังกดเลือกวิชา ไม่ล็อกเกม/ไม่เปิด modal ซ้ำจน server ยืนยัน */

let draftPickPending = false;

export function markDraftPickSent(): void {
  draftPickPending = true;
}

export function clearDraftPickPending(): void {
  draftPickPending = false;
}

export function isDraftPickPending(): boolean {
  return draftPickPending;
}

/** true = ยังต้อง block เดิน/ต่อสู้ หรือแสดง modal */
export function isPlayerBlockedBySkillDraft(
  awaitingSkillDraft: boolean,
): boolean {
  if (!awaitingSkillDraft) {
    draftPickPending = false;
    return false;
  }
  return !draftPickPending;
}
