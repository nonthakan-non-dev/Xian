# xian-04-realm-tiers

**Status:** done  
**Blockers:** xian-03-qi-orbs

## Goal

7 ขั้น RealmFloor ตาม threshold; ปรับ speed + pickup radius ตาม tier

## Scope

- `RealmFloor` (1–7) ชื่อ UI ไทยล้วน (รวบรวมปราณ → … → ถามเต๋า)
- `promoteRealm` เมื่อ CurrentQi ≥ threshold; floor ไม่ลดจาก damage
- `MaxQi`, move speed, pickup radius จาก `packages/shared/balance.ts`
- แสดงชื่อขั้นบน avatar / HUD

## Acceptance criteria

- [ ] เก็บ orb จน Qi ถึง threshold → ขั้นขึ้น + stat เปลี่ยน
- [ ] ครบ 7 ขั้นได้ในห้อง (ค่า threshold ปรับให้ทดสอบได้ไม่ช้าเกิน dev)
- [ ] Vitest: `promoteRealm`

## Spec refs

- docs/spec-xian-io.md §4.2, §4.3, CONTEXT.md RealmFloor

## Blockers for downstream

- xian-05-combat-core ใช้ MaxQi / death
- xian-06-dao-path ปลดที่ขั้น 2
