import { Room, Client } from "@colyseus/core";
import {
  ACTIVE_SKILL_COOLDOWN_MS,
  addPoisonStack,
  applyDamageToQi,
  applyIronSkinDamage,
  basicAttackArcWidth,
  basicAttackRange,
  BASIC_ATTACK_COOLDOWN_MS,
  isBodyMeleeHit,
  DASH_DISTANCE,
  DEMON_STATS,
  DEMON_ZONES,
  DemonKind,
  flyingSwordCount,
  FLYING_SWORD_DAMAGE,
  FLYING_SWORD_INTERVAL_MS,
  FLYING_SWORD_RANGE,
  HERB_BUFF_MS,
  HERB_PICKUP_RADIUS,
  HERB_QI_BONUS,
  HERB_SPAWN_INTERVAL_MS,
  HERB_TARGET_COUNT,
  herbAoeRadiusBonus,
  herbDamageTakenMultiplier,
  herbPoisonTickMultiplier,
  herbSpeedMultiplier,
  isBodyStunImmune,
  isCombatKitActive,
  isInAttackArc,
  isValidDaoPath,
  LIGHTNING_AOE_RADIUS,
  MAP_HEIGHT,
  MAP_WIDTH,
  MAX_PLAYERS,
  moveSpeedForRealm,
  ORB_VALUE,
  ORB_PICKUP_RADIUS,
  ORB_SPAWN_INTERVAL_MS,
  ORB_TARGET_COUNT,
  overloadOnSkillUse,
  poisonDamagePerTick,
  promoteRealmFloor,
  qiToOrbValues,
  randomPointInZone,
  RESPAWN_QI,
  resolveActiveDamage,
  resolveBasicDamage,
  resolveFacingUnitVector,
  rollOrbWithVassana,
  SHADOW_WARP_RANGE,
  SHIELD_DURATION_MS,
  shouldAwaitPathChoice,
  SLOW_MS,
  STUN_MS,
  shadowStealthSpeedBonus,
  addVassanaOnDemonKill,
  applyOrbPickup,
  damageDemon,
  isInAnyDemonZone,
  maxQiForRealm,
  tickVassana,
  TICK_RATE_MS,
} from "@xian/shared";
import { Demon, Herb, Orb, Player, XianState } from "../schema.js";

let orbCounter = 0;
let demonCounter = 0;
let herbCounter = 0;

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

function distPoint(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  return Math.hypot(bx - ax, by - ay);
}

export class XianRoom extends Room {
  state = new XianState();
  private lastAttackMs = new Map<string, number>();
  private lastSkillMs = new Map<string, number>();
  private lastDemonAttackMs = new Map<string, number>();
  private lastFlyingSwordMs = new Map<string, number>();

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

    this.onMessage(
      "skill",
      (client, data: { aimX?: number; aimY?: number }) => {
        this.handlePlayerSkill(
          client.sessionId,
          Number(data.aimX),
          Number(data.aimY),
        );
      },
    );

    this.onMessage("choosePath", (client, data: { path?: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const path = String(data.path ?? "");
      if (!isValidDaoPath(path)) return;
      if (!player.awaitingPathChoice) return;
      player.daoPath = path;
      player.awaitingPathChoice = false;
    });

    this.setSimulationInterval(() => this.tick(), TICK_RATE_MS);

    this.spawnOrbs(ORB_TARGET_COUNT);
    this.clock.setInterval(() => this.maintainOrbs(), ORB_SPAWN_INTERVAL_MS);
    this.spawnHerbs(HERB_TARGET_COUNT);
    this.clock.setInterval(() => this.maintainHerbs(), HERB_SPAWN_INTERVAL_MS);
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
    player.daoPath = "";
    player.awaitingPathChoice = false;
    player.poisonStacks = 0;
    player.overloadStacks = 0;
    player.stunUntil = 0;
    player.slowUntil = 0;
    player.shieldUntil = 0;
    player.herbBuffUntil = 0;
    player.lastDamagedAt = 0;
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    this.lastAttackMs.delete(client.sessionId);
    this.lastSkillMs.delete(client.sessionId);
    this.lastFlyingSwordMs.delete(client.sessionId);
  }

  private nowMs(): number {
    return this.clock.elapsedTime;
  }

  private emitDamageNumber(
    x: number,
    y: number,
    amount: number,
    opts?: { crit?: boolean; poison?: boolean },
  ) {
    const rounded = Math.round(amount);
    if (rounded <= 0) return;
    this.broadcast("damageNumber", {
      x,
      y,
      amount: rounded,
      crit: opts?.crit ?? false,
      poison: opts?.poison ?? false,
    });
  }

