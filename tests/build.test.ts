import { describe, expect, it } from "vitest";
import { assignActivity } from "../src/engine/actions";
import { createInitialState, type GameState } from "../src/engine/state";
import { step } from "../src/engine/step";
import { hasWon, isSystemUnlocked, passiveCashRate } from "../src/engine/ventures";

function buildGame(options: { credits?: number; knowHow?: number } = {}): GameState {
  const state = createInitialState();
  if (options.credits !== undefined) state.resources.credits = options.credits;
  if (options.knowHow !== undefined) state.resources.knowHow = options.knowHow;
  if (!assignActivity(state, "you", "build")) throw new Error("could not assign build");
  return state;
}

describe("build venture", () => {
  it("builds at full speed when both resources are available", () => {
    const state = buildGame({ credits: 100, knowHow: 10 });

    step(state, 10);

    expect(state.ventureProgress).toBeCloseTo(12, 9);
    expect(state.resources.credits).toBeCloseTo(100 + 10 - 12, 9);
    expect(state.resources.knowHow).toBeCloseTo(10 - 2.4, 9);
    expect(state.workers[0].skills.build.level).toBe(1);
    expect(state.workers[0].skills.build.xp).toBeCloseTo(10, 9);
    expect(state.venturesShipped).toBe(0);
  });

  it("builds half-starved when Know-how runs out", () => {
    const state = buildGame({ credits: 1_000, knowHow: 1 });

    step(state, 10);

    expect(state.ventureProgress).toBeCloseTo(5, 9);
    expect(state.resources.credits).toBeCloseTo(1_005, 9);
    expect(state.resources.knowHow).toBeCloseTo(0, 9);
    expect(state.resources.knowHow).toBeGreaterThanOrEqual(0);
    expect(state.workers[0].skills.build.xp).toBeCloseTo(5 / 1.2, 9);
  });

  it("makes no progress when Know-how is gone", () => {
    const state = buildGame({ credits: 1_000, knowHow: 0 });

    step(state, 10);

    expect(state.ventureProgress).toBe(0);
    expect(state.resources.credits).toBeCloseTo(1_010, 9);
    expect(state.resources.knowHow).toBe(0);
    expect(state.workers[0].skills.build.xp).toBe(0);
  });

  it("spends the tick's Credits trickle before checking the burn", () => {
    const state = buildGame({ credits: 0, knowHow: 1_000 });

    step(state, 1);

    expect(state.resources.credits).toBe(0);
    expect(state.ventureProgress).toBeCloseTo(1, 9);
    expect(state.resources.knowHow).toBeCloseTo(1_000 - 0.2, 9);
  });

  it("ships venture 1 and pays income from the next tick", () => {
    const state = buildGame({ credits: 1_000, knowHow: 1_000 });

    step(state, 60);

    expect(state.venturesShipped).toBe(1);
    expect(state.ventureProgress).toBeGreaterThan(0);
    expect(state.ventureProgress).toBeLessThan(300);
    expect(passiveCashRate(state)).toBeCloseTo(0.75, 9);
    expect(isSystemUnlocked(state, "skills")).toBe(true);
    expect(isSystemUnlocked(state, "automations")).toBe(false);
    expect(hasWon(state)).toBe(false);

    const cashBefore = state.resources.cash;
    step(state, 10);
    expect(state.resources.cash - cashBefore).toBeCloseTo(7.5, 9);
  });

  it("carries overflow into the next venture and starts income next tick", () => {
    const state = buildGame({ credits: 1_000, knowHow: 1_000 });
    state.ventureProgress = 59.9;

    step(state, 1);

    expect(state.venturesShipped).toBe(1);
    expect(state.ventureProgress).toBeCloseTo(1.1, 9);
    expect(state.resources.cash).toBe(15);

    step(state, 1);
    expect(state.resources.cash).toBeCloseTo(15.75, 9);
  });

  it("can ship twice in one tick when overflow covers the next venture", () => {
    const state = buildGame({ credits: 1_000, knowHow: 1_000 });
    state.ventureProgress = 360;

    step(state, 1);

    expect(state.venturesShipped).toBe(2);
    expect(state.ventureProgress).toBeCloseTo(1.2, 9);
  });

  it("does nothing once all ten ventures have shipped", () => {
    const state = buildGame({ credits: 1_000, knowHow: 1_000 });
    state.venturesShipped = 10;

    step(state, 10);

    expect(hasWon(state)).toBe(true);
    expect(state.ventureProgress).toBe(0);
    expect(state.resources.credits).toBeCloseTo(1_010, 9);
    expect(state.resources.knowHow).toBeCloseTo(1_000, 9);
    expect(state.workers[0].skills.build.xp).toBe(0);
  });

  it("keeps 3,600 seconds equal to 3,600 one-second steps while building", () => {
    const long = buildGame({ credits: 1_000_000_000, knowHow: 1_000_000_000 });
    step(long, 3_600);

    const short = buildGame({ credits: 1_000_000_000, knowHow: 1_000_000_000 });
    for (let i = 0; i < 3_600; i += 1) step(short, 1);

    expect(long.venturesShipped).toBe(short.venturesShipped);
    expect(long.ventureProgress).toBeCloseTo(short.ventureProgress, 9);
    expect(long.resources.cash).toBeCloseTo(short.resources.cash, 6);
    expect(long.resources.credits).toBeCloseTo(short.resources.credits, 6);
    expect(long.resources.knowHow).toBeCloseTo(short.resources.knowHow, 6);
    expect(long.workers[0].skills.build.level).toBe(short.workers[0].skills.build.level);
    expect(long.workers[0].skills.build.xp).toBeCloseTo(short.workers[0].skills.build.xp, 9);
  });
});
