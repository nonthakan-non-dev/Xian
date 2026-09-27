import { Room, Client } from "@colyseus/core";
import {
  applyDamageToQi,
  applyOrbPickup,
  BASIC_ATTACK_COOLDOWN_MS,
  BASIC_ATTACK_DAMAGE,
  BASIC_ATTACK_RANGE,
  DEMON_STATS,
  DEMON_ZONES,
  DemonKind,
  MAP_HEIGHT,
  MAP_WIDTH,
  MAX_PLAYERS,
  ORB_VALUE,
  ORB_PICKUP_RADIUS,
  ORB_SPAWN_INTERVAL_MS,
  ORB_TARGET_COUNT,
  RESPAWN_QI,
  addVassanaOnDemonKill,
  damageDemon,
  isInAnyDemonZone,
  isInAttackArc,
  maxQiForRealm,
  moveSpeedForRealm,
  promoteRealmFloor,
  qiToOrbValues,
  randomPointInZone,
  rollOrbWithVassana,
  tickVassana,
  TICK_RATE_MS,
} from "@xian/shared";
import { Demon, Orb, Player, XianState } from "../schema.js";

let orbCounter = 0;
let demonCounter = 0;

function randomPosition(): { x: number; y: number } {
  const margin = 120;
  return {
    x: margin + Math.random() * (MAP_WIDTH - margin * 2),
    y: margin + Math.random() * (MAP_HEIGHT - margin * 2),
  };
}

