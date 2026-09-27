# ADR 0002: Server authoritative combat

## Status

Accepted

## Decision

ทุก movement, pickup, damage, Qi คำนวณฝั่ง Colyseus server @ 20 Hz; client ส่ง input และ interpolate

## Consequences

- Latency รับได้ด้วย interpolation
- Logic ร่วมอยู่ใน `@xian/shared` + Vitest
