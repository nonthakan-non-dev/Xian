# ADR 0003: CurrentQi และ RealmFloor

## Status

Accepted

## Decision

**CurrentQi** เป็นชีวิตและคะแนน; **RealmFloor** เป็นขั้นฝึกสูงสุดที่เคยถึง — damage ไม่ลด floor (ยกเว้น PocketDuel ภายหลัง)

## Consequences

- UI แสดง「พลังปราณ」
- `promoteRealmFloor` ใช้ threshold จาก `balance.ts`
