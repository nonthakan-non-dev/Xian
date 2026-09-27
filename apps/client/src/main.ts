import "./colyseus018JoinPatch.js";
import Phaser from "phaser";
import { Client, Room } from "colyseus.js";
import { REALM_NAMES_TH, VASSANA_CAP, type XianState } from "@xian/shared";
import { joinXianRoom } from "./joinRoom.js";
import { WorldScene } from "./WorldScene.js";

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ?? "http://localhost:2567";

const joinOverlay = document.getElementById("join-overlay")!;
const hud = document.getElementById("hud")!;
const nameInput = document.getElementById("name-input") as HTMLInputElement;
const joinBtn = document.getElementById("join-btn") as HTMLButtonElement;
const statsEl = document.getElementById("stats")!;
const leaderboardList = document.getElementById(
  "leaderboard-list",
)! as HTMLOListElement;

let room: Room<XianState> | null = null;

function updateHud() {
  if (!room) return;
  const me = room.state.players.get(room.sessionId);
  if (me) {
    const realmName = REALM_NAMES_TH[me.realmFloor as number] ?? "—";
    const vassanaPct = Math.min(
      100,
      Math.round((me.vassana / VASSANA_CAP) * 100),
    );
    statsEl.innerHTML = `<strong>${me.name}</strong><br/>พลังปราณ: ${Math.floor(me.currentQi)}<br/>ขั้น: ${realmName}<br/>วาสนา: ${vassanaPct}%`;
  }
  const rows = [...room.state.players.values()]
    .filter((p) => p?.name)
    .sort((a, b) => b.currentQi - a.currentQi)
    .slice(0, 8);
  leaderboardList.innerHTML = rows
    .map(
      (p, i) =>
        `<li>${i + 1}. ${p.name} — ${Math.floor(p.currentQi)}</li>`,
    )
    .join("");
}

async function joinGame() {
  const name = nameInput.value.trim() || "นักบำเพ็ต";
  joinBtn.disabled = true;
  try {
    const client = new Client(SERVER_URL);
    room = await joinXianRoom(client, SERVER_URL, name);
    joinOverlay.classList.add("hidden");
    hud.classList.remove("hidden");

    room.onStateChange(() => updateHud());
    updateHud();

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: "game",
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#0d1a12",
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });
    game.scene.add("WorldScene", WorldScene, false);
    const toast = document.getElementById("toast")!;
    game.scene.start("WorldScene", {
      room,
      onDeathMessage: (msg: { sessionId: string; name: string }) => {
        const mine = msg.sessionId === room!.sessionId;
        toast.textContent = mine
          ? "พลังปรานกระจาย — ฟื้นที่ขอบแผนที่"
          : `${msg.name} ล้ม — ลมปราณกระจาย`;
        toast.classList.remove("hidden");
        window.setTimeout(() => toast.classList.add("hidden"), 2800);
      },
    });
  } catch (err) {
    console.error(err);
    joinBtn.disabled = false;
    const hint =
      err instanceof Error ? err.message : String(err);
    alert(
      `เชื่อมต่อเซิร์ver ไม่ได้\n\nWS/API: ${SERVER_URL}\n${hint}\n\n1) รัน pnpm dev:clean จาก root\n2) ต้องเห็น "[xian] Colyseus listening" ไม่มี EADDRINUSE\n3) Hard refresh หน้าเบราว์เซอร์`,
    );
  }
}

joinBtn.addEventListener("click", () => void joinGame());
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") void joinGame();
});
