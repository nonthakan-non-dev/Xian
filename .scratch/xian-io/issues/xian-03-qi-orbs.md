# xian-03-qi-orbs

**Status:** done  
**Blockers:** xian-02-room-sync

## Goal

LingqiOrb spawn บนแผนที่; เก็บแล้ว CurrentQi เพิ่ม; leaderboard ในห้อง

## Scope

- Server spawn/maintain `orbs[]`; pickup ด้วย radius
- Player: `currentQi`, แสดง UI「พลังปราณ」
- Leaderboard: ชื่อ + CurrentQi (เรียง Qi)

## Acceptance criteria

- [ ] Orbs ปรากฏและเก็บได้
- [ ] Qi เพิ่ม; ไม่เกิน MaxQi tier 1 (constant ใน balance)
- [ ] Leaderboard อัปเดต realtime
- [ ] Vitest: `applyOrbPickup`

## Spec refs

- docs/spec-xian-io.md §4.1, §5.1, §11

## Blockers for downstream

- xian-04-realm-tiers ต้องการ CurrentQi + pickup
