# xian-05-combat-core

**Status:** done  
**Blockers:** xian-04-realm-tiers

## Goal

Qi = HP: damage ลด CurrentQi; Qi→0 → death → orbs + respawn; framework สถานะ

## Scope

- Server: `applyDamageToQi` ระหว่าง players (และ hook สำหรับ entity อื่น)
- Death: ระเบิด LingqiOrb จาก Qi ที่เหลือ; respawn ขอบแผนที่ + `RESPAWN_QI`
- Status framework: Stun, Slow, Stagger, Poison (tick), Shield, Dash — โครง + 1–2 ทดสอบ
- Client: feedback ตาย/respawn (ข้อความไทย)

## Acceptance criteria

- [ ] ลด Qi กันได้ (placeholder attack — click หรือ key ชั่วคราวก่อน dao-path)
- [ ] Qi→0 → orbs บนพื้น + respawn
- [ ] ไม่มี spawn shield
- [ ] Vitest: `applyDamageToQi`, death drop spawn count > 0

## Spec refs

- docs/spec-xian-io.md §4.4, §6.7

## Blockers for downstream

- xian-05b-demons-vassana, xian-06-dao-path ต้องการ damage + status
