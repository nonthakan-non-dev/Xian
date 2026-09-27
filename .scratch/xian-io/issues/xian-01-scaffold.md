# xian-01-scaffold

**Status:** done  
**Blockers:** none

## Goal

Monorepo พร้อมรัน client + Colyseus server ในเครื่องเดียว; หน้า join ใส่ชื่อไทย/Latin ได้

## Scope

- `pnpm` workspace: `apps/client` (Vite + Phaser 3 + TS), `apps/server` (Colyseus + TS), `packages/shared`
- `pnpm dev` รันทั้งสอง; README สั้น
- เขียน ADR 3 เรื่องใน `docs/adr/` (pocket duel, authoritative server, CurrentQi/RealmFloor)
- `packages/shared/balance.ts` — โครง empty constants (ยังไม่ต้อง balance จริง)

## Acceptance criteria

- [ ] `pnpm install` && `pnpm dev` ไม่ error
- [ ] Client เปิดได้; ฟอร์มชื่อ → ส่ง join (แม้ room ยังว่าง)
- [ ] Server log แสดง connection
- [ ] `pnpm test` รัน Vitest ได้ (แม้มีแค่ smoke test)

## Spec refs

- docs/spec-xian-io.md §8.1, §8.4, §12

## /implement notes

- อ้าง [game-01](file:///Users/woxacorp./Documents/game/game-01) เป็นแนว Vite+Phaser ถ้าต้องการ copy pattern