  private damageDemonAt(
    demon: Demon,
    amount: number,
    opts?: { crit?: boolean; poison?: boolean },
  ): number {
    const prev = demon.currentQi;
    demon.currentQi = damageDemon(demon.currentQi, amount);
    const dealt = prev - demon.currentQi;
    if (dealt > 0) {
      this.emitDamageNumber(demon.x, demon.y, dealt, {
        crit: opts?.crit,
        poison: opts?.poison,
      });
    }
    return dealt;
  }

  private herbActive(player: Player): boolean {
    return this.nowMs() < player.herbBuffUntil;
  }

  private isStunned(player: Player): boolean {
    return this.nowMs() < player.stunUntil;
  }

  private speedMultiplier(player: Player): number {
    const now = this.nowMs();
    let m = 1;
    if (now < player.slowUntil) m *= 0.5;
    m *= herbSpeedMultiplier(player.daoPath, this.herbActive(player));
    m *= shadowStealthSpeedBonus(
      player.daoPath,
      now - player.lastDamagedAt,
    );
    return m;
  }

  private afterRealmPromote(player: Player) {
    if (shouldAwaitPathChoice(player.realmFloor, player.daoPath)) {
      player.awaitingPathChoice = true;
    }
  }

  private tick() {
    const dt = TICK_RATE_MS / 1000;
    const now = this.nowMs();

    for (const player of this.state.players.values()) {
      if (player.currentQi <= 0) continue;

      player.vassana = tickVassana(
        player.vassana,
        dt,
        isInAnyDemonZone(player.x, player.y),
      );

      if (player.poisonStacks > 0) {
        const tickDmg = poisonDamagePerTick(
          player.poisonStacks,
          herbPoisonTickMultiplier(
            player.daoPath,
            this.herbActive(player),
          ),
        );
        if (tickDmg > 0) {
          const prevQi = player.currentQi;
          player.currentQi = applyDamageToQi(prevQi, tickDmg);
          const dealt = prevQi - player.currentQi;
          if (dealt > 0) {
            this.emitDamageNumber(player.x, player.y, dealt, { poison: true });
          }
          if (player.currentQi <= 0) {
            const sid = [...this.state.players.entries()].find(
              ([, p]) => p === player,
            )?.[0];
            if (sid) this.killPlayer(player, sid, prevQi);
          }
        }
      }

      if (!this.isStunned(player)) {
        const len = Math.hypot(player.inputX, player.inputY);
        if (len > 0.01) {
          const speed =
            moveSpeedForRealm(player.realmFloor) * this.speedMultiplier(player);
          const nx = player.inputX / len;
          const ny = player.inputY / len;
          player.x = clamp(player.x + nx * speed * dt, 0, MAP_WIDTH);
          player.y = clamp(player.y + ny * speed * dt, 0, MAP_HEIGHT);
        }
      }

      this.tryPickupOrbs(player);
      this.tryPickupHerbs(player);
      this.tickFlyingSwords(player, now);
    }

    for (const demon of this.state.demons.values()) {
      if (demon.poisonStacks > 0 && demon.currentQi > 0) {
        this.damageDemonAt(
          demon,
          poisonDamagePerTick(demon.poisonStacks),
          { poison: true },
        );
        if (demon.currentQi <= 0) {
          const demonId = [...this.state.demons.entries()].find(
            ([, d]) => d === demon,
          )?.[0];
          if (demonId) {
            this.killDemon(demon, demonId, undefined);
          }
        }
      }
    }

    this.tickDemons(dt);
  }

  private tickFlyingSwords(player: Player, now: number) {
    if (
      !isCombatKitActive(
        player.realmFloor,
        player.daoPath,
        player.awaitingPathChoice,
      ) ||
      player.daoPath !== "sword"
    ) {
      return;
    }
    const count = flyingSwordCount(player.realmFloor);
    if (count <= 0) return;

    const last = this.lastFlyingSwordMs.get(player.sessionId) ?? 0;
    if (now - last < FLYING_SWORD_INTERVAL_MS) return;
    this.lastFlyingSwordMs.set(player.sessionId, now);

    for (let i = 0; i < count; i++) {
      const target = this.nearestHostile(
        player.x,
        player.y,
        FLYING_SWORD_RANGE,
        player.sessionId,
      );
      if (!target) break;
      if (target.kind === "player") {
        this.dealDamageToPlayer(
          player,
          target.entity as Player,
          target.id,
          FLYING_SWORD_DAMAGE,
          false,
          false,
        );
      } else {
        const demon = target.entity as Demon;
        this.damageDemonAt(demon, FLYING_SWORD_DAMAGE);
        if (demon.currentQi <= 0) {
          this.killDemon(demon, target.id, player);
        }
      }
    }
  }

