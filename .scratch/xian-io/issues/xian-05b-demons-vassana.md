# xian-05b-demons-vassana

**Status:** done  
**Blockers:** xian-05-combat-core

## Goal

โซนอสูร PvE + วาสนา (ดวง/โชค) ส่งผลดรอป

## Scope

- `demonZones[]` 2–3 วงบนแผนที่; tint ฝั่ง client
- `demons[]`: CurrentQi, type (ป่า / ลึก), AI ไล่โจมตีในโซน
- ผู้เล่น damage demon → ตาย → orbs (มูลค่า > orb ปกติ)
- **Vassana:** tick passive ต่อวิ; multiplier ในโซน + เมื่อฆ่า demon; `rollOrbWithVassana` ตอน pickup
- UI แถบวาสนา

## Acceptance criteria

- [ ] เข้าโซนเห็นอสูร; ฆ่าได้และได้ orbs
- [ ] ยืนในห้อง → วาสนาขึ้น; ในโซนเร็วกว่า
- [ ] วาสนาสูง → สังเกตได้ว่า orb บางลูกให้ Qi bonus (log หรือ UI)
- [ ] Vitest: `tickVassana`, `rollOrbWithVassana`, `damageDemon`

## Spec refs

- docs/spec-xian-io.md §5b, §5c, §11

## Blockers for downstream

- xian-06-dao-path — combat ใช้ damage demon ได้แล้ว
