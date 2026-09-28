import Phaser from "phaser";
import {
  flyingSwordCount,
  hasFlyingBladePassive,
  hasStealthPassive,
  isCombatKitActive,
  parseSkillIds,
  playerBodyRadius,
  realmFillColor,
  realmGlowColor,
  SHADOW_STEALTH_MS,
  skillLoadoutAccentColor,
  type Player,
} from "@xian/shared";

export function applyPlayerColors(
  body: Phaser.GameObjects.Arc,
  glow: Phaser.GameObjects.Arc,
  p: Player,
) {
  const r = playerBodyRadius(p.realmFloor);
  body.setRadius(r);
  body.setFillStyle(realmFillColor(p.realmFloor), 1);
  const owned = parseSkillIds(p.ownedSkillIds);
  const accent = skillLoadoutAccentColor(p.lastActiveSkillId);
  body.setStrokeStyle(3, accent, owned.length > 0 ? 0.95 : 0.45);
  glow.setRadius(r + 14);
  glow.setFillStyle(realmGlowColor(p.realmFloor), 0.22);
}

export function drawSwordOrbit(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  p: Player,
  timeSec: number,
) {
  g.clear();
  const owned = parseSkillIds(p.ownedSkillIds);
  if (
    !hasFlyingBladePassive(owned) ||
    !isCombatKitActive(p.awaitingSkillDraft)
  ) {
    return;
  }
  const count = flyingSwordCount(p.realmFloor, p.qiLayer);
  if (count <= 0) return;
  const orbitR = playerBodyRadius(p.realmFloor) + 22;
  g.lineStyle(1, 0x99eeff, 0.35);
  g.strokeCircle(x, y, orbitR);
  for (let i = 0; i < count; i++) {
    const angle = timeSec * 2.2 + (i / count) * Math.PI * 2;
    const sx = x + Math.cos(angle) * orbitR;
    const sy = y + Math.sin(angle) * orbitR;
    g.fillStyle(0xccffff, 0.9);
    g.fillCircle(sx, sy, 4);
  }
}

export function shadowStealthAlpha(
  p: Player,
  lastHitClientMs: number | undefined,
  nowMs: number,
): number {
  if (!hasStealthPassive(parseSkillIds(p.ownedSkillIds))) return 1;
  if (!lastHitClientMs) return 0.62;
  return nowMs - lastHitClientMs >= SHADOW_STEALTH_MS ? 0.55 : 1;
}

export function spawnLightningStrike(
  scene: Phaser.Scene,
  x: number,
  y: number,
) {
  const ring = scene.add.circle(x, y, 24, 0xaaccff, 0.5);
  ring.setDepth(38);
  const bolt = scene.add.graphics().setDepth(39);
  bolt.lineStyle(3, 0xeeeeff, 0.9);
  bolt.lineBetween(x, y - 80, x, y);
  scene.tweens.add({
    targets: [ring, bolt],
    alpha: 0,
    scale: 2,
    duration: 320,
    onComplete: () => {
      ring.destroy();
      bolt.destroy();
    },
  });
}

export function spawnBodyShieldPulse(
  scene: Phaser.Scene,
  x: number,
  y: number,
  bodyRadius: number,
) {
  const ring = scene.add.circle(x, y, bodyRadius + 8, 0xffdd88, 0.45);
  ring.setDepth(38);
  scene.tweens.add({
    targets: ring,
    alpha: 0,
    scale: 2.2,
    duration: 400,
    onComplete: () => ring.destroy(),
  });
}

/** AoE centered on cultivator (matches server melee circle). */
export function spawnQiCircleBurst(scene: Phaser.Scene, x: number, y: number) {
  const ring = scene.add.circle(x, y, 28, 0x88ddff, 0.45);
  ring.setDepth(38);
  scene.tweens.add({
    targets: ring,
    alpha: 0,
    scale: 3.5,
    duration: 360,
    onComplete: () => ring.destroy(),
  });
}

/** Directed skill from body toward aim (cone / line / single). */
export function spawnSkillBeam(
  scene: Phaser.Scene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
) {
  const g = scene.add.graphics().setDepth(38);
  g.lineStyle(4, 0xaaccff, 0.75);
  g.lineBetween(fromX, fromY, toX, toY);
  const head = scene.add.circle(toX, toY, 14, 0xcceeff, 0.55);
  head.setDepth(39);
  scene.tweens.add({
    targets: [g, head],
    alpha: 0,
    duration: 280,
    onComplete: () => {
      g.destroy();
      head.destroy();
    },
  });
}

export function spawnShadowWarpFlash(
  scene: Phaser.Scene,
  x: number,
  y: number,
) {
  const flash = scene.add.circle(x, y, 20, 0xbb88ff, 0.55);
  flash.setDepth(38);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scale: 2.5,
    duration: 280,
    onComplete: () => flash.destroy(),
  });
}
