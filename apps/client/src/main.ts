import "./colyseus018JoinPatch.js";
import Phaser from "phaser";
import { Client, Room, getStateCallbacks } from "colyseus.js";
import {
  getSkillById,
  parseSkillIds,
  realmDisplayName,
  SKILL_DRAFT_PICK_TIMEOUT_MS,
  VASSANA_CAP,
  type Player,
  type RunSummaryPayload,
  type XianState,
} from "@xian/shared";
import { joinXianRoom } from "./joinRoom.js";
import { isSfxMuted, setSfxMuted } from "./sfx.js";
import { WorldScene } from "./WorldScene.js";
import {
  clearDraftUiSettled,
  isDraftPickPending,
  markDraftPickSent,
} from "./draftUi.js";
import { clientSkillCooldownForPlayer } from "./clientSkillCooldown.js";

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
const toast = document.getElementById("toast")!;
const skillDraftOverlay = document.getElementById("skill-draft-overlay")!;
const skillDraftOptions = document.getElementById("skill-draft-options")!;
const skillDraftSubtitle = document.getElementById("skill-draft-subtitle")!;
const skillDraftTimer = document.getElementById("skill-draft-timer")!;
const skillCooldownEl = document.getElementById("skill-cooldown")!;
const skillCooldownName = document.getElementById("skill-cooldown-name")!;
const skillCooldownLabel = document.getElementById("skill-cooldown-label")!;
const skillCooldownFill = document.getElementById("skill-cooldown-fill")!;
const runSummaryOverlay = document.getElementById("run-summary-overlay")!;
const runSummaryBody = document.getElementById("run-summary-body")!;
const runSummaryHomeBtn = document.getElementById(
  "run-summary-home",
)! as HTMLButtonElement;
const runSummaryRestartBtn = document.getElementById(
  "run-summary-restart",
)! as HTMLButtonElement;

let skillCooldownHudRaf = 0;

let room: Room<XianState> | null = null;
let game: Phaser.Game | null = null;
let runSummaryOpen = false;
/** Instant draft UI before schema patch arrives (no “waiting for server”). */
let instantDraftOffers: string[] | null = null;
let instantDraftRealm: { realmFloor: number; qiLayer: number } | null = null;
let instantDraftDeadlineMs: number | null = null;
/** กัน onStateChange ทุก tick สร้างปุ่มใหม่จนกดไม่ติด */
let lastRenderedDraftOffersKey = "";
let draftCountdownTimer = 0;
/** คงข้อความขั้นฝึกตอนเปิด draft — ไม่อัปเดตทุก state patch */
let frozenDraftSubtitle = "";
/** หลัง celebrate — เปิด modal เลือกวิชาได้ */
let skillDraftPickPhaseOpen = false;
let skillDraftHideTimer = 0;
/** เปิด animation แล้ว — อย่ารีเซ็ต is-visible ทุก onStateChange */
let skillDraftModalOpen = false;

const sfxMute = document.getElementById("sfx-mute") as HTMLInputElement;
sfxMute.checked = isSfxMuted();
sfxMute.addEventListener("change", () => setSfxMuted(sfxMute.checked));

let toastHideTimer = 0;

function showToast(message: string, size: "normal" | "mini" = "normal") {
  window.clearTimeout(toastHideTimer);
  toast.textContent = message;
  toast.classList.remove("hidden", "toast-mini");
  if (size === "mini") toast.classList.add("toast-mini");
  const hideMs = size === "mini" ? 1200 : 3200;
  toastHideTimer = window.setTimeout(() => {
    toast.classList.add("hidden");
    toast.classList.remove("toast-mini");
  }, hideMs);
}

function clearInstantDraftCache() {
  instantDraftOffers = null;
  instantDraftRealm = null;
  instantDraftDeadlineMs = null;
  skillDraftPickPhaseOpen = false;
}

function isSkillDraftPickPhase(): boolean {
  return skillDraftPickPhaseOpen || getDraftDeadlineMs() > 0;
}

function getDraftDeadlineMs(): number {
  const me = room?.state.players.get(room.sessionId);
  const fromSchema = me?.draftDeadlineMs ?? 0;
  if (fromSchema > 0) return fromSchema;
  if (instantDraftDeadlineMs && instantDraftDeadlineMs > 0) {
    return instantDraftDeadlineMs;
  }
  return 0;
}

function freezeDraftSubtitle(floor: number, layer: number) {
  frozenDraftSubtitle = `ขั้น ${realmDisplayName(floor, layer)} — เลือกหนึ่งในสาม`;
  skillDraftSubtitle.textContent = frozenDraftSubtitle;
}

