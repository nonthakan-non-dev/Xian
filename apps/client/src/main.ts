import "./colyseus018JoinPatch.js";
import Phaser from "phaser";
import { Client, Room } from "colyseus.js";
import {
  DAO_PATH_IDS,
  DAO_PATH_UI_TH,
  daoPathAccentColor,
  combatKitBlockReason,
  isInDuelZone,
  realmDisplayName,
  VASSANA_CAP,
  type DaoPathChoice,
  type XianState,
} from "@xian/shared";
import { joinXianRoom } from "./joinRoom.js";
import { isSfxMuted, setSfxMuted } from "./sfx.js";
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
const pathOverlay = document.getElementById("path-overlay")!;
const pathChoices = document.getElementById("path-choices")!;
const challengeBanner = document.getElementById("challenge-banner")!;
const challengeText = document.getElementById("challenge-text")!;
const challengeAccept = document.getElementById(
  "challenge-accept",
)! as HTMLButtonElement;
const challengeDecline = document.getElementById(
  "challenge-decline",
)! as HTMLButtonElement;
const toast = document.getElementById("toast")!;

const PATH_LABELS: Record<DaoPathChoice, string> = {
  sword: "กระบี่",
  body: "กายา",
  lightning: "อัคนี",
  shadow: "เงา",
};

let room: Room<XianState> | null = null;

function accentCss(daoPath: string): string {
  const n = daoPathAccentColor(daoPath);
  return `#${n.toString(16).padStart(6, "0")}`;
}

const sfxMute = document.getElementById("sfx-mute") as HTMLInputElement;
sfxMute.checked = isSfxMuted();
sfxMute.addEventListener("change", () => setSfxMuted(sfxMute.checked));

function setupPathModal() {
  pathChoices.innerHTML = DAO_PATH_IDS.map((id) => {
    const ui = DAO_PATH_UI_TH[id];
    return `<button type="button" data-path="${id}"><strong>${ui.title}</strong>${ui.blurb}</button>`;
  }).join("");
  pathChoices.querySelectorAll("button[data-path]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!room) return;
      const path = (btn as HTMLButtonElement).dataset.path;
      if (!path) return;
      room.send("choosePath", { path });
    });
  });
}

function syncPathOverlay() {
  if (!room) return;
  const me = room.state.players.get(room.sessionId);
  if (me?.awaitingPathChoice) {
    pathOverlay.classList.remove("hidden");
  } else {
    pathOverlay.classList.add("hidden");
  }
}

function showToast(message: string) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.setTimeout(() => toast.classList.add("hidden"), 3200);
}

function syncChallengeBanner() {
  if (!room) return;
  const me = room.state.players.get(room.sessionId);
  if (me?.challengeFrom) {
    const from = room.state.players.get(me.challengeFrom);
    challengeText.textContent = `${from?.name ?? "นักบำเพ็ต"} ขอท้าดวล PocketDuel`;
    challengeBanner.classList.remove("hidden");
  } else {
    challengeBanner.classList.add("hidden");
  }
}

challengeAccept.addEventListener("click", () => {
  room?.send("acceptChallenge", {});
  challengeBanner.classList.add("hidden");
});

challengeDecline.addEventListener("click", () => {
  room?.send("declineChallenge", {});
  challengeBanner.classList.add("hidden");
});

function updateHud() {
  if (!room) return;
  const me = room.state.players.get(room.sessionId);
  if (me) {
    const realmName = realmDisplayName(
      me.realmFloor as number,
      (me.qiLayer as number) ?? 1,
    );
    const vassanaPct = Math.min(
      100,
      Math.round((me.vassana / VASSANA_CAP) * 100),
    );
    const pathLabel =
      me.daoPath && PATH_LABELS[me.daoPath as DaoPathChoice]
        ? PATH_LABELS[me.daoPath as DaoPathChoice]
        : me.realmFloor >= 2 && !me.daoPath
          ? "— เลือกสาย —"
          : "—";
    const kitBlock = combatKitBlockReason(
      me.realmFloor,
      me.daoPath,
      me.awaitingPathChoice,
    );
    const kitOffHint =
      kitBlock === "realm_low"
        ? " (ปิด — สะสมพลังถึงขั้น 2 เพื่อเลือกสาย)"
        : kitBlock === "awaiting_path_choice"
          ? " (ปิด — เลือกสายวิชา)"
          : "";
    const duelHint = me.inPocketDuel
      ? "<br/><em>⚔ PocketDuel</em>"
      : isInDuelZone(me.x, me.y)
        ? "<br/><em>วงดวล FFA</em>"
        : "";
    statsEl.innerHTML = `<strong>${me.name}</strong><br/>พลังปราณ: ${Math.floor(me.currentQi)}<br/>ขั้น: ${realmName}<br/>สาย: ${pathLabel}${kitOffHint}<br/>วาสนา: ${vassanaPct}%${duelHint}`;
  }
  const rows = [...room.state.players.values()]
    .filter((p) => p?.name)
    .sort((a, b) => b.currentQi - a.currentQi)
    .slice(0, 8);
  leaderboardList.innerHTML = rows
    .map((p, i) => {
      const realm = realmDisplayName(
        p.realmFloor as number,
        (p.qiLayer as number) ?? 1,
      );
      const path =
        p.daoPath && PATH_LABELS[p.daoPath as DaoPathChoice]
          ? PATH_LABELS[p.daoPath as DaoPathChoice]
          : "—";
      const accent = p.daoPath ? accentCss(p.daoPath) : "#cccccc";
      return `<li>${i + 1}. <span style="color:${accent}">${p.name}</span> · ${realm} · ${path} · ${Math.floor(p.currentQi)}</li>`;
    })
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

    room.onMessage(
      "challengeReceived",
      (msg: { fromName: string }) => {
        showToast(`${msg.fromName} ขอท้าดวล — กดยอมด้านบน`);
        syncChallengeBanner();
      },
    );
    room.onMessage(
      "challengeRejected",
      (msg: { reason: string }) => {
        const text =
          msg.reason === "in_duel_zone"
            ? "ท้าดวลไม่ได้ในวงดวล"
            : "ท้าดวลไม่ได้ตอนนี้";
        showToast(text);
      },
    );
    room.onMessage(
      "pocketDuelStart",
      (msg: { aName: string; bName: string }) => {
        showToast(`PocketDuel: ${msg.aName} vs ${msg.bName}`);
      },
    );
    room.onMessage(
      "pocketDuelEnd",
      (msg: { winnerName: string; loserName: string; transfer: number }) => {
        showToast(
          `${msg.winnerName} ชนะ — ได้ ${msg.transfer} พลังจาก ${msg.loserName}`,
        );
      },
    );

    room.onStateChange(() => {
      updateHud();
      syncPathOverlay();
      syncChallengeBanner();
    });
    updateHud();
    syncPathOverlay();
    syncChallengeBanner();

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
    game.scene.start("WorldScene", {
      room,
      onDeathMessage: (msg: { sessionId: string; name: string }) => {
        const mine = msg.sessionId === room!.sessionId;
        showToast(
          mine
            ? "พลังปราณกระจาย — ฟื้นที่ขอบแผนที่"
            : `${msg.name} ล้ม — ลมปราณกระจาย`,
        );
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

setupPathModal();
joinBtn.addEventListener("click", () => void joinGame());
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") void joinGame();
});
