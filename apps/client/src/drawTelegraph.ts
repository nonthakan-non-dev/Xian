import Phaser from "phaser";
import type { DamageTelegraph } from "@xian/shared";

export function drawDamageTelegraph(
  g: Phaser.GameObjects.Graphics,
  t: DamageTelegraph,
  fillColor: number,
  strokeColor: number,
) {
  g.clear();
  g.fillStyle(fillColor, 0.28);
  g.lineStyle(2, strokeColor, 0.65);

  switch (t.kind) {
    case "circle":
      g.fillCircle(t.cx, t.cy, t.radius);
      g.strokeCircle(t.cx, t.cy, t.radius);
      break;
    case "arc": {
      g.beginPath();
      g.moveTo(t.cx, t.cy);
      g.arc(
        t.cx,
        t.cy,
        t.radius,
        t.angle - t.halfAngle,
        t.angle + t.halfAngle,
        false,
      );
      g.closePath();
      g.fillPath();
      g.strokePath();
      break;
    }
    case "dash": {
      g.lineStyle(t.hitRadius, fillColor, 0.35);
      g.lineBetween(t.x1, t.y1, t.x2, t.y2);
      g.lineStyle(2, strokeColor, 0.65);
      g.strokeCircle(t.x1, t.y1, t.hitRadius);
      g.strokeCircle(t.x2, t.y2, t.hitRadius);
      break;
    }
  }
}
