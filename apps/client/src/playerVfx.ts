import Phaser from "phaser";
import {
  daoPathAccentColor,
  flyingSwordCount,
  isCombatKitActive,
  playerBodyRadius,
  realmFillColor,
  realmGlowColor,
  SHADOW_STEALTH_MS,
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
  const accent = daoPathAccentColor(p.daoPath);
  body.setStrokeStyle(3, accent, p.daoPath ? 0.95 : 0.45);
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
  if (
    p.daoPath !== "sword" ||
    !isCombatKitActive(p.realmFloor, p.daoPath, p.awaitingPathChoice)
  ) {
    return;
  }
  const count = flyingSwordCount(p.realmFloor);
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
  if (p.daoPath !== "shadow") return 1;
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
  radius: number,
) {
  const ring = scene.add.circle(x, y, radius + 8, 0xffcc55, 0.35);
  ring.setStrokeStyle(2, 0xffeeaa, 0.8);
  ring.setDepth(38);
  scene.tweens.add({
    targets: ring,
    scale: 1.5,
    alpha: 0,
    duration: 400,
    onComplete: () => ring.destroy(),
  });
}

export function spawnShadowWarpFlash(
  scene: Phaser.Scene,
  x: number,
  y: number,
) {
  const puff = scene.add.circle(x, y, 20, 0x9966cc, 0.45);
  puff.setDepth(38);
  scene.tweens.add({
    targets: puff,
    scale: 2.2,
    alpha: 0,
    duration: 280,
    onComplete: () => puff.destroy(),
  });
}
