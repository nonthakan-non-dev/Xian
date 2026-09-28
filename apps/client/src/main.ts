import "./colyseus018JoinPatch.js";
import Phaser from "phaser";
import { Client, Room, getStateCallbacks } from "colyseus.js";
import {
  getSkillById,
  isInDuelZone,
  parseSkillIds,
  realmDisplayName,
  VASSANA_CAP,
  type Player,
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
const challengeBanner = document.getElementById("challenge-banner")!;
const challengeText = document.getElementById("challenge-text")!;
const challengeAccept = document.getElementById(
  "challenge-accept",
)! as HTMLButtonElement;
const challengeDecline = document.getElementById(
  "challenge-decline",
)! as HTMLButtonElement;
const toast = document.getElementById("toast")!;
const skillDraftOverlay = document.getElementById("skill-draft-overlay")!;
const skillDraftOptions = document.getElementById("skill-draft-options")!;
const skillDraftSubtitle = document.getElementById("skill-draft-subtitle")!;

let room: Room<XianState> | null = null;

const sfxMute = document.getElementById("sfx-mute") as HTMLInputElement;
sfxMute.checked = isSfxMuted();
sfxMute.addEventListener("change", () => setSfxMuted(sfxMute.checked));

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

function hideSkillDraftModal() {
  skillDraftOverlay.classList.add("hidden");
  skillDraftOptions.innerHTML = "";
}

function syncSkillDraftModal() {
  if (!room) return;
  const me = room.state.players.get(room.sessionId);
  if (!me?.awaitingSkillDraft) {
    hideSkillDraftModal();
    return;
  }
  const offers = parseSkillIds(me.draftOfferIds);
  if (offers.length === 0) {
    skillDraftSubtitle.textContent = "กำลังรอตัวเลือกวิชาจากเซิร์ver…";
    skillDraftOptions.innerHTML = "";
    skillDraftOverlay.classList.remove("hidden");
    return;
  }
  skillDraftSubtitle.textContent = `ขั้น ${realmDisplayName(me.realmFloor, me.qiLayer)} — เลือกหนึ่งในสาม`;
  skillDraftOptions.innerHTML = offers
    .map((id) => {
      const skill = getSkillById(id);
      if (!skill) return "";
      const kind =
        skill.kind === "passive"
          ? "passive"
          : skill.kind === "active"
            ? "ใช้ Shift"
            : "ผสม";
      return `<button type="button" class="skill-draft-btn" data-skill-id="${id}"><strong>${skill.nameTh}</strong><span>${kind} · ${skill.descriptionTh}</span></button>`;
    })
    .join("");
  skillDraftOverlay.classList.remove("hidden");
  for (const btn of skillDraftOptions.querySelectorAll<HTMLButtonElement>(
    ".skill-draft-btn",
  )) {
    btn.onclick = () => {
      const id = btn.dataset.skillId;
      if (!id || !room) return;
      for (const b of skillDraftOptions.querySelectorAll<HTMLButtonElement>(
        ".skill-draft-btn",
      )) {
        b.disabled = true;
      }
      room.send("pickSkillDraft", { skillId: id });
    };
  }
}

function wireSkillDraftListeners(activeRoom: Room<XianState>) {
  const $ = getStateCallbacks(activeRoom);
  if (!$) return;

  const bindPlayer = (player: Player, sessionId: string) => {
    if (sessionId !== activeRoom.sessionId) return;
    $(player).listen("awaitingSkillDraft", () => {
      syncSkillDraftModal();
      updateHud();
    });
    $(player).listen("draftOfferIds", () => syncSkillDraftModal());
    $(player).listen("ownedSkillIds", () => updateHud());
  };

  $(activeRoom.state).players.onAdd((player, sessionId) => {
    bindPlayer(player, sessionId);
  });
  activeRoom.state.players.forEach((player, sessionId) => {
    bindPlayer(player, sessionId);
  });
}

function updateHud() {
  if (!room) return;
  const me = room.state.players.get(room.sessionId);
  if (me) {
    const realmName = realmDisplayName(
      me.realmFloor as number,
      (me.qiLayer as number) ?? 1,
    );
    const owned = parseSkillIds(me.ownedSkillIds);
    const vassanaPct = Math.min(
      100,
      Math.round((me.vassana / VASSANA_CAP) * 100),
    );
    const duelHint = me.inPocketDuel
      ? "<br/><em>⚔ PocketDuel</em>"
      : isInDuelZone(me.x, me.y)
        ? "<br/><em>วงดวล FFA</em>"
        : "";
    const skillLine =
      owned.length > 0
        ? `<br/>วิชา: ${owned.length} · Shift: ${getSkillById(me.lastActiveSkillId)?.nameTh ?? "—"}`
        : "<br/><em>หนิงชี่ · โจมตีพื้นฐานอ่อน</em>";
    statsEl.innerHTML = `<strong>${me.name}</strong><br/>พลังปราณ: ${Math.floor(me.currentQi)}<br/>ขั้น: ${realmName}<br/>วาสนา: ${vassanaPct}%${skillLine}${duelHint}`;
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
      return `<li>${i + 1}. ${p.name} · ${realm} · ${Math.floor(p.currentQi)}</li>`;
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
    room.onMessage("skillDraftComplete", () => {
      hideSkillDraftModal();
      updateHud();
    });
    room.onMessage("skillDraftRejected", () => {
      showToast("เลือกวิชาไม่สำเร็จ — ลองอีกครั้ง");
      syncSkillDraftModal();
    });

    wireSkillDraftListeners(room);

    room.onStateChange(() => {
      updateHud();
      syncSkillDraftModal();
      syncChallengeBanner();
    });
    updateHud();
    syncSkillDraftModal();
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

joinBtn.addEventListener("click", () => void joinGame());
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") void joinGame();
});
