# xian-02-room-sync

**Status:** done  
**Blockers:** xian-01-scaffold

## Goal

ผู้เล่นหลาย client เข้าห้องเดียว; เห็นตำแหน่งกัน sync แบบ authoritative 20 Hz

## Scope

- Colyseus room เดียว (MVP), max 32 clients
- State: `players[]` — id, name, x, y (ยังไม่ต้อง Qi/realm)
- Client: WASD move; ส่ง input; interpolate ตำแหน่งคนอื่น
- Placeholder avatar (vector วงกลม)

## Acceptance criteria

- [ ] 2 แท็บ join ชื่อต่างกัน → เห็นทั้งสองตัว
- [ ] ขยับฝั่ง A → B เห็นภายใน ~100ms รู้สึก smooth
- [ ] ออกจากห้องแล้วหายจาก state

## Spec refs

- docs/spec-xian-io.md §8.2, §8.3 (players subset)

## Tests

- Smoke: shared types compile; optional server unit สำหรับ clamp position ในแผนที่
