# 仙 Xian IO

เกม .io เทพเซียน — MVP local (Colyseus + Phaser)

## เริ่มเล่น

```bash
pnpm install
pnpm dev
```

ถ้าเคยรันค้างหรือ join ไม่ได้: `pnpm dev:clean`

เปิด [http://localhost:5173](http://localhost:5173) — เปิดหลายแท็บเพื่อทดสอบ multiplayer

LAN: ตั้ง `VITE_SERVER_URL=http://<IP>:2567` ฝั่ง client; server ฟัง `0.0.0.0` อยู่แล้ว

### เชื่อมต่อไม่ได้ / `EADDRINUSE :2567`

มักเกิดจาก **รัน `pnpm dev` ซ้ำ** หรือเซิร์ver เก่าค้างอยู่ — client เปิดได้แต่ join ล้มเหลว

```bash
# ปิด process ที่ใช้พอร์ต 2567 (macOS)
kill $(lsof -t -i:2567) 2>/dev/null
pnpm dev
```

ต้องเห็นทั้ง `[server] Colyseus listening` และ `[client] Local: http://localhost:5173/` โดย **server ไม่มี Error**

## โครงสร้าง

- `apps/client` — Vite + Phaser
- `apps/server` — Colyseus room `xian`
- `packages/shared` — balance + Qi logic

## ทดสอบ

```bash
pnpm test
```

## Remote

- GitLab: https://gitlab.com/nonthakan.dev/xian
