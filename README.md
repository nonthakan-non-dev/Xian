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

### เล่นบนมือถือ (Wi‑Fi LAN)

1. บน PC รัน `pnpm dev` (server ต้อง listen ที่ `0.0.0.0:2567`)
2. หา IP ของ PC (เช่น `192.168.1.10`)
3. มือถือ Wi‑Fi เดียวกัน เปิด `http://<IP-PC>:5173`
4. ช่อง **ที่อยู่เซิร์ver** ใส่ `http://<IP-PC>:2567` แล้วกดเข้าโลก
5. ใช้ joystick ซ้ายล่าง + ปุ่มโจมตี/วิชาขวาล่าง

ค่า server URL จำใน `localStorage` ของเบราว์เซอร์ — เปิดจาก IP ของหน้า client จะเติม default เป็น `http://<hostname>:2567` ให้

### PWA (Add to Home Screen)

- Build client มี `vite-plugin-pwa` — cache ไฟล์ static (JS/CSS/HTML) เท่านั้น **ไม่** offline multiplayer
- **LAN แบบ `http://192.168.x.x`**: มือถือมักติดตั้ง PWA ไม่ได้ (ต้อง secure context — HTTPS หรือ localhost); เล่นผ่าน Safari/Chrome ปกติได้
- ติดตั้ง PWA เต็มรูปแบบเมื่อ deploy client บน **HTTPS**

```bash
pnpm -C apps/client build
pnpm -C apps/client preview
```

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