  private nearestHostile(
    x: number,
    y: number,
    range: number,
    excludeSessionId?: string,
  ):
    | { kind: "player"; id: string; entity: Player }
    | { kind: "demon"; id: string; entity: Demon }
    | undefined {
    let best:
      | { kind: "player"; id: string; entity: Player; dist: number }
      | { kind: "demon"; id: string; entity: Demon; dist: number }
      | undefined;

    for (const [id, p] of this.state.players) {
      if (id === excludeSessionId || p.currentQi <= 0) continue;
      const d = distPoint(x, y, p.x, p.y);
      if (d <= range && (!best || d < best.dist)) {
        best = { kind: "player", id, entity: p, dist: d };
      }
    }
    for (const [id, d] of this.state.demons) {
      if (d.currentQi <= 0) continue;
      const dist = distPoint(x, y, d.x, d.y);
      if (dist <= range && (!best || dist < best.dist)) {
        best = { kind: "demon", id, entity: d, dist };
      }
    }
    if (!best) return undefined;
    if (best.kind === "player") {
      return { kind: "player", id: best.id, entity: best.entity };
    }
    return { kind: "demon", id: best.id, entity: best.entity };
  }

  private handlePlayerAttack(
    sessionId: string,
    aimX: number,
    aimY: number,
  ) {
    const attacker = this.state.players.get(sessionId);
    if (!attacker || attacker.currentQi <= 0) return;
    if (
      !isCombatKitActive(
        attacker.realmFloor,
        attacker.daoPath,
        attacker.awaitingPathChoice,
      )
    ) {
      return;
    }
    if (this.isStunned(attacker)) return;

    const now = this.nowMs();
    const last = this.lastAttackMs.get(sessionId) ?? 0;
    if (now - last < BASIC_ATTACK_COOLDOWN_MS) return;
    this.lastAttackMs.set(sessionId, now);

    const aimAngle = Math.atan2(aimY - attacker.y, aimX - attacker.x);
    const range = basicAttackRange(attacker.daoPath);
    const damage = resolveBasicDamage(attacker.daoPath, false);

    if (attacker.daoPath === "body") {
      this.hitPlayersInMelee(attacker, sessionId, range, damage, true);
      this.hitDemonsInMelee(attacker, range, damage, true);
    } else {
      const arc = basicAttackArcWidth(attacker.daoPath);
      this.hitPlayersInArc(
        attacker,
        sessionId,
        aimAngle,
        range,
        damage,
        true,
        false,
        arc,
      );
      this.hitDemonsInArc(
        attacker,
        aimAngle,
        range,
        damage,
        true,
        false,
        arc,
      );
    }
  }

  private handlePlayerSkill(sessionId: string, aimX: number, aimY: number) {
    const attacker = this.state.players.get(sessionId);
    if (!attacker || attacker.currentQi <= 0) return;
    if (
      !isCombatKitActive(
        attacker.realmFloor,
        attacker.daoPath,
        attacker.awaitingPathChoice,
      )
    ) {
      return;
    }
    if (this.isStunned(attacker)) return;

    const now = this.nowMs();
    const last = this.lastSkillMs.get(sessionId) ?? 0;
    if (now - last < ACTIVE_SKILL_COOLDOWN_MS) return;
    this.lastSkillMs.set(sessionId, now);

    let crit = false;
    if (attacker.daoPath === "lightning") {
      const ol = overloadOnSkillUse(attacker.overloadStacks);
      attacker.overloadStacks = ol.stacks;
      crit = ol.crit;
    }

    switch (attacker.daoPath) {
      case "sword":
        this.skillSwordDash(attacker, aimX, aimY, crit);
        break;
      case "body": {
        attacker.shieldUntil = now + SHIELD_DURATION_MS;
        const pulse = resolveActiveDamage("body", false);
        const pulseR = 105;
        this.hitPlayersInMelee(attacker, sessionId, pulseR, pulse, false);
        this.hitDemonsInMelee(attacker, pulseR, pulse, false);
        break;
      }
      case "lightning":
        this.skillLightningAoE(attacker, aimX, aimY, crit);
        break;
      case "shadow":
        this.skillShadowWarp(attacker, aimX, aimY, crit);
        break;
      default:
        break;
    }
  }