function stopDraftCountdown() {
  if (draftCountdownTimer) {
    window.clearInterval(draftCountdownTimer);
    draftCountdownTimer = 0;
  }
}

function updateDraftCountdownUi() {
  if (frozenDraftSubtitle) {
    skillDraftSubtitle.textContent = frozenDraftSubtitle;
  }
  const deadline = getDraftDeadlineMs();
  if (deadline <= 0) {
    skillDraftTimer.classList.add("hidden");
    skillDraftTimer.textContent = "";
    return;
  }
  const sec = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  skillDraftTimer.classList.remove("hidden");
  skillDraftTimer.classList.toggle("urgent", sec <= 10);
  skillDraftTimer.textContent =
    sec > 0
      ? `จะสุ่มวิชาให้ในอีก ${sec} วินาที`
      : "กำลังสุ่มวิชา…";
}

function startDraftCountdown() {
  stopDraftCountdown();
  updateDraftCountdownUi();
  draftCountdownTimer = window.setInterval(() => {
    if (skillDraftOverlay.classList.contains("hidden")) {
      stopDraftCountdown();
      return;
    }
    updateDraftCountdownUi();
  }, 200);
}

function hideSkillDraftModal() {
  stopDraftCountdown();
  window.clearTimeout(skillDraftHideTimer);
  frozenDraftSubtitle = "";
  skillDraftModalOpen = false;
  skillDraftOverlay.classList.remove("is-visible");
  skillDraftHideTimer = window.setTimeout(() => {
    skillDraftOverlay.classList.add("hidden");
    skillDraftOptions.innerHTML = "";
    lastRenderedDraftOffersKey = "";
    skillDraftTimer.classList.add("hidden");
  }, 280);
}

function revealSkillDraftModal() {
  if (skillDraftModalOpen) return;
  window.clearTimeout(skillDraftHideTimer);
  skillDraftOverlay.classList.remove("hidden");
  skillDraftOverlay.classList.remove("is-visible");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      skillDraftOverlay.classList.add("is-visible");
      skillDraftModalOpen = true;
    });
  });
}

function renderSkillDraftButtons(offerIds: string[]) {
  skillDraftOptions.innerHTML = offerIds
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
  for (const btn of skillDraftOptions.querySelectorAll<HTMLButtonElement>(
    ".skill-draft-btn",
  )) {
    btn.onclick = () => {
      const id = btn.dataset.skillId;
      if (!id || !room || isDraftPickPending()) return;
      markDraftPickSent();
      hideSkillDraftModal();
      clearInstantDraftCache();
      room.send("pickSkillDraft", { skillId: id });
    };
  }
}

function hideRunSummaryModal() {
  runSummaryOpen = false;
  runSummaryOverlay.classList.remove("is-visible");
  runSummaryOverlay.classList.add("hidden");
}

function showRunSummaryModal(payload: RunSummaryPayload) {
  runSummaryOpen = true;
  hideSkillDraftModal();
  clearInstantDraftCache();

  const realmName = realmDisplayName(payload.realmFloor, payload.qiLayer);
  const owned = parseSkillIds(payload.ownedSkillIds);
  const vassanaPct = Math.min(
    100,
    Math.round((payload.vassana / VASSANA_CAP) * 100),
  );
  const skillLines =
    owned.length > 0
      ? owned
          .map((id) => getSkillById(id)?.nameTh ?? id)
          .slice(0, 8)
          .join(" · ")
      : "หนิงชี่ — ยังไม่ได้เลือกวิชา";

  const min = Math.floor(payload.survivalSec / 60);
  const sec = payload.survivalSec % 60;
  const timeLabel =
    min > 0 ? `${min} นาที ${sec} วินาที` : `${sec} วินาที`;

  runSummaryBody.innerHTML = `
    <strong>${payload.name}</strong>
    <p>ขั้นฝึก: ${realmName}<br/>
    วาสนา: ${vassanaPct}%<br/>
    ปราณสูงสุด: ${Math.floor(payload.peakCurrentQi)}<br/>
    รอด: ${timeLabel}</p>
    <p>วิชา (${owned.length}): ${skillLines}</p>
  `;

  runSummaryOverlay.classList.remove("hidden");
  runSummaryOverlay.classList.remove("is-visible");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      runSummaryOverlay.classList.add("is-visible");
    });
  });
}

