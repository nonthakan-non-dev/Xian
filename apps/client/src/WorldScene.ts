import Phaser from "phaser";
import type { Room } from "colyseus.js";
import {
  ACTIVE_SKILL_COOLDOWN_MS,
  DAMAGE_TELEGRAPH_HOLD_BASIC_MS,
  DAMAGE_TELEGRAPH_HOLD_SKILL_MS,
  DEMON_ZONES,
  getSkillById,
  isInAnyDemonZone,
  MAP_HEIGHT,
  MAP_WIDTH,
  parseSkillIds,
  playerBodyRadius,
  realmDisplayName,
  telegraphForActiveSkill,
  telegraphForBasicAttack,
  type DamageTelegraph,
  type Player,
  type XianState,
} from "@xian/shared";
import { drawDamageTelegraph } from "./drawTelegraph.js";
import { isPlayerBlockedBySkillDraft } from "./draftUi.js";
import {
  clientSkillCooldownRemainingMs,
  recordClientSkillUse,
} from "./clientSkillCooldown.js";
import {
  notifySkillCooldownBlocked,
  setSkillCooldownBlockedHandler,
} from "./combatFeedback.js";
import { playSfx } from "./sfx.js";
import {
  applyPlayerColors,
  drawSwordOrbit,
  shadowStealthAlpha,
  spawnBodyShieldPulse,
  spawnQiCircleBurst,
  spawnSkillBeam,
} from "./playerVfx.js";

export class WorldScene extends Phaser.Scene {
  private room!: Room<XianState>;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private playerSprites = new Map<string, Phaser.GameObjects.Arc>();
  private playerGlow = new Map<string, Phaser.GameObjects.Arc>();
  private swordOrbits = new Map<string, Phaser.GameObjects.Graphics>();
  private prevQi = new Map<string, number>();
  private lastHitClientMs = new Map<string, number>();
  private zoneHighlightGfx?: Phaser.GameObjects.Graphics;
  private orbSprites = new Map<string, Phaser.GameObjects.Arc>();
  private labels = new Map<string, Phaser.GameObjects.Text>();
  private demonSprites = new Map<string, Phaser.GameObjects.Arc>();
  private lastInput = { x: 0, y: 0 };
  private inputResendAt = 0;
  /** Last non-zero move / aim direction for sword dash. */
  private facing = { x: 1, y: 0 };
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private shiftKey?: Phaser.Input.Keyboard.Key;
  private herbSprites = new Map<string, Phaser.GameObjects.Rectangle>();
  private onDeathMessage?: (payload: { sessionId: string; name: string }) => void;
  private telegraphGfx?: Phaser.GameObjects.Graphics;
  private telegraphClearAt = 0;

  constructor() {
    super({ key: "WorldScene" });
  }

  init(data: {
    room?: Room<XianState>;
    onDeathMessage?: (payload: { sessionId: string; name: string }) => void;
  }) {
    if (data?.room) this.room = data.room;
    this.onDeathMessage = data.onDeathMessage;
  }

