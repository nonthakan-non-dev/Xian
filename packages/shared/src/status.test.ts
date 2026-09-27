import { describe, expect, it } from "vitest";
import {
  POISON_DECAY_IDLE_MS,
  POISON_DECAY_STEP_MS,
  poisonDecayStateOnRefresh,
  tickPoisonDecayState,
} from "./status.js";

describe("tickPoisonDecayState", () => {
  it("drops one stack after idle then every step interval", () => {
    const t0 = 1000;
    const state = poisonDecayStateOnRefresh(t0);
    expect(state.nextDecayAt).toBe(t0 + POISON_DECAY_IDLE_MS);

    const afterIdle = tickPoisonDecayState(
      3,
      state,
      t0 + POISON_DECAY_IDLE_MS,
    );
    expect(afterIdle.stacks).toBe(2);

    const afterStep = tickPoisonDecayState(
      afterIdle.stacks,
      afterIdle.state,
      t0 + POISON_DECAY_IDLE_MS + POISON_DECAY_STEP_MS,
    );
    expect(afterStep.stacks).toBe(1);
  });

  it("refresh resets decay schedule", () => {
    const tRefresh = 12_000;
    const state = poisonDecayStateOnRefresh(tRefresh);
    const beforeIdle = tickPoisonDecayState(
      4,
      state,
      tRefresh + POISON_DECAY_IDLE_MS - 100,
    );
    expect(beforeIdle.stacks).toBe(4);

    const refreshed = poisonDecayStateOnRefresh(tRefresh + 500);
    const afterPartialIdle = tickPoisonDecayState(
      4,
      refreshed,
      tRefresh + 500 + POISON_DECAY_IDLE_MS - 100,
    );
    expect(afterPartialIdle.stacks).toBe(4);
  });
});