  private skillSwordDash(
    attacker: Player,
    aimX: number,
    aimY: number,
    crit: boolean,
  ) {
    const { x: nx, y: ny } = resolveFacingUnitVector(
      attacker.inputX,
      attacker.inputY,
      attacker.x,
      attacker.y,
      aimX,
      aimY,
    );
    const startX = attacker.x;
    const startY = attacker.y;
    attacker.x = clamp(
      attacker.x + nx * DASH_DISTANCE,
      0,
      MAP_WIDTH,
    );
    attacker.y = clamp(
      attacker.y + ny * DASH_DISTANCE,
      0,
      MAP_HEIGHT,
    );
    const damage = resolveActiveDamage("sword", crit);
    for (const [id, target] of this.state.players) {
      if (target === attacker || target.currentQi <= 0) continue;
      if (this.pointNearSegment(target.x, target.y, startX, startY, attacker.x, attacker.y, 48)) {
        this.dealDamageToPlayer(attacker, target, id, damage, false, crit);
      }
    }
    for (const [demonId, demon] of this.state.demons) {
      if (demon.currentQi <= 0) continue;
      if (
        this.pointNearSegment(
          demon.x,
          demon.y,
          startX,
          startY,
          attacker.x,
          attacker.y,
          48,
        )
      ) {
        this.damageDemonAt(demon, damage, { crit });
        if (demon.currentQi <= 0) this.killDemon(demon, demonId, attacker);
      }
    }
  }

