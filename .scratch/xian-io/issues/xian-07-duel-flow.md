# xian-07-duel-flow

**Status:** todo  
**Blockers:** xian-06-dao-path

## Goal

PocketDuel (mutual) + DuelZone FFA ครบกติกา — **playable MVP**

## Scope

- **Challenge:** opt-in สองฝ่าย; ห้ามเริ่มใน DuelZone
- **PocketDuel:** instance 2 คน; Qi→0 แพ้ → 40% Qi โอน, RealmFloor−1 (min 1), respawn; กลับตำแหน่งเดิม
- **DuelZone:** FFA; Qi→0 → เตะออกวง + orbs; respawn ขอบแผนที่
- Combat kit ใช้ใน pocket/zone ได้เต็มที่

## Acceptance criteria

- [ ] ท้าดวลนอกวง → pocket → มีผู้ชนะตาม Qi
- [ ] แพ้ pocket → realm ลง (ถ้า >1) + Qi transfer
- [ ] ในวง FFA ตาย → ออกวง + orbs
- [ ] ท้าดวลในวงถูก reject
- [ ] Vitest: `tryStartChallenge`, `resolvePocketDuel`

## Spec refs

- docs/spec-xian-io.md §7

## Blockers for downstream

- xian-08-xian-feel (polish only)
