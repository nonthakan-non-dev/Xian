# ADR 0001: Pocket instance สำหรับ mutual duel

## Status

Accepted

## Context

Mutual PocketDuel ต้องแยก simulation จากห้อง 32 คน

## Decision

ใช้ Colyseus room/instance แยกสำหรับคู่ดuel (หรือ partition state ที่ไม่ broadcast ทั้งห้อง) — implement ใน ticket xian-07

## Consequences

- ต้อง restore ตำแหน่งหลัง duel
- Client สลับ state ชั่วคราว