function syncSkillDraftModal() {
  if (!room) return;
  if (runSummaryOpen) {
    hideSkillDraftModal();
    return;
  }
  if (isDraftPickPending()) {
    hideSkillDraftModal();
    return;
  }
  const me = room.state.players.get(room.sessionId);
  const awaiting = me?.awaitingSkillDraft ?? false;
  const syncedOffers = me ? parseSkillIds(me.draftOfferIds) : [];
  const offers =
    syncedOffers.length > 0 ? syncedOffers : (instantDraftOffers ?? []);

  if (!awaiting && offers.length === 0) {
    hideSkillDraftModal();
    clearInstantDraftCache();
    return;
  }

  if (offers.length === 0) {
    return;
  }

  if (!isSkillDraftPickPhase()) {
    return;
  }

  const floor = me?.realmFloor ?? instantDraftRealm?.realmFloor ?? 1;
  const layer = me?.qiLayer ?? instantDraftRealm?.qiLayer ?? 1;
  const offersKey = offers.join("\0");
  if (offersKey !== lastRenderedDraftOffersKey) {
    renderSkillDraftButtons(offers);
    lastRenderedDraftOffersKey = offersKey;
    freezeDraftSubtitle(floor, layer);
  }
  if (!frozenDraftSubtitle) {
    freezeDraftSubtitle(floor, layer);
  }
  revealSkillDraftModal();
  if (!draftCountdownTimer) {
    startDraftCountdown();
  }
}

function wireSkillDraftListeners(activeRoom: Room<XianState>) {
  const $ = getStateCallbacks(activeRoom);
  if (!$) return;

  const bindPlayer = (player: Player, sessionId: string) => {
    if (sessionId !== activeRoom.sessionId) return;
    $(player).listen("awaitingSkillDraft", (value: boolean) => {
      if (!value) clearDraftUiSettled();
      syncSkillDraftModal();
      updateHud();
    });
    $(player).listen("draftOfferIds", () => syncSkillDraftModal());
    $(player).listen("draftDeadlineMs", () => {
      if ((player.draftDeadlineMs as number) > 0) {
        skillDraftPickPhaseOpen = true;
      }
      syncSkillDraftModal();
    });
    $(player).listen("ownedSkillIds", () => updateHud());
  };

  $(activeRoom.state).players.onAdd((player, sessionId) => {
    bindPlayer(player, sessionId);
  });
  activeRoom.state.players.forEach((player, sessionId) => {
    bindPlayer(player, sessionId);
  });
}

function stopSkillCooldownHudLoop() {
  if (skillCooldownHudRaf) {
    cancelAnimationFrame(skillCooldownHudRaf);
    skillCooldownHudRaf = 0;
  }
}

function startSkillCooldownHudLoop() {
  stopSkillCooldownHudLoop();
  const tick = () => {
    updateSkillCooldownHud();
    skillCooldownHudRaf = requestAnimationFrame(tick);
  };
  skillCooldownHudRaf = requestAnimationFrame(tick);
}

function updateSkillCooldownHud() {
  if (!room) return;
  const me = room.state.players.get(room.sessionId);
  if (!me?.lastActiveSkillId) {
    skillCooldownEl.classList.add("hidden");
    return;
  }
  const skillMeta = getSkillById(me.lastActiveSkillId);
  if (
    !skillMeta ||
    (skillMeta.kind !== "active" && skillMeta.kind !== "hybrid")
  ) {
    skillCooldownEl.classList.add("hidden");
    return;
  }
  skillCooldownEl.classList.remove("hidden");
  skillCooldownName.textContent = skillMeta.nameTh;

  const { remainingMs, totalMs } = clientSkillCooldownForPlayer(
    me.lastActiveSkillId,
  );
  if (remainingMs > 0) {
    skillCooldownEl.classList.add("cooling");
    const ratio = remainingMs / totalMs;
    skillCooldownFill.style.transform = `scaleX(${ratio})`;
    const sec = (remainingMs / 1000).toFixed(1);
    skillCooldownLabel.textContent = `คูลดาว ${sec}s`;
  } else {
    skillCooldownEl.classList.remove("cooling");
    skillCooldownFill.style.transform = "scaleX(1)";
    skillCooldownLabel.textContent = "พร้อม · คลิกขวา / Shift";
  }
}

let lastStatsHtml = "";