function respawnAtEdge(): { x: number; y: number } {
  const margin = 100;
  const edge = Math.floor(Math.random() * 4);
  switch (edge) {
    case 0:
      return { x: margin + Math.random() * (MAP_WIDTH - margin * 2), y: margin };
    case 1:
      return {
        x: MAP_WIDTH - margin,
        y: margin + Math.random() * (MAP_HEIGHT - margin * 2),
      };
    case 2:
      return {
        x: margin + Math.random() * (MAP_WIDTH - margin * 2),
        y: MAP_HEIGHT - margin,
      };
    default:
      return { x: margin, y: margin + Math.random() * (MAP_HEIGHT - margin * 2) };
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export class XianRoom extends Room {
  state = new XianState();
  private lastAttackMs = new Map<string, number>();
  private lastDemonAttackMs = new Map<string, number>();

  onCreate() {
    this.maxClients = MAX_PLAYERS;

    this.onMessage("input", (client, data: { x?: number; y?: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const ix = Number(data.x);
      const iy = Number(data.y);
      player.inputX = clamp(Number.isFinite(ix) ? ix : 0, -1, 1);
      player.inputY = clamp(Number.isFinite(iy) ? iy : 0, -1, 1);
    });

    this.onMessage(
      "attack",
      (client, data: { aimX?: number; aimY?: number }) => {
        this.handlePlayerAttack(
          client.sessionId,
          Number(data.aimX),
          Number(data.aimY),
        );
      },
    );

    this.setSimulationInterval(() => this.tick(), TICK_RATE_MS);

    this.spawnOrbs(ORB_TARGET_COUNT);
    this.clock.setInterval(() => this.maintainOrbs(), ORB_SPAWN_INTERVAL_MS);
    this.seedDemons();
  }

  onJoin(client: Client, options: { name?: string }) {
    const name = (options.name ?? "นักบำเพ็ต").slice(0, 24);
    const pos = randomPosition();
    const player = new Player();
    player.sessionId = client.sessionId;
    player.name = name;
    player.x = pos.x;
    player.y = pos.y;
    player.currentQi = 20;
    player.realmFloor = 1;
    player.vassana = 0;
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    this.lastAttackMs.delete(client.sessionId);
  }

  private tick() {
    const dt = TICK_RATE_MS / 1000;
    for (const player of this.state.players.values()) {
      if (player.currentQi <= 0) continue;

      player.vassana = tickVassana(
        player.vassana,
        dt,
        isInAnyDemonZone(player.x, player.y),
      );

      const len = Math.hypot(player.inputX, player.inputY);
      if (len > 0.01) {
        const speed = moveSpeedForRealm(player.realmFloor);
        const nx = player.inputX / len;
        const ny = player.inputY / len;
        player.x = clamp(player.x + nx * speed * dt, 0, MAP_WIDTH);
        player.y = clamp(player.y + ny * speed * dt, 0, MAP_HEIGHT);
      }
      this.tryPickupOrbs(player);
    }

    this.tickDemons(dt);
  }

  private handlePlayerAttack(
    sessionId: string,
    aimX: number,
    aimY: number,
  ) {
    const attacker = this.state.players.get(sessionId);
    if (!attacker || attacker.currentQi <= 0) return;

    const now = this.clock.elapsedTime;
    const last = this.lastAttackMs.get(sessionId) ?? 0;
    if (now - last < BASIC_ATTACK_COOLDOWN_MS) return;
    this.lastAttackMs.set(sessionId, now);

    const aimAngle = Math.atan2(
      aimY - attacker.y,
      aimX - attacker.x,
    );

    for (const [id, target] of this.state.players) {
      if (id === sessionId || target.currentQi <= 0) continue;
      if (
        isInAttackArc(
          attacker.x,
          attacker.y,
          aimAngle,
          target.x,
          target.y,
          BASIC_ATTACK_RANGE,
        )
      ) {
        const prevQi = target.currentQi;
        target.currentQi = applyDamageToQi(prevQi, BASIC_ATTACK_DAMAGE);
        if (target.currentQi <= 0) {
          this.killPlayer(target, id, prevQi);
        }
      }
    }

    for (const [demonId, demon] of this.state.demons) {
      if (demon.currentQi <= 0) continue;
      if (
        isInAttackArc(
          attacker.x,
          attacker.y,
          aimAngle,
          demon.x,
          demon.y,
          BASIC_ATTACK_RANGE,
        )
      ) {
        demon.currentQi = damageDemon(demon.currentQi, BASIC_ATTACK_DAMAGE);
        if (demon.currentQi <= 0) {
          this.killDemon(demon, demonId, attacker);
        }
      }
    }
  }

  private killPlayer(player: Player, sessionId: string, qiBeforeDeath: number) {
    const drop = qiToOrbValues(qiBeforeDeath);
    for (const value of drop) {
      this.spawnOrbAt(player.x, player.y, value);
    }
    const pos = respawnAtEdge();
    player.x = pos.x;
    player.y = pos.y;
    player.currentQi = RESPAWN_QI;
    this.broadcast("playerDeath", { sessionId, name: player.name });
  }

  private killDemon(demon: Demon, demonId: string, killer: Player) {
    const kind = demon.kind as DemonKind;
    const stats = DEMON_STATS[kind] ?? DEMON_STATS.wild;
    this.spawnOrbAt(demon.x, demon.y, stats.orbDrop);
    killer.vassana = addVassanaOnDemonKill(killer.vassana);
    this.state.demons.delete(demonId);
    this.clock.setTimeout(() => this.tryRespawnDemon(demon.zoneId, kind), 4000);
  }

  private tickDemons(dt: number) {
    let nearestPlayer: Player | undefined;
    let nearestDist = Infinity;

    for (const demon of this.state.demons.values()) {
      if (demon.currentQi <= 0) continue;

      nearestPlayer = undefined;
      nearestDist = Infinity;
      for (const player of this.state.players.values()) {
        if (player.currentQi <= 0) continue;
        const dist = Math.hypot(player.x - demon.x, player.y - demon.y);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestPlayer = player;
        }
      }

      const zone = DEMON_ZONES.find((z) => z.id === demon.zoneId);
      if (!zone) continue;

      const kind = demon.kind as DemonKind;
      const stats = DEMON_STATS[kind] ?? DEMON_STATS.wild;

      if (nearestPlayer && nearestDist < zone.radius * 1.2) {
        const dx = nearestPlayer.x - demon.x;
        const dy = nearestPlayer.y - demon.y;
        const len = Math.hypot(dx, dy) || 1;
        demon.x += (dx / len) * stats.speed * dt;
        demon.y += (dy / len) * stats.speed * dt;

        if (nearestDist < 36) {
          const now = this.clock.elapsedTime;
          const last = this.lastDemonAttackMs.get(demon.id) ?? 0;
          if (now - last >= 600) {
            this.lastDemonAttackMs.set(demon.id, now);
            const prevQi = nearestPlayer.currentQi;
            nearestPlayer.currentQi = applyDamageToQi(prevQi, stats.damage);
            if (nearestPlayer.currentQi <= 0) {
              const sid = [...this.state.players.entries()].find(
                ([, p]) => p === nearestPlayer,
              )?.[0];
              if (sid) this.killPlayer(nearestPlayer, sid, prevQi);
            }
          }
        }
      }
    }
  }

  private seedDemons() {
    for (const zone of DEMON_ZONES) {
      for (let i = 0; i < zone.wildQuota; i++) {
        this.spawnDemonInZone(zone.id, "wild");
      }
      for (let i = 0; i < zone.deepQuota; i++) {
        this.spawnDemonInZone(zone.id, "deep");
      }
    }
  }

  private tryRespawnDemon(zoneId: string, kind: DemonKind) {
    const zone = DEMON_ZONES.find((z) => z.id === zoneId);
    if (!zone) return;
    const count = [...this.state.demons.values()].filter(
      (d) => d.zoneId === zoneId && d.kind === kind,
    ).length;
    const quota = kind === "wild" ? zone.wildQuota : zone.deepQuota;
    if (count < quota) {
      this.spawnDemonInZone(zoneId, kind);
    }
  }

  private spawnDemonInZone(zoneId: string, kind: DemonKind) {
    const zone = DEMON_ZONES.find((z) => z.id === zoneId);
    if (!zone) return;
    const stats = DEMON_STATS[kind];
    const pos = randomPointInZone(zone);
    const demon = new Demon();
    demon.id = `d${++demonCounter}`;
    demon.x = pos.x;
    demon.y = pos.y;
    demon.currentQi = stats.maxQi;
    demon.kind = kind;
    demon.zoneId = zoneId;
    this.state.demons.set(demon.id, demon);
  }

  private tryPickupOrbs(player: Player) {
    const toRemove: string[] = [];
    for (const [id, orb] of this.state.orbs) {
      const dist = Math.hypot(orb.x - player.x, orb.y - player.y);
      if (dist <= ORB_PICKUP_RADIUS) {
        const base = orb.value > 0 ? orb.value : ORB_VALUE;
        const gained = rollOrbWithVassana(base, player.vassana);
        const maxQi = maxQiForRealm(player.realmFloor);
        player.currentQi = applyOrbPickup(player.currentQi, gained, maxQi);
        player.realmFloor = promoteRealmFloor(
          player.currentQi,
          player.realmFloor,
        );
        toRemove.push(id);
      }
    }
    for (const id of toRemove) {
      this.state.orbs.delete(id);
    }
  }

  private spawnOrbs(count: number) {
    for (let i = 0; i < count; i++) {
      this.addOrb();
    }
  }

  private addOrb() {
    const pos = randomPosition();
    this.spawnOrbAt(pos.x, pos.y, ORB_VALUE);
  }

  private spawnOrbAt(x: number, y: number, value: number) {
    const orb = new Orb();
    orb.id = `o${++orbCounter}`;
    orb.x = x + (Math.random() - 0.5) * 40;
    orb.y = y + (Math.random() - 0.5) * 40;
    orb.value = value;
    this.state.orbs.set(orb.id, orb);
  }

  private maintainOrbs() {
    while (this.state.orbs.size < ORB_TARGET_COUNT) {
      this.addOrb();
    }
  }
}
