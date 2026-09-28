import { Room, Client } from "@colyseus/core";
import {
  ACTIVE_SKILL_COOLDOWN_MS,
  addPoisonStack,
  BODY_SHIELD_END_SHOCKWAVE_DAMAGE,
  BODY_SHIELD_END_SHOCKWAVE_RADIUS,
  BODY_SHIELD_PULSE_RADIUS,
  applyDamageToQi,
  BASIC_ATTACK_COOLDOWN_MS,
  applySkillPick,
  arcWidthForSkillClass,
  basicArcWidthForLoadout,
  getSkillById,
  getSkillPoolForRealm,
  hasFlyingBladePassive,
  hasOverloadPassive,
  hasStealthPassive,
  ownedUsesMeleeBasic,
  parseSkillIds,
  formatSkillIds,
  passiveDamageTakenMultiplier,
  qiDamageFromSkill,
  rangeForSkillClass,
  pickRandomDraftOffer,
  rollSkillDraft,
  SKILL_DRAFT_CELEBRATE_MS,
  SKILL_DRAFT_PICK_TIMEOUT_MS,
  resolveBasicAttackDamage,
  resolveBasicAttackRange,
  skillAppliesPoisonOnHit,
  validateSkillPick,
  playerIgnoresIncomingDamage,
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
  herbPickupRadiusForCultivation,
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
  LIGHTNING_AOE_RADIUS,
  MAP_HEIGHT,
  MAP_WIDTH,
  MAX_PLAYERS,
  moveSpeedForRealm,
  ORB_VALUE,
  orbPickupRadiusForCultivation,
  ORB_SPAWN_INTERVAL_MS,
  ORB_TARGET_COUNT,
  overloadOnSkillUse,
  poisonDamagePerTick,
  poisonDecayStateOnRefresh,
  applyQiGainWithCultivation,
  tickPoisonDecayState,
  type PoisonDecayState,
  qiToOrbValues,
  randomPointInZone,
  RUN_SUMMARY_MESSAGE,
  resolveFacingUnitVector,
  type RunSummaryPayload,
  rollOrbWithVassana,
  SHADOW_WARP_RANGE,
  SHIELD_DURATION_MS,
  SLOW_MS,
  STUN_MS,
  shadowStealthSpeedBonus,
  addVassanaOnDemonKill,
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
  private poisonDecayByKey = new Map<string, PoisonDecayState>();
  private bodyShieldShockwaveAt = new Map<string, number>();
  private skillDraftCelebrateTimer = new Map<
    string,
    { clear: () => void }
  >();
  private runMeta = new Map<
    string,
    { runStartedAtMs: number; peakCurrentQi: number }
  >();
  private endingRun = new Set<string>();

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

    this.onMessage(
      "pickSkillDraft",
      (client, data: { skillId?: string }) => {
        const ok = this.handlePickSkillDraft(
          client.sessionId,
          String(data.skillId ?? ""),
        );
        if (ok) {
          client.send("skillDraftComplete", {
            skillId: String(data.skillId ?? ""),
            autoPick: false,
          });
        } else {
          client.send("skillDraftRejected", {
            reason: "invalid_pick",
          });
        }
      },
    );

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
    player.qiLayer = 1;
    player.vassana = 0;
    player.ownedSkillIds = "";
    player.awaitingSkillDraft = false;
    player.draftOfferIds = "";
    player.draftDeadlineMs = 0;
    player.lastActiveSkillId = "";
    player.poisonStacks = 0;
    player.overloadStacks = 0;
    player.stunUntil = 0;
    player.slowUntil = 0;
    player.shieldUntil = 0;
    player.herbBuffUntil = 0;
    player.lastDamagedAt = 0;
    this.state.players.set(client.sessionId, player);
    this.runMeta.set(client.sessionId, {
      runStartedAtMs: Date.now(),
      peakCurrentQi: player.currentQi,
    });
    this.endingRun.delete(client.sessionId);
  }

  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      this.clearPoisonPlayer(client.sessionId, player);
    }
    this.clearPlayerSessionMaps(client.sessionId);
    this.state.players.delete(client.sessionId);
  }

  private recordPeakQi(sessionId: string, qi: number) {
    const meta = this.runMeta.get(sessionId);
    if (!meta) return;
    if (qi > meta.peakCurrentQi) {
      meta.peakCurrentQi = qi;
    }
  }

  private clearPlayerSessionMaps(sessionId: string) {
    this.clearSkillDraftCelebrateTimer(sessionId);
    this.lastAttackMs.delete(sessionId);
    this.lastSkillMs.delete(sessionId);
    this.lastFlyingSwordMs.delete(sessionId);
    this.bodyShieldShockwaveAt.delete(sessionId);
    this.poisonDecayByKey.delete(this.poisonKeyPlayer(sessionId));
    this.runMeta.delete(sessionId);
    this.endingRun.delete(sessionId);
  }

  private playersCanFight(_a: Player, _b: Player): boolean {
    return true;
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

  private ownedSkills(player: Player): string[] {
    return parseSkillIds(player.ownedSkillIds);
  }

  private speedMultiplier(player: Player): number {
    const now = this.nowMs();
    let m = 1;
    if (now < player.slowUntil) m *= 0.5;
    m *= herbSpeedMultiplier(this.herbActive(player));
    m *= shadowStealthSpeedBonus(
      hasStealthPassive(this.ownedSkills(player)),
      now - player.lastDamagedAt,
    );
    return m;
  }

  private clearSkillDraftCelebrateTimer(sessionId: string) {
    const timer = this.skillDraftCelebrateTimer.get(sessionId);
    timer?.clear();
    this.skillDraftCelebrateTimer.delete(sessionId);
  }

  private afterRealmPromote(player: Player, sessionId: string) {
    if (player.awaitingSkillDraft) return;
    const pool = getSkillPoolForRealm(player.realmFloor).map((s) => s.id);
    const offers = rollSkillDraft(pool, this.ownedSkills(player), Math.random);
    if (offers.length === 0) {
      player.awaitingSkillDraft = false;
      player.draftOfferIds = "";
      player.draftDeadlineMs = 0;
      return;
    }
    player.awaitingSkillDraft = true;
    player.draftOfferIds = formatSkillIds(offers);
    player.draftDeadlineMs = 0;
    this.clearSkillDraftCelebrateTimer(sessionId);
    const client = this.clients.find((c) => c.sessionId === sessionId);
    client?.send("skillDraftCelebrate", {
      offerIds: offers,
      realmFloor: player.realmFloor,
      qiLayer: player.qiLayer,
      celebrateMs: SKILL_DRAFT_CELEBRATE_MS,
    });
    const delayed = this.clock.setTimeout(() => {
      this.skillDraftCelebrateTimer.delete(sessionId);
      this.openSkillDraftPickUi(sessionId);
    }, SKILL_DRAFT_CELEBRATE_MS);
    this.skillDraftCelebrateTimer.set(sessionId, delayed);
  }

  private openSkillDraftPickUi(sessionId: string) {
    const player = this.state.players.get(sessionId);
    if (!player?.awaitingSkillDraft) return;
    const offers = parseSkillIds(player.draftOfferIds);
    if (offers.length === 0) return;
    const deadlineMs = Date.now() + SKILL_DRAFT_PICK_TIMEOUT_MS;
    player.draftDeadlineMs = deadlineMs;
    const client = this.clients.find((c) => c.sessionId === sessionId);
    client?.send("skillDraftOpen", {
      offerIds: offers,
      realmFloor: player.realmFloor,
      qiLayer: player.qiLayer,
      deadlineMs,
    });
  }

  private autoPickSkillDraft(sessionId: string): void {
    const player = this.state.players.get(sessionId);
    if (!player?.awaitingSkillDraft) {
      return;
    }
    player.draftDeadlineMs = 0;
    const offers = parseSkillIds(player.draftOfferIds);
    const skillId = pickRandomDraftOffer(offers, Math.random);
    if (!skillId) {
      player.awaitingSkillDraft = false;
      player.draftOfferIds = "";
      return;
    }
    const ok = this.handlePickSkillDraft(sessionId, skillId);
    if (!ok) return;
    const client = this.clients.find((c) => c.sessionId === sessionId);
    client?.send("skillDraftComplete", {
      skillId,
      autoPick: true,
    });
  }

  private tickSkillDraftTimeouts() {
    const now = Date.now();
    for (const [sessionId, player] of this.state.players) {
      if (!player.awaitingSkillDraft) continue;
      const deadline = player.draftDeadlineMs;
      if (deadline <= 0 || now < deadline) continue;
      this.autoPickSkillDraft(sessionId);
    }
  }

  private handlePickSkillDraft(sessionId: string, skillId: string): boolean {
    const player = this.state.players.get(sessionId);
    if (!player || !player.awaitingSkillDraft) return false;
    const offers = parseSkillIds(player.draftOfferIds);
    if (!validateSkillPick(skillId, offers)) return false;
    const def = getSkillById(skillId);
    if (!def) return false;
    const result = applySkillPick({
      ownedSkillIds: this.ownedSkills(player),
      draftOfferIds: offers,
      lastActiveSkillId: player.lastActiveSkillId,
      skillId,
      skillKind: def.kind,
    });
    player.ownedSkillIds = formatSkillIds(result.ownedSkillIds);
    player.draftOfferIds = formatSkillIds(result.draftOfferIds);
    player.awaitingSkillDraft = result.awaitingSkillDraft;
    player.lastActiveSkillId = result.lastActiveSkillId;
    player.draftDeadlineMs = 0;
    this.clearSkillDraftCelebrateTimer(sessionId);
    return true;
  }

  private tick() {
    const dt = TICK_RATE_MS / 1000;
    const now = this.nowMs();
    this.tickSkillDraftTimeouts();

    for (const [sessionId, player] of this.state.players) {
      if (player.currentQi <= 0) {
        this.endPlayerRun(sessionId, player, 0);
        continue;
      }

      player.vassana = tickVassana(
        player.vassana,
        dt,
        isInAnyDemonZone(player.x, player.y),
      );

      this.tickPoisonDecayForPlayer(sessionId, player, now);
      this.tryBodyShieldShockwave(sessionId, player, now);

      if (
        player.poisonStacks > 0 &&
        !playerIgnoresIncomingDamage(player.awaitingSkillDraft)
      ) {
        const tickDmg = poisonDamagePerTick(
          player.poisonStacks,
          herbPoisonTickMultiplier(this.herbActive(player)),
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
            if (sid) {
              this.handlePlayerEliminated(player, sid, prevQi, undefined);
            }
          }
        }
      }

      if (!player.awaitingSkillDraft && !this.isStunned(player)) {
        const len = Math.hypot(player.inputX, player.inputY);
        if (len > 0.01) {
          const speed =
            moveSpeedForRealm(player.realmFloor, player.qiLayer) *
              this.speedMultiplier(player);
          const nx = player.inputX / len;
          const ny = player.inputY / len;
          player.x = clamp(player.x + nx * speed * dt, 0, MAP_WIDTH);
          player.y = clamp(player.y + ny * speed * dt, 0, MAP_HEIGHT);
        }
      }

      if (!player.awaitingSkillDraft) {
        this.tryPickupOrbs(sessionId, player);
        this.tryPickupHerbs(sessionId, player);
        this.tickFlyingSwords(player, now);
      }
    }

    for (const [demonId, demon] of this.state.demons) {
      this.tickPoisonDecayForDemon(demonId, demon, now);

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
    const owned = this.ownedSkills(player);
    if (
      !isCombatKitActive(player.awaitingSkillDraft) ||
      !hasFlyingBladePassive(owned)
    ) {
      return;
    }
    const count = flyingSwordCount(player.realmFloor, player.qiLayer);
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
        const foe = target.entity as Player;
        if (this.playersCanFight(player, foe)) {
          this.dealDamageToPlayer(
            player,
            foe,
            target.id,
            FLYING_SWORD_DAMAGE,
            false,
            false,
          );
        }
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
      if (id === excludeSessionId || p.currentQi <= 0) {
        continue;
      }
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
    if (!isCombatKitActive(attacker.awaitingSkillDraft)) {
      return;
    }
    if (this.isStunned(attacker)) return;

    const now = this.nowMs();
    const last = this.lastAttackMs.get(sessionId) ?? 0;
    if (now - last < BASIC_ATTACK_COOLDOWN_MS) return;
    this.lastAttackMs.set(sessionId, now);
    attacker.inputX = 0;
    attacker.inputY = 0;

    const owned = this.ownedSkills(attacker);
    const aimAngle = Math.atan2(aimY - attacker.y, aimX - attacker.x);
    const range = resolveBasicAttackRange(owned);
    const damage = resolveBasicAttackDamage(owned);

    if (ownedUsesMeleeBasic(owned)) {
      this.hitPlayersInMelee(attacker, sessionId, range, damage, true);
      this.hitDemonsInMelee(attacker, range, damage, true);
    } else {
      const arc = basicArcWidthForLoadout(owned);
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
    if (!isCombatKitActive(attacker.awaitingSkillDraft)) {
      return;
    }
    if (this.isStunned(attacker)) return;

    const skillId = attacker.lastActiveSkillId;
    const skill = skillId ? getSkillById(skillId) : undefined;
    if (!skill || (skill.kind !== "active" && skill.kind !== "hybrid")) {
      return;
    }

    const now = this.nowMs();
    const cd = skill.cooldownMs ?? ACTIVE_SKILL_COOLDOWN_MS;
    const last = this.lastSkillMs.get(sessionId) ?? 0;
    if (now - last < cd) return;
    this.lastSkillMs.set(sessionId, now);
    attacker.inputX = 0;
    attacker.inputY = 0;

    let crit = false;
    if (hasOverloadPassive(this.ownedSkills(attacker))) {
      const ol = overloadOnSkillUse(attacker.overloadStacks);
      attacker.overloadStacks = ol.stacks;
      crit = ol.crit;
    }

    const damage = qiDamageFromSkill(skill, attacker.realmFloor, crit);
    this.executeActiveSkill(
      sessionId,
      attacker,
      skill,
      aimX,
      aimY,
      damage,
      crit,
      now,
    );
  }

  private executeActiveSkill(
    sessionId: string,
    attacker: Player,
    skill: NonNullable<ReturnType<typeof getSkillById>>,
    aimX: number,
    aimY: number,
    damage: number,
    crit: boolean,
    now: number,
  ) {
    const rc = skill.rangeClass;
    const aimAngle = Math.atan2(aimY - attacker.y, aimX - attacker.x);

    switch (rc) {
      case "dash":
        this.skillSwordDash(attacker, aimX, aimY, crit, damage);
        break;
      case "self":
      case "circle": {
        if (rc === "self" || skill.nameTh.includes("โล่")) {
          attacker.shieldUntil = now + SHIELD_DURATION_MS;
          this.bodyShieldShockwaveAt.set(
            sessionId,
            now + SHIELD_DURATION_MS,
          );
        }
        const radius = rangeForSkillClass(rc);
        this.hitPlayersInMelee(attacker, sessionId, radius, damage, true, crit);
        this.hitDemonsInMelee(attacker, radius, damage, true, crit);
        break;
      }
      case "global":
      case "line":
      case "cone":
      case "single": {
        const range = rangeForSkillClass(rc);
        const arc = arcWidthForSkillClass(rc);
        this.hitPlayersInArc(
          attacker,
          sessionId,
          aimAngle,
          range,
          damage,
          true,
          crit,
          arc,
        );
        this.hitDemonsInArc(
          attacker,
          aimAngle,
          range,
          damage,
          true,
          crit,
          arc,
        );
        break;
      }
      default:
        this.skillShadowWarp(attacker, aimX, aimY, crit, damage);
        break;
    }

    if (skill.ccType === "stun") {
      const stunUntil = now + STUN_MS;
      for (const [, target] of this.state.players) {
        if (target === attacker || target.currentQi <= 0) continue;
        if (distPoint(attacker.x, attacker.y, target.x, target.y) <= 100) {
          target.stunUntil = Math.max(target.stunUntil, stunUntil);
        }
      }
    }
    if (skill.ccType === "slow") {
      const slowUntil = now + SLOW_MS;
      for (const [, target] of this.state.players) {
        if (target === attacker || target.currentQi <= 0) continue;
        if (distPoint(attacker.x, attacker.y, target.x, target.y) <= 120) {
          target.slowUntil = Math.max(target.slowUntil, slowUntil);
        }
      }
    }
  }

  private skillSwordDash(
    attacker: Player,
    aimX: number,
    aimY: number,
    crit: boolean,
    damage: number,
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
    for (const [id, target] of this.state.players) {
      if (target === attacker || target.currentQi <= 0) continue;
      if (!this.playersCanFight(attacker, target)) continue;
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
    damage: number,
  ) {
    const radius =
      LIGHTNING_AOE_RADIUS +
      herbAoeRadiusBonus(this.herbActive(attacker));
    const stunUntil = this.nowMs() + STUN_MS;

    for (const [id, target] of this.state.players) {
      if (target === attacker || target.currentQi <= 0) continue;
      if (!this.playersCanFight(attacker, target)) continue;
      if (distPoint(aimX, aimY, target.x, target.y) <= radius) {
        this.dealDamageToPlayer(attacker, target, id, damage, false, crit);
        if (
          !isBodyStunImmune(
            ownedUsesMeleeBasic(this.ownedSkills(target)),
            target.currentQi,
            maxQiForRealm(target.realmFloor, target.qiLayer),
          )
        ) {
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
    damage: number,
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

    const slowUntil = this.nowMs() + SLOW_MS;

    if (best && bestId && this.playersCanFight(attacker, best)) {
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
        this.applyPoisonToDemon(demonId, demon);
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
      if (!this.playersCanFight(attacker, target)) continue;
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
        if (
          applyPathOnHit &&
          skillAppliesPoisonOnHit(attacker.lastActiveSkillId)
        ) {
          this.applyPoisonToDemon(demonId, demon);
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
      if (!this.playersCanFight(attacker, target)) continue;
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
        if (
          applyPathOnHit &&
          skillAppliesPoisonOnHit(attacker.lastActiveSkillId)
        ) {
          this.applyPoisonToDemon(demonId, demon);
        }
        this.damageDemonAt(demon, damage, { crit });
        if (demon.currentQi <= 0) {
          this.killDemon(demon, demonId, attacker);
        }
      }
    }
  }

  private poisonKeyPlayer(sessionId: string): string {
    return `p:${sessionId}`;
  }

  private poisonKeyDemon(demonId: string): string {
    return `d:${demonId}`;
  }

  private applyPoisonToPlayer(
    sessionId: string,
    player: Player,
    now = this.nowMs(),
  ) {
    player.poisonStacks = addPoisonStack(player.poisonStacks);
    this.poisonDecayByKey.set(
      this.poisonKeyPlayer(sessionId),
      poisonDecayStateOnRefresh(now),
    );
  }

  private applyPoisonToDemon(demonId: string, demon: Demon) {
    const now = this.nowMs();
    demon.poisonStacks = addPoisonStack(demon.poisonStacks);
    this.poisonDecayByKey.set(
      this.poisonKeyDemon(demonId),
      poisonDecayStateOnRefresh(now),
    );
  }

  private clearPoisonPlayer(sessionId: string, player: Player) {
    player.poisonStacks = 0;
    this.poisonDecayByKey.delete(this.poisonKeyPlayer(sessionId));
  }

  private tickPoisonDecayForPlayer(
    sessionId: string,
    player: Player,
    now: number,
  ) {
    if (player.poisonStacks <= 0) return;
    const key = this.poisonKeyPlayer(sessionId);
    const state = this.poisonDecayByKey.get(key);
    const next = tickPoisonDecayState(player.poisonStacks, state, now);
    player.poisonStacks = next.stacks;
    if (next.state) {
      this.poisonDecayByKey.set(key, next.state);
    } else {
      this.poisonDecayByKey.delete(key);
    }
  }

  private tickPoisonDecayForDemon(demonId: string, demon: Demon, now: number) {
    if (demon.poisonStacks <= 0) return;
    const key = this.poisonKeyDemon(demonId);
    const state = this.poisonDecayByKey.get(key);
    const next = tickPoisonDecayState(demon.poisonStacks, state, now);
    demon.poisonStacks = next.stacks;
    if (next.state) {
      this.poisonDecayByKey.set(key, next.state);
    } else {
      this.poisonDecayByKey.delete(key);
    }
  }

  private tryBodyShieldShockwave(
    sessionId: string,
    player: Player,
    now: number,
  ) {
    const at = this.bodyShieldShockwaveAt.get(sessionId);
    if (at === undefined || now < at) return;
    this.bodyShieldShockwaveAt.delete(sessionId);
    if (player.currentQi <= 0) return;
    this.hitPlayersInMelee(
      player,
      sessionId,
      BODY_SHIELD_END_SHOCKWAVE_RADIUS,
      BODY_SHIELD_END_SHOCKWAVE_DAMAGE,
      false,
    );
    this.hitDemonsInMelee(
      player,
      BODY_SHIELD_END_SHOCKWAVE_RADIUS,
      BODY_SHIELD_END_SHOCKWAVE_DAMAGE,
      false,
    );
  }

  private dealDamageToPlayer(
    attacker: Player,
    target: Player,
    targetId: string,
    rawDamage: number,
    applyPathOnHit: boolean,
    crit = false,
  ) {
    if (playerIgnoresIncomingDamage(target.awaitingSkillDraft)) {
      return;
    }
    const now = this.nowMs();
    let damage = rawDamage;

    if (
      applyPathOnHit &&
      skillAppliesPoisonOnHit(attacker.lastActiveSkillId)
    ) {
      this.applyPoisonToPlayer(targetId, target, now);
    }
    if (applyPathOnHit && ownedUsesMeleeBasic(this.ownedSkills(attacker))) {
      const angle = Math.atan2(target.y - attacker.y, target.x - attacker.x);
      target.x = clamp(target.x + Math.cos(angle) * 28, 0, MAP_WIDTH);
      target.y = clamp(target.y + Math.sin(angle) * 28, 0, MAP_HEIGHT);
    }

    damage *= herbDamageTakenMultiplier(this.herbActive(target));
    damage *= passiveDamageTakenMultiplier(this.ownedSkills(target));

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
      this.handlePlayerEliminated(target, targetId, prevQi, attacker);
    }
  }

  private handlePlayerEliminated(
    player: Player,
    sessionId: string,
    qiBeforeDeath: number,
    _killer: Player | undefined,
  ) {
    this.endPlayerRun(sessionId, player, qiBeforeDeath);
  }

  private endPlayerRun(
    sessionId: string,
    player: Player,
    qiBeforeDeath: number,
  ) {
    if (this.endingRun.has(sessionId)) return;
    if (!this.state.players.has(sessionId)) return;
    this.endingRun.add(sessionId);

    player.awaitingSkillDraft = false;
    player.draftOfferIds = "";
    player.draftDeadlineMs = 0;
    this.clearSkillDraftCelebrateTimer(sessionId);

    const drop = qiToOrbValues(qiBeforeDeath);
    for (const value of drop) {
      this.spawnOrbAt(player.x, player.y, value);
    }

    const meta = this.runMeta.get(sessionId);
    const runStartedAtMs = meta?.runStartedAtMs ?? Date.now();
    const peakCurrentQi = Math.max(
      meta?.peakCurrentQi ?? 0,
      qiBeforeDeath,
    );
    const survivalSec = Math.floor((Date.now() - runStartedAtMs) / 1000);

    const payload: RunSummaryPayload = {
      name: player.name,
      realmFloor: player.realmFloor,
      qiLayer: player.qiLayer,
      vassana: player.vassana,
      ownedSkillIds: player.ownedSkillIds,
      peakCurrentQi,
      survivalSec,
    };

    const client = this.clients.find((c) => c.sessionId === sessionId);
    client?.send(RUN_SUMMARY_MESSAGE, payload);

    const playerName = player.name;
    this.clearPoisonPlayer(sessionId, player);
    this.broadcast("playerDeath", { sessionId, name: playerName });
    this.clearPlayerSessionMaps(sessionId);
    this.state.players.delete(sessionId);
  }

  private killDemon(demon: Demon, demonId: string, killer: Player | undefined) {
    const kind = demon.kind as DemonKind;
    const stats = DEMON_STATS[kind] ?? DEMON_STATS.wild;
    this.spawnOrbAt(demon.x, demon.y, stats.orbDrop);
    if (killer) {
      killer.vassana = addVassanaOnDemonKill(killer.vassana);
    }
    this.poisonDecayByKey.delete(this.poisonKeyDemon(demonId));
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
            if (
              sid &&
              nearestPlayer &&
              !playerIgnoresIncomingDamage(nearestPlayer.awaitingSkillDraft)
            ) {
              const prevQi = nearestPlayer.currentQi;
              let dmg = stats.damage;
              dmg *= herbDamageTakenMultiplier(this.herbActive(nearestPlayer));
              dmg *= passiveDamageTakenMultiplier(
                this.ownedSkills(nearestPlayer),
              );
              nearestPlayer.currentQi = applyDamageToQi(prevQi, dmg);
              nearestPlayer.lastDamagedAt = now;
              const dealt = prevQi - nearestPlayer.currentQi;
              if (dealt > 0) {
                this.emitDamageNumber(nearestPlayer.x, nearestPlayer.y, dealt);
              }
              if (nearestPlayer.currentQi <= 0) {
                this.endPlayerRun(sid, nearestPlayer, prevQi);
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

  private tryPickupOrbs(sessionId: string, player: Player) {
    if (player.awaitingSkillDraft) return;
    const toRemove: string[] = [];
    for (const [id, orb] of this.state.orbs) {
      const dist = Math.hypot(orb.x - player.x, orb.y - player.y);
      const pickupR = orbPickupRadiusForCultivation(
        player.realmFloor,
        player.qiLayer,
      );
      if (dist <= pickupR) {
        const base = orb.value > 0 ? orb.value : ORB_VALUE;
        const gained = rollOrbWithVassana(base, player.vassana);
        const prevFloor = player.realmFloor;
        const updated = applyQiGainWithCultivation(
          player.currentQi,
          player.realmFloor,
          player.qiLayer,
          gained,
        );
        player.currentQi = updated.currentQi;
        player.realmFloor = updated.realmFloor;
        player.qiLayer = updated.qiLayer;
        this.recordPeakQi(sessionId, player.currentQi);
        if (player.realmFloor > prevFloor) {
          this.afterRealmPromote(player, sessionId);
          toRemove.push(id);
          break;
        }
        toRemove.push(id);
      }
    }
    for (const id of toRemove) {
      this.state.orbs.delete(id);
    }
  }

  private tryPickupHerbs(sessionId: string, player: Player) {
    if (player.awaitingSkillDraft) return;
    const toRemove: string[] = [];
    for (const [id, herb] of this.state.herbs) {
      const dist = Math.hypot(herb.x - player.x, herb.y - player.y);
      const herbR = herbPickupRadiusForCultivation(
        player.realmFloor,
        player.qiLayer,
      );
      if (dist <= herbR) {
        const prevFloor = player.realmFloor;
        const updated = applyQiGainWithCultivation(
          player.currentQi,
          player.realmFloor,
          player.qiLayer,
          HERB_QI_BONUS,
        );
        player.currentQi = updated.currentQi;
        player.realmFloor = updated.realmFloor;
        player.qiLayer = updated.qiLayer;
        this.recordPeakQi(sessionId, player.currentQi);
        if (player.realmFloor > prevFloor) {
          this.afterRealmPromote(player, sessionId);
          player.herbBuffUntil = this.nowMs() + HERB_BUFF_MS;
          toRemove.push(id);
          break;
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
