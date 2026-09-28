import { describe, expect, it } from "vitest";
import {
  joystickDeltaToMoveVector,
  pointerDeltaToAimVector,
} from "./touchControls.js";

describe("joystickDeltaToMoveVector", () => {
  const r = 50;

  it("returns zero inside dead zone", () => {
    expect(joystickDeltaToMoveVector(2, 2, r)).toEqual({ x: 0, y: 0 });
  });

  it("returns normalized direction at edge", () => {
    const v = joystickDeltaToMoveVector(50, 0, r);
    expect(v.x).toBeCloseTo(1);
    expect(v.y).toBeCloseTo(0);
  });

  it("scales magnitude by stick deflection", () => {
    const v = joystickDeltaToMoveVector(25, 0, r);
    expect(v.x).toBeCloseTo(0.5);
    expect(v.y).toBeCloseTo(0);
  });

  it("handles zero max radius", () => {
    expect(joystickDeltaToMoveVector(10, 10, 0)).toEqual({ x: 0, y: 0 });
  });
});

describe("pointerDeltaToAimVector", () => {
  it("matches move stick math for attack drag", () => {
    const r = 40;
    const dx = 30;
    const dy = -10;
    expect(pointerDeltaToAimVector(dx, dy, r)).toEqual(
      joystickDeltaToMoveVector(dx, dy, r),
    );
  });
});
