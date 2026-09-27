# xian-06-dao-path

**Status:** todo  
**Blockers:** xian-05b-demons-vassana

## Goal

PathChoice modal ขั้น 2; 4 DaoPath พร้อม Basic / Passive / Active ทั้งแผนที่

## Scope

- ถึง RealmFloor 2 → `awaitingPathChoice`; modal ไทย 4 สาย; เลือกครั้งเดียว
- RealmFloor < 2 หลังเคยเลือก: จำสาย ปิด kit
- Implement kits ตาม spec §6.3–6.6 (LMB basic, Shift/RMB active, cursor aim)
- FlyingSwords, Overload, Iron Skin, Poison stacks, ฯลฯ — server authoritative
- HerbBuff โบนัสตามสาย

## Acceptance criteria

- [ ] ขึ้นขั้น 2 → modal บังคับ; เลือกแล้วใช้ skill ได้
- [ ] ทั้ง 4 สาย: basic + active ทำ damage Qi ได้
- [ ] Passive ทำงานอย่างน้อย 1 อ per path (ทดด้วย Vitest ที่เป็นไปได้)
- [ ] Vitest: `poisonStacks`, `overloadCrit`

## Spec refs

- docs/spec-xian-io.md §6, CONTEXT.md DaoPath

## Blockers for downstream

- xian-07-duel-flow ใช้ combat kit เต็มใน zone/pocket