  private pointNearSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    radius: number,
  ): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 1) return distPoint(px, py, x1, y1) <= radius;
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = clamp(t, 0, 1);
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    return distPoint(px, py, cx, cy) <= radius;
  }

  private skillLightningAoE(
    attacker: Player,
    aimX: number,
    aimY: number,
    crit: boolean,
  ) {
    const radius =
      LIGHTNING_AOE_RADIUS +
      herbAoeRadiusBonus(attacker.daoPath, this.herbActive(attacker));
    const damage = resolveActiveDamage("lightning", crit);
    const stunUntil = this.nowMs() + STUN_MS;

    for (const [id, target] of this.state.players) {
      if (target === attacker || target.currentQi <= 0) continue;
      if (distPoint(aimX, aimY, target.x, target.y) <= radius) {
        this.dealDamageToPlayer(attacker, target, id, damage, false, crit);
        if (!isBodyStunImmune(target.daoPath, target.currentQi, maxQiForRealm(target.realmFloor))) {
          target.stunUntil = Math.max(target.stunUntil, stunUntil);
        }
      }
    }
    for (const [demonId, demon] of this.state.demons) {
      if (demon.currentQi <= 0) continue;
      if (distPoint(aimX, aimY, demon.x, demon.y) <= radius) {
        this.damageDemonAt(demon, damage, { crit });
        if (demon.currentQi <= 0) this.killDemon(demon, demonId, attacker);
      }
    }
  }

  private skillShadowWarp(
    attacker: Player,
    aimX: number,
    aimY: number,
    crit: boolean,
  ) {
    let bestId: string | undefined;
    let bestDist = SHADOW_WARP_RANGE;
    let best: Player | undefined;

    for (const [id, target] of this.state.players) {
      if (target === attacker || target.currentQi <= 0) continue;
      const d = distPoint(attacker.x, attacker.y, target.x, target.y);
      if (d < bestDist) {
        bestDist = d;
        bestId = id;
        best = target;
      }
    }

    const damage = resolveActiveDamage("shadow", crit);
    const slowUntil = this.nowMs() + SLOW_MS;

    if (best && bestId) {
      const angle = Math.atan2(best.y - attacker.y, best.x - attacker.x);
      attacker.x = clamp(
        best.x - Math.cos(angle) * 36,
        0,
        MAP_WIDTH,
      );
      attacker.y = clamp(
        best.y - Math.sin(angle) * 36,
        0,
        MAP_HEIGHT,
      );
      this.dealDamageToPlayer(attacker, best, bestId, damage, false, crit);
      best.slowUntil = Math.max(best.slowUntil, slowUntil);
      return;
    }

    for (const [demonId, demon] of this.state.demons) {
      if (demon.currentQi <= 0) continue;
      const d = distPoint(attacker.x, attacker.y, demon.x, demon.y);
      if (d <= SHADOW_WARP_RANGE) {
        attacker.x = demon.x - 30;
        attacker.y = demon.y;
        this.damageDemonAt(demon, damage, { crit });
        demon.poisonStacks = addPoisonStack(demon.poisonStacks);
        if (demon.currentQi <= 0) this.killDemon(demon, demonId, attacker);
        return;
      }
    }

    const angle = Math.atan2(aimY - attacker.y, aimX - attacker.x);
    attacker.x = clamp(
      attacker.x + Math.cos(angle) * 80,
      0,
      MAP_WIDTH,
    );
    attacker.y = clamp(
      attacker.y + Math.sin(angle) * 80,
      0,
      MAP_HEIGHT,
    );
  }

  private hitPlayersInMelee(
    attacker: Player,
    sessionId: string,
    range: number,
    damage: number,
    applyPathOnHit: boolean,
    crit = false,
  ) {
    for (const [id, target] of this.state.players) {
      if (id === sessionId || target.currentQi <= 0) continue;
      if (
        isBodyMeleeHit(attacker.x, attacker.y, target.x, target.y, range)
      ) {
        this.dealDamageToPlayer(
          attacker,
          target,
          id,
          damage,
          applyPathOnHit,
          crit,
        );
      }
    }
  }

  private hitDemonsInMelee(
    attacker: Player,
    range: number,
    damage: number,
    applyPathOnHit: boolean,
    crit = false,
  ) {
    for (const [demonId, demon] of this.state.demons) {
      if (demon.currentQi <= 0) continue;
      if (isBodyMeleeHit(attacker.x, attacker.y, demon.x, demon.y, range)) {
        if (applyPathOnHit && attacker.daoPath === "shadow") {
          demon.poisonStacks = addPoisonStack(demon.poisonStacks);
        }
        this.damageDemonAt(demon, damage, { crit });
        if (demon.currentQi <= 0) {
          this.killDemon(demon, demonId, attacker);
        }
      }
    }
  }

  private hitPlayersInArc(
    attacker: Player,
    sessionId: string,
    aimAngle: number,
    range: number,
    damage: number,
    applyPathOnHit: boolean,
    crit = false,
    arcWidth?: number,
  ) {
    for (const [id, target] of this.state.players) {
      if (id === sessionId || target.currentQi <= 0) continue;
      if (
        isInAttackArc(
          attacker.x,
          attacker.y,
          aimAngle,
          target.x,
          target.y,
          range,
          arcWidth,
        )
      ) {
        this.dealDamageToPlayer(
          attacker,
          target,
          id,
          damage,
          applyPathOnHit,
          crit,
        );
      }
    }
  }

  private hitDemonsInArc(
    attacker: Player,
    aimAngle: number,
    range: number,
    damage: number,
    applyPathOnHit: boolean,
    crit = false,
    arcWidth?: number,
  ) {
    for (const [demonId, demon] of this.state.demons) {
      if (demon.currentQi <= 0) continue;
      if (
        isInAttackArc(
          attacker.x,
          attacker.y,
          aimAngle,
          demon.x,
          demon.y,
          range,
          arcWidth,
        )
      ) {
        if (applyPathOnHit && attacker.daoPath === "shadow") {
          demon.poisonStacks = addPoisonStack(demon.poisonStacks);
        }
        this.damageDemonAt(demon, damage, { crit });
        if (demon.currentQi <= 0) {
          this.killDemon(demon, demonId, attacker);
        }
      }
    }
  }

  private dealDamageToPlayer(
    attacker: Player,
    target: Player,
    targetId: string,
    rawDamage: number,
    applyPathOnHit: boolean,
    crit = false,
  ) {
    const now = this.nowMs();
    let damage = rawDamage;

    if (applyPathOnHit && attacker.daoPath === "shadow") {
      target.poisonStacks = addPoisonStack(target.poisonStacks);
    }
    if (applyPathOnHit && attacker.daoPath === "body") {
      const angle = Math.atan2(target.y - attacker.y, target.x - attacker.x);
      target.x = clamp(target.x + Math.cos(angle) * 28, 0, MAP_WIDTH);
      target.y = clamp(target.y + Math.sin(angle) * 28, 0, MAP_HEIGHT);
    }

    damage *= herbDamageTakenMultiplier(
      target.daoPath,
      this.herbActive(target),
    );
    damage = applyIronSkinDamage(damage, target.daoPath);

    if (now < target.shieldUntil) {
      const reflected = rawDamage * 0.5;
      damage *= 0.5;
      if (attacker.currentQi > 0 && attacker !== target) {
        const atkPrev = attacker.currentQi;
        attacker.currentQi = applyDamageToQi(attacker.currentQi, reflected);
        const reflDealt = atkPrev - attacker.currentQi;
        if (reflDealt > 0) {
          this.emitDamageNumber(attacker.x, attacker.y, reflDealt);
        }
      }
    }

    const prevQi = target.currentQi;
    target.currentQi = applyDamageToQi(prevQi, damage);
    target.lastDamagedAt = now;
    const dealt = prevQi - target.currentQi;
    if (dealt > 0) {
      this.emitDamageNumber(target.x, target.y, dealt, { crit });
    }

    if (target.currentQi <= 0) {
      this.killPlayer(target, targetId, prevQi);
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
    player.poisonStacks = 0;
    player.overloadStacks = 0;
    player.stunUntil = 0;
    player.slowUntil = 0;
    player.shieldUntil = 0;
    this.broadcast("playerDeath", { sessionId, name: player.name });
  }

  private killDemon(demon: Demon, demonId: string, killer: Player | undefined) {
    const kind = demon.kind as DemonKind;
    const stats = DEMON_STATS[kind] ?? DEMON_STATS.wild;
    this.spawnOrbAt(demon.x, demon.y, stats.orbDrop);
    if (killer) {
      killer.vassana = addVassanaOnDemonKill(killer.vassana);
    }
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
          const now = this.nowMs();
          const last = this.lastDemonAttackMs.get(demon.id) ?? 0;
          if (now - last >= 600) {
            this.lastDemonAttackMs.set(demon.id, now);
            const sid = [...this.state.players.entries()].find(
              ([, p]) => p === nearestPlayer,
            )?.[0];
            if (sid && nearestPlayer) {
              const prevQi = nearestPlayer.currentQi;
              let dmg = stats.damage;
              dmg *= herbDamageTakenMultiplier(
                nearestPlayer.daoPath,
                this.herbActive(nearestPlayer),
              );
              dmg = applyIronSkinDamage(dmg, nearestPlayer.daoPath);
              nearestPlayer.currentQi = applyDamageToQi(prevQi, dmg);
              nearestPlayer.lastDamagedAt = now;
              const dealt = prevQi - nearestPlayer.currentQi;
              if (dealt > 0) {
                this.emitDamageNumber(nearestPlayer.x, nearestPlayer.y, dealt);
              }
              if (nearestPlayer.currentQi <= 0) {
                this.killPlayer(nearestPlayer, sid, prevQi);
              }
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
    demon.poisonStacks = 0;
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
        const prevFloor = player.realmFloor;
        player.currentQi = applyOrbPickup(player.currentQi, gained, maxQi);
        player.realmFloor = promoteRealmFloor(
          player.currentQi,
          player.realmFloor,
        );
        if (player.realmFloor > prevFloor) {
          this.afterRealmPromote(player);
        }
        toRemove.push(id);
      }
    }
    for (const id of toRemove) {
      this.state.orbs.delete(id);
    }
  }

  private tryPickupHerbs(player: Player) {
    const toRemove: string[] = [];
    for (const [id, herb] of this.state.herbs) {
      const dist = Math.hypot(herb.x - player.x, herb.y - player.y);
      if (dist <= HERB_PICKUP_RADIUS) {
        const maxQi = maxQiForRealm(player.realmFloor);
        const prevFloor = player.realmFloor;
        player.currentQi = applyOrbPickup(
          player.currentQi,
          HERB_QI_BONUS,
          maxQi,
        );
        player.realmFloor = promoteRealmFloor(
          player.currentQi,
          player.realmFloor,
        );
        if (player.realmFloor > prevFloor) {
          this.afterRealmPromote(player);
        }
        player.herbBuffUntil = this.nowMs() + HERB_BUFF_MS;
        toRemove.push(id);
      }
    }
    for (const id of toRemove) {
      this.state.herbs.delete(id);
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

  private spawnHerbs(count: number) {
    for (let i = 0; i < count; i++) {
      this.addHerb();
    }
  }

  private addHerb() {
    const pos = randomPosition();
    const herb = new Herb();
    herb.id = `h${++herbCounter}`;
    herb.x = pos.x;
    herb.y = pos.y;
    this.state.herbs.set(herb.id, herb);
  }

  private maintainHerbs() {
    while (this.state.herbs.size < HERB_TARGET_COUNT) {
      this.addHerb();
    }
  }
}
