import Phaser from "phaser";
import type { Room } from "colyseus.js";
import {
  DEMON_ZONES,
  isCombatKitActive,
  MAP_HEIGHT,
  MAP_WIDTH,
  type Player,
  type XianState,
} from "@xian/shared";

const REALM_COLORS = [
  0x88ccff, 0x66aaff, 0x44ddaa, 0xddcc44, 0xdd8844, 0xcc44aa, 0xffeedd,
];

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
  private orbSprites = new Map<string, Phaser.GameObjects.Arc>();
  private labels = new Map<string, Phaser.GameObjects.Text>();
  private demonSprites = new Map<string, Phaser.GameObjects.Arc>();
  private lastInput = { x: 0, y: 0 };
  /** Last non-zero move / aim direction for sword dash. */
  private facing = { x: 1, y: 0 };
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private shiftKey?: Phaser.Input.Keyboard.Key;
  private herbSprites = new Map<string, Phaser.GameObjects.Rectangle>();
  private onDeathMessage?: (payload: { sessionId: string; name: string }) => void;

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
      if (pointer.rightButtonDown()) {
        this.sendSkill(pointer.worldX, pointer.worldY);
        return;
      }
      if (pointer.leftButtonDown()) {
        this.sendAttack(pointer.worldX, pointer.worldY);
      }
    });

    this.room.onMessage("playerDeath", (msg: { sessionId: string; name: string }) => {
      this.onDeathMessage?.(msg);
    });

    this.syncWorldFromState();
    this.room.onStateChange(() => this.syncWorldFromState());
  }

  private canFight(): boolean {
    const me = this.room?.state.players.get(this.room.sessionId);
    if (!me || me.currentQi <= 0) return false;
    return isCombatKitActive(
      me.realmFloor,
      me.daoPath,
      me.awaitingPathChoice,
    );
  }

  private setFacingToward(worldX: number, worldY: number, fromX: number, fromY: number) {
    const dx = worldX - fromX;
    const dy = worldY - fromY;
    const len = Math.hypot(dx, dy);
    if (len > 8) {
      this.facing = { x: dx / len, y: dy / len };
    }
  }

  private skillAimPoint(me: Player): { aimX: number; aimY: number } {
    if (me.daoPath === "sword") {
      return {
        aimX: me.x + this.facing.x * 200,
        aimY: me.y + this.facing.y * 200,
      };
    }
    const pointer = this.input.activePointer;
    return {
      aimX: pointer.worldX || me.x + 80,
      aimY: pointer.worldY || me.y,
    };
  }

  private sendAttack(worldX: number, worldY: number) {
    if (!this.room || !this.canFight()) return;
    const me = this.room.state.players.get(this.room.sessionId);
    if (!me) return;
    this.setFacingToward(worldX, worldY, me.x, me.y);
    this.room.send("attack", { aimX: worldX, aimY: worldY });
    const flash = this.add.circle(me.x, me.y, 28, 0xffeedd, 0.25);
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
    const me = this.room.state.players.get(this.room.sessionId);
    if (!me) return;
    if (me.daoPath === "sword") {
      const aim = this.skillAimPoint(me);
      worldX = aim.aimX;
      worldY = aim.aimY;
    }
    this.room.send("skill", { aimX: worldX, aimY: worldY });
    const flash = this.add.circle(me.x, me.y, 36, 0xaaccff, 0.35);
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
        this.labels.get(id)?.destroy();
        this.playerSprites.delete(id);
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

    if (ix !== this.lastInput.x || iy !== this.lastInput.y) {
      this.lastInput = { x: ix, y: iy };
      this.room.send("input", { x: ix, y: iy });
    }

    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      const me = this.room.state.players.get(this.room.sessionId);
      if (me) {
        const pointer = this.input.activePointer;
        const aimX = pointer.worldX || me.x + 80;
        const aimY = pointer.worldY || me.y;
        this.sendAttack(aimX, aimY);
      }
    }

    if (this.shiftKey && Phaser.Input.Keyboard.JustDown(this.shiftKey)) {
      const me = this.room.state.players.get(this.room.sessionId);
      if (me) {
        const { aimX, aimY } = this.skillAimPoint(me);
        this.sendSkill(aimX, aimY);
      }
    }

    for (const [id, p] of this.room.state.players) {
      if (!this.playerSprites.has(id)) {
        this.ensurePlayer(id, p);
      }
      const sprite = this.playerSprites.get(id);
      if (sprite) {
        sprite.x = Phaser.Math.Linear(sprite.x, p.x, 0.35);
        sprite.y = Phaser.Math.Linear(sprite.y, p.y, 0.35);
        const label = this.labels.get(id);
        if (label) {
          label.x = sprite.x;
          label.y = sprite.y - 28;
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

  private syncPlayerVisual(id: string, p: Player) {
    const sprite = this.playerSprites.get(id);
    if (sprite) {
      const color = REALM_COLORS[(p.realmFloor - 1) % REALM_COLORS.length];
      sprite.setFillStyle(color, 1);
      sprite.setRadius(14 + p.realmFloor * 2);
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
    const color = REALM_COLORS[(p.realmFloor - 1) % REALM_COLORS.length];
    const r = 14 + p.realmFloor * 2;
    const arc = this.add.circle(p.x, p.y, r, color, 1);
    arc.setDepth(10);
    arc.setStrokeStyle(2, 0xffffff, 0.6);
    this.playerSprites.set(id, arc);
    const label = this.add
      .text(p.x, p.y - 28, p.name, {
        fontSize: "14px",
        color: "#ffffff",
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