function updateHud() {
  if (!room) return;
  const me = room.state.players.get(room.sessionId);
  if (!me) {
    return;
  }
  const realmName = realmDisplayName(
    me.realmFloor as number,
    (me.qiLayer as number) ?? 1,
  );
  const owned = parseSkillIds(me.ownedSkillIds);
  const vassanaPct = Math.min(
    100,
    Math.round((me.vassana / VASSANA_CAP) * 100),
  );
  const skillLine =
    owned.length > 0
      ? `<br/>วิชา: ${owned.length} · Shift: ${getSkillById(me.lastActiveSkillId)?.nameTh ?? "—"}`
      : "<br/><em>หนิงชี่ · โจมตีพื้นฐานอ่อน</em>";
  const statsHtml = `<strong>${me.name}</strong><br/>พลังปราณ: ${Math.floor(me.currentQi)}<br/>ขั้น: ${realmName}<br/>วาสนา: ${vassanaPct}%${skillLine}`;
  if (statsHtml !== lastStatsHtml) {
    lastStatsHtml = statsHtml;
    statsEl.innerHTML = statsHtml;
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

async function leaveToLobby() {
  hideRunSummaryModal();
  hideSkillDraftModal();
  clearInstantDraftCache();
  stopSkillCooldownHudLoop();
  stopDraftCountdown();
  const activeRoom = room;
  room = null;
  if (activeRoom) {
    try {
      await activeRoom.leave();
    } catch {
      /* already left */
    }
  }
  if (game) {
    game.destroy(true);
    game = null;
  }
  hud.classList.add("hidden");
  joinOverlay.classList.remove("hidden");
  joinBtn.disabled = false;
  lastStatsHtml = "";
}

async function joinGame() {
  const name = nameInput.value.trim() || "นักบำเพ็ต";
  joinBtn.disabled = true;
  hideRunSummaryModal();
  try {
    if (room || game) {
      await leaveToLobby();
    }
    const client = new Client(SERVER_URL);
    room = await joinXianRoom(client, SERVER_URL, name);
    joinOverlay.classList.add("hidden");
    hud.classList.remove("hidden");

    room.onMessage(
      "skillDraftCelebrate",
      (msg: {
        offerIds: string[];
        realmFloor: number;
        qiLayer: number;
        celebrateMs?: number;
      }) => {
        instantDraftOffers = msg.offerIds ?? [];
        instantDraftRealm = {
          realmFloor: msg.realmFloor,
          qiLayer: msg.qiLayer,
        };
        instantDraftDeadlineMs = null;
        skillDraftPickPhaseOpen = false;
        lastRenderedDraftOffersKey = "";
        frozenDraftSubtitle = "";
        stopDraftCountdown();
        hideSkillDraftModal();
      },
    );
    room.onMessage(
      "skillDraftOpen",
      (msg: {
        offerIds: string[];
        realmFloor: number;
        qiLayer: number;
        deadlineMs?: number;
      }) => {
        instantDraftOffers = msg.offerIds ?? [];
        instantDraftRealm = {
          realmFloor: msg.realmFloor,
          qiLayer: msg.qiLayer,
        };
        instantDraftDeadlineMs =
          msg.deadlineMs ?? Date.now() + SKILL_DRAFT_PICK_TIMEOUT_MS;
        skillDraftPickPhaseOpen = true;
        lastRenderedDraftOffersKey = "";
        frozenDraftSubtitle = "";
        stopDraftCountdown();
        syncSkillDraftModal();
      },
    );
    room.onMessage(
      "skillDraftComplete",
      (msg: { skillId?: string; autoPick?: boolean }) => {
        markDraftPickSent();
        hideSkillDraftModal();
        clearInstantDraftCache();
        updateHud();
        if (msg.autoPick) {
          const name = msg.skillId
            ? getSkillById(msg.skillId)?.nameTh
            : undefined;
          showToast(
            name
              ? `หมดเวลา — สุ่มวิชา「${name}」ให้แล้ว`
              : "หมดเวลา — สุ่มวิชาให้แล้ว",
          );
        }
      },
    );
    room.onMessage("skillDraftRejected", () => {
      clearDraftUiSettled();
      showToast("เลือกวิชาไม่สำเร็จ — ลองอีกครั้ง");
      syncSkillDraftModal();
    });

    room.onMessage("runSummary", (msg: RunSummaryPayload) => {
      showRunSummaryModal(msg);
      nameInput.value = msg.name;
    });

    wireSkillDraftListeners(room);

    room.onStateChange(() => {
      updateHud();
      syncSkillDraftModal();
    });
    updateHud();
    updateSkillCooldownHud();
    startSkillCooldownHudLoop();
    syncSkillDraftModal();

    game = new Phaser.Game({
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
    const gameRoot = document.getElementById("game");
    gameRoot?.addEventListener("contextmenu", (e) => e.preventDefault());

    game.scene.start("WorldScene", {
      room,
      onDeathMessage: (msg: { sessionId: string; name: string }) => {
        if (msg.sessionId === room!.sessionId) return;
        showToast(`${msg.name} ล้ม — ลมปราณกระจาย`);
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

runSummaryHomeBtn.addEventListener("click", () => {
  void leaveToLobby();
});

runSummaryRestartBtn.addEventListener("click", () => {
  const name = nameInput.value.trim() || "นักบำเพ็ต";
  void (async () => {
    await leaveToLobby();
    nameInput.value = name;
    await joinGame();
  })();
});