  create() {
    if (!this.room) return;

    this.input.mouse?.disableContextMenu();

    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    const g = this.add.graphics();
    g.setDepth(-10);
    g.fillStyle(0x142218, 1);
    g.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    g.lineStyle(2, 0x2a4433, 0.5);
    for (let i = 0; i < MAP_WIDTH; i += 200) {
      g.lineBetween(i, 0, i, MAP_HEIGHT);
    }
    for (let j = 0; j < MAP_HEIGHT; j += 200) {
      g.lineBetween(0, j, MAP_WIDTH, j);
    }

    const zoneGfx = this.add.graphics();
    zoneGfx.setDepth(-5);
    for (const zone of DEMON_ZONES) {
      zoneGfx.fillStyle(0x661122, 0.12);
      zoneGfx.fillCircle(zone.cx, zone.cy, zone.radius);
      zoneGfx.lineStyle(3, 0xcc4455, 0.35);
      zoneGfx.strokeCircle(zone.cx, zone.cy, zone.radius);
    }
    this.zoneHighlightGfx = this.add.graphics().setDepth(-4);
    this.telegraphGfx = this.add.graphics().setDepth(14);

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = this.input.keyboard.addKeys("W,A,S,D") as typeof this.wasd;
      this.spaceKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE,
      );
      this.shiftKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SHIFT,
      );
    }

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const { x, y } = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      if (pointer.rightButtonDown()) {
        this.sendSkill(x, y);
        return;
      }
      if (pointer.leftButtonDown()) {
        this.sendAttack(x, y);
      }
    });

    this.room.onMessage("playerDeath", (msg: { sessionId: string; name: string }) => {
      this.onDeathMessage?.(msg);
    });

    this.room.onMessage(
      "damageNumber",
      (msg: {
        x: number;
        y: number;
        amount: number;
        crit?: boolean;
        poison?: boolean;
      }) => {
        this.spawnDamageNumber(
          msg.x,
          msg.y,
          msg.amount,
          msg.crit ?? false,
          msg.poison ?? false,
        );
      },
    );

    setSkillCooldownBlockedHandler(() => this.spawnCooldownHint());

    this.room.onMessage(
      "skillDraftCelebrate",
      (msg: { realmFloor: number; qiLayer: number }) => {
        this.spawnRealmPromoteCelebration(msg.realmFloor, msg.qiLayer);
      },
    );

    this.syncWorldFromState();
    this.room.onStateChange(() => this.syncWorldFromState());
  }

  private spawnRealmPromoteCelebration(realmFloor: number, qiLayer: number) {
    const sid = this.room?.sessionId;
    if (!sid) return;
    const { x, y } = this.visualPos(sid);
    const title = realmDisplayName(realmFloor, qiLayer);
    const ring = this.add.circle(x, y, 36, 0xffdd88, 0.45);
    ring.setDepth(12);
    this.tweens.add({
      targets: ring,
      scale: 2.8,
      alpha: 0,
      duration: 900,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
    const text = this.add
      .text(x, y - 48, `ขั้นฝึกขึ้น!\n${title}`, {
        fontSize: "18px",
        color: "#ffeebb",
        fontStyle: "bold",
        align: "center",
        stroke: "#2a1808",
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(46);
    this.tweens.add({
      targets: text,
      y: y - 100,
      alpha: 0,
      duration: 1000,
      delay: 350,
      ease: "Cubic.easeOut",
      onComplete: () => text.destroy(),
    });
    playSfx("skill");
  }

  private spawnCooldownHint() {
    const sid = this.room?.sessionId;
    if (!sid) return;
    const { x, y } = this.visualPos(sid);
    const text = this.add
      .text(x, y, "ติดคูลดาว", {
        fontSize: "13px",
        color: "#ffccaa",
        stroke: "#1a1008",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(45);
    this.tweens.add({
      targets: text,
      y: y - 36,
      alpha: 0,
      duration: 550,
      ease: "Cubic.easeOut",
      onComplete: () => text.destroy(),
    });
  }

  private spawnDamageNumber(
    x: number,
    y: number,
    amount: number,
    crit: boolean,
    poison: boolean,
  ) {
    const jitter = (Math.random() - 0.5) * 24;
    let color = "#ff9977";
    let fontSize = "15px";
    if (poison) {
      color = "#77dd88";
      fontSize = "13px";
    } else if (crit) {
      color = "#ffdd44";
      fontSize = "20px";
    }
    const label = `-${amount}`;
    const text = this.add
      .text(x + jitter, y - 22, label, {
        fontSize,
        color,
        fontStyle: crit ? "bold" : "normal",
        stroke: "#1a0a0a",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(40);
    this.tweens.add({
      targets: text,
      y: y - 58 - Math.random() * 16,
      alpha: 0,
      duration: 650,
      ease: "Cubic.easeOut",
      onComplete: () => text.destroy(),
    });
  }

  private canFight(): boolean {
    const me = this.room?.state.players.get(this.room.sessionId);
    if (!me || me.currentQi <= 0) return false;
    return !isPlayerBlockedBySkillDraft(me.awaitingSkillDraft);
  }

  /** Sprite on map (interpolated) — use for VFX; server still uses synced x/y. */
  private visualPos(sessionId: string): { x: number; y: number } {
    const spr = this.playerSprites.get(sessionId);
    const p = this.room?.state.players.get(sessionId);
    if (spr) return { x: spr.x, y: spr.y };
    if (p) return { x: p.x, y: p.y };
    return { x: 0, y: 0 };
  }

  private pointerWorld(): { x: number; y: number } {
    const p = this.input.activePointer;
    return this.cameras.main.getWorldPoint(p.x, p.y);
  }

  /** Server-synced origin — telegraph matches authoritative hit detection. */
  private combatOrigin(sessionId: string): { x: number; y: number } {
    const p = this.room?.state.players.get(sessionId);
    if (p) return { x: p.x, y: p.y };
    return this.visualPos(sessionId);
  }

  private haltMovement() {
    if (!this.room) return;
    this.lastInput = { x: 0, y: 0 };
    this.room.send("input", { x: 0, y: 0 });
    this.inputResendAt = this.time.now;
  }

  private showDamageTelegraph(t: DamageTelegraph, holdMs: number, skill = false) {
    const g = this.telegraphGfx;
    if (!g) return;
    const fill = skill ? 0x6688ff : 0xff8866;
    const stroke = skill ? 0xaaccff : 0xffaa88;
    drawDamageTelegraph(g, t, fill, stroke);
    this.telegraphClearAt = this.time.now + holdMs;
  }

  private setFacingToward(worldX: number, worldY: number, fromX: number, fromY: number) {
    const dx = worldX - fromX;
    const dy = worldY - fromY;
    const len = Math.hypot(dx, dy);
    if (len > 8) {
      this.facing = { x: dx / len, y: dy / len };
    }
  }

  private skillAimPoint(sessionId: string): { aimX: number; aimY: number } {
    const origin = this.visualPos(sessionId);
    const pw = this.pointerWorld();
    const dist = Phaser.Math.Distance.Between(origin.x, origin.y, pw.x, pw.y);
    if (dist > 12) {
      return { aimX: pw.x, aimY: pw.y };
    }
    return {
      aimX: origin.x + this.facing.x * 200,
      aimY: origin.y + this.facing.y * 200,
    };
  }

  private sendAttack(worldX: number, worldY: number) {
    if (!this.room || !this.canFight()) return;
    const sid = this.room.sessionId;
    const me = this.room.state.players.get(sid);
    if (!me) return;
    this.haltMovement();
    const origin = this.combatOrigin(sid);
    const owned = parseSkillIds(me.ownedSkillIds);
    this.showDamageTelegraph(
      telegraphForBasicAttack(origin.x, origin.y, worldX, worldY, owned),
      DAMAGE_TELEGRAPH_HOLD_BASIC_MS,
      false,
    );
    const vfx = this.visualPos(sid);
    this.setFacingToward(worldX, worldY, vfx.x, vfx.y);
    this.room.send("attack", { aimX: worldX, aimY: worldY });
    playSfx("hit");
    const flash = this.add.circle(vfx.x, vfx.y, 28, 0xffeedd, 0.25);
    flash.setDepth(9);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.6,
      duration: 180,
      onComplete: () => flash.destroy(),
    });
  }

  private sendSkill(worldX: number, worldY: number) {
    if (!this.room || !this.canFight()) return;
    const sid = this.room.sessionId;
    const me = this.room.state.players.get(sid);
    if (!me) return;
    const skill = me.lastActiveSkillId
      ? getSkillById(me.lastActiveSkillId)
      : undefined;
    if (!skill || (skill.kind !== "active" && skill.kind !== "hybrid")) {
      return;
    }
    if (clientSkillCooldownRemainingMs(skill) > 0) {
      notifySkillCooldownBlocked();
      return;
    }
    this.haltMovement();
    const origin = this.combatOrigin(sid);
    const vfx = this.visualPos(sid);
    const rc = skill.rangeClass;
    if (rc === "dash" || rc === "line" || rc === "cone" || rc === "single") {
      const aim = this.skillAimPoint(sid);
      worldX = aim.aimX;
      worldY = aim.aimY;
    } else if (rc === "global") {
      const aim = this.skillAimPoint(sid);
      worldX = aim.aimX;
      worldY = aim.aimY;
    }
    this.showDamageTelegraph(
      telegraphForActiveSkill(origin.x, origin.y, worldX, worldY, skill),
      DAMAGE_TELEGRAPH_HOLD_SKILL_MS,
      true,
    );
    recordClientSkillUse();
    this.room.send("skill", { aimX: worldX, aimY: worldY });
    playSfx("skill");
    const r = playerBodyRadius(me.realmFloor);
    if (rc === "self") {
      spawnBodyShieldPulse(this, vfx.x, vfx.y, r);
    } else if (rc === "circle") {
      spawnQiCircleBurst(this, vfx.x, vfx.y);
    } else if (rc === "line" || rc === "cone" || rc === "single" || rc === "global") {
      spawnSkillBeam(this, vfx.x, vfx.y, worldX, worldY);
    } else if (rc === "dash") {
      spawnSkillBeam(this, vfx.x, vfx.y, worldX, worldY);
    }
    const flash = this.add.circle(vfx.x, vfx.y, 36, 0xaaccff, 0.35);
    flash.setDepth(9);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.8,
      duration: 220,
      onComplete: () => flash.destroy(),
    });
  }

  /** State arrives after JOIN; map callbacks may not fire for the initial snapshot. */
  private syncWorldFromState() {
    const playerIds = new Set<string>();
    this.room.state.players.forEach((p, id) => {
      playerIds.add(id);
      this.ensurePlayer(id, p);
      this.syncPlayerVisual(id, p);
    });
    for (const id of this.playerSprites.keys()) {
      if (!playerIds.has(id)) {
        this.playerSprites.get(id)?.destroy();
        this.playerGlow.get(id)?.destroy();
        this.swordOrbits.get(id)?.destroy();
        this.labels.get(id)?.destroy();
        this.playerSprites.delete(id);
        this.playerGlow.delete(id);
        this.swordOrbits.delete(id);
        this.prevQi.delete(id);
        this.lastHitClientMs.delete(id);
        this.labels.delete(id);
      }
    }

    const orbIds = new Set<string>();
    this.room.state.orbs.forEach((o, id) => {
      orbIds.add(id);
      this.ensureOrb(id, o);
    });
    for (const id of this.orbSprites.keys()) {
      if (!orbIds.has(id)) {
        this.orbSprites.get(id)?.destroy();
        this.orbSprites.delete(id);
      }
    }

    const demonIds = new Set<string>();
    this.room.state.demons.forEach((d, id) => {
      demonIds.add(id);
      this.ensureDemon(id, d);
    });
    for (const id of this.demonSprites.keys()) {
      if (!demonIds.has(id)) {
        this.demonSprites.get(id)?.destroy();
        this.demonSprites.delete(id);
      }
    }

    const herbIds = new Set<string>();
    this.room.state.herbs.forEach((h, id) => {
      herbIds.add(id);
      this.ensureHerb(id, h);
    });
    for (const id of this.herbSprites.keys()) {
      if (!herbIds.has(id)) {
        this.herbSprites.get(id)?.destroy();
        this.herbSprites.delete(id);
      }
    }
  }

  update() {
    if (!this.room) return;

    let ix = 0;
    let iy = 0;
    if (this.cursors?.left.isDown || this.wasd?.A.isDown) ix -= 1;
    if (this.cursors?.right.isDown || this.wasd?.D.isDown) ix += 1;
    if (this.cursors?.up.isDown || this.wasd?.W.isDown) iy -= 1;
    if (this.cursors?.down.isDown || this.wasd?.S.isDown) iy += 1;

    if (ix !== 0 || iy !== 0) {
      const len = Math.hypot(ix, iy);
      this.facing = { x: ix / len, y: iy / len };
    }

    const now = this.time.now;
    const meInput = this.room.state.players.get(this.room.sessionId);
    const draftLocked = isPlayerBlockedBySkillDraft(
      meInput?.awaitingSkillDraft ?? false,
    );

    let combatThisFrame = false;

    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      const sid = this.room.sessionId;
      if (this.room.state.players.get(sid)) {
        const { aimX, aimY } = this.skillAimPoint(sid);
        this.sendAttack(aimX, aimY);
        combatThisFrame = true;
      }
    }

    if (this.shiftKey && Phaser.Input.Keyboard.JustDown(this.shiftKey)) {
      const sid = this.room.sessionId;
      if (this.room.state.players.get(sid)) {
        const { aimX, aimY } = this.skillAimPoint(sid);
        this.sendSkill(aimX, aimY);
        combatThisFrame = true;
      }
    }

    const inputChanged = ix !== this.lastInput.x || iy !== this.lastInput.y;
    const moving = ix !== 0 || iy !== 0;
    if (
      !draftLocked &&
      !combatThisFrame &&
      (inputChanged || (moving && now - this.inputResendAt > 120))
    ) {
      this.lastInput = { x: ix, y: iy };
      this.room.send("input", { x: ix, y: iy });
      this.inputResendAt = now;
    }

    this.updateDemonZoneHighlight();

    if (this.telegraphGfx && this.time.now >= this.telegraphClearAt) {
      this.telegraphGfx.clear();
    }

    for (const [id, p] of this.room.state.players) {
      if (!this.playerSprites.has(id)) {
        this.ensurePlayer(id, p);
      }
      const sprite = this.playerSprites.get(id);
      const glow = this.playerGlow.get(id);
      const orbit = this.swordOrbits.get(id);
      if (sprite) {
        const prev = this.prevQi.get(id) ?? p.currentQi;
        if (p.currentQi < prev - 0.01) {
          this.lastHitClientMs.set(id, now);
        }
        this.prevQi.set(id, p.currentQi);

        const isSelf = id === this.room.sessionId;
        const snapDist = isSelf ? 72 : 140;
        const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, p.x, p.y);
        if (dist > snapDist) {
          sprite.setPosition(p.x, p.y);
        } else {
          const follow = isSelf ? 0.52 : 0.35;
          sprite.x = Phaser.Math.Linear(sprite.x, p.x, follow);
          sprite.y = Phaser.Math.Linear(sprite.y, p.y, follow);
        }
        if (glow) {
          glow.x = sprite.x;
          glow.y = sprite.y;
        }
        sprite.setAlpha(
          shadowStealthAlpha(p, this.lastHitClientMs.get(id), now),
        );
        if (orbit) {
          drawSwordOrbit(orbit, sprite.x, sprite.y, p, now / 1000);
        }
        if (glow) {
          applyPlayerColors(sprite, glow, p);
        }
        const label = this.labels.get(id);
        if (label) {
          label.x = sprite.x;
          label.y = sprite.y - playerBodyRadius(p.realmFloor) - 16;
        }
      }
    }
    for (const [id, o] of this.room.state.orbs) {
      if (!this.orbSprites.has(id)) this.ensureOrb(id, o);
      const orb = this.orbSprites.get(id);
      if (orb) {
        orb.x = o.x;
        orb.y = o.y;
      }
    }
    for (const [id, d] of this.room.state.demons) {
      if (!this.demonSprites.has(id)) this.ensureDemon(id, d);
      const demon = this.demonSprites.get(id);
      if (demon) {
        demon.x = Phaser.Math.Linear(demon.x, d.x, 0.4);
        demon.y = Phaser.Math.Linear(demon.y, d.y, 0.4);
      }
    }
    for (const [id, h] of this.room.state.herbs) {
      if (!this.herbSprites.has(id)) this.ensureHerb(id, h);
      const herb = this.herbSprites.get(id);
      if (herb) {
        herb.x = h.x;
        herb.y = h.y;
      }
    }
  }

  private updateDemonZoneHighlight() {
    const g = this.zoneHighlightGfx;
    const me = this.room?.state.players.get(this.room.sessionId);
    if (!g || !me) return;
    g.clear();
    const inside = isInAnyDemonZone(me.x, me.y);
    for (const zone of DEMON_ZONES) {
      const d = Phaser.Math.Distance.Between(me.x, me.y, zone.cx, zone.cy);
      if (d > zone.radius + 420) continue;
      const alpha = d <= zone.radius ? 0.2 : inside ? 0.12 : 0.07;
      g.fillStyle(0xcc3344, alpha);
      g.fillCircle(zone.cx, zone.cy, zone.radius);
      g.lineStyle(
        inside && d <= zone.radius ? 4 : 2,
        0xff6677,
        inside ? 0.55 : 0.25,
      );
      g.strokeCircle(zone.cx, zone.cy, zone.radius);
    }
  }

  private syncPlayerVisual(id: string, p: Player) {
    const sprite = this.playerSprites.get(id);
    const glow = this.playerGlow.get(id);
    if (sprite && glow) {
      applyPlayerColors(sprite, glow, p);
    }
    const label = this.labels.get(id);
    if (label) {
      label.setText(p.name);
    }
    if (id === this.room.sessionId && sprite) {
      this.cameras.main.startFollow(sprite, true, 0.12, 0.12);
    }
  }

  private ensurePlayer(id: string, p: Player) {
    if (this.playerSprites.has(id)) return;
    const r = playerBodyRadius(p.realmFloor);
    const glow = this.add.circle(p.x, p.y, r + 14, 0x446688, 0.22);
    glow.setDepth(9);
    const arc = this.add.circle(p.x, p.y, r, 0x88ccff, 1);
    arc.setDepth(10);
    const orbit = this.add.graphics().setDepth(10);
    applyPlayerColors(arc, glow, p);
    this.playerGlow.set(id, glow);
    this.playerSprites.set(id, arc);
    this.swordOrbits.set(id, orbit);
    this.prevQi.set(id, p.currentQi);
    const label = this.add
      .text(p.x, p.y - r - 16, p.name, {
        fontSize: "13px",
        color: "#e8f4ff",
        stroke: "#0a1218",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(11);
    this.labels.set(id, label);
    if (id === this.room.sessionId) {
      this.cameras.main.startFollow(arc, true, 0.12, 0.12);
    }
  }

  private ensureOrb(id: string, o: { x: number; y: number; value?: number }) {
    if (this.orbSprites.has(id)) return;
    const r = o.value && o.value > 12 ? 9 : 6;
    const orb = this.add.circle(o.x, o.y, r, 0x55ddff, 0.9);
    orb.setDepth(5);
    orb.setStrokeStyle(1, 0xaaffff, 0.8);
    this.orbSprites.set(id, orb);
  }

  private ensureDemon(
    id: string,
    d: { x: number; y: number; kind: string; currentQi: number },
  ) {
    if (this.demonSprites.has(id)) return;
    const deep = d.kind === "deep";
    const color = deep ? 0xaa33cc : 0xdd5522;
    const r = deep ? 20 : 16;
    const arc = this.add.circle(d.x, d.y, r, color, 0.95);
    arc.setDepth(8);
    arc.setStrokeStyle(2, 0xff8888, 0.7);
    this.demonSprites.set(id, arc);
  }

  private ensureHerb(id: string, h: { x: number; y: number }) {
    if (this.herbSprites.has(id)) return;
    const herb = this.add.rectangle(h.x, h.y, 14, 14, 0x44dd66, 0.95);
    herb.setDepth(6);
    herb.setStrokeStyle(2, 0xbbffcc, 0.9);
    this.herbSprites.set(id, herb);
  }
}
