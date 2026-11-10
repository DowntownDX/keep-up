import { describe, expect, it } from "vitest";
import { addAgent, assignActivity } from "../src/engine/actions";
import type { ActivityId } from "../src/engine/config";
import { createInitialState, type GameState } from "../src/engine/state";
import { step } from "../src/engine/step";

function gameWithYouOn(activity: ActivityId): GameState {
  const state = createInitialState();
  if (!assignActivity(state, "you", activity)) {
    throw new Error(`could not assign ${activity}`);
  }
  return state;
}

describe("step", () => {
  it("gives the expected followers and levels for 60 seconds of You on Make content", () => {
    // 15s at level 1 (1.2/s), 19s at level 2 (1.344/s), 24s at level 3
    // (1.488/s), 2s at level 4 (1.632/s).
    const state = gameWithYouOn("content");
    step(state, 60);

    expect(state.resources.followers).toBeCloseTo(82.512, 9);
    expect(state.workers[0].skills.content.level).toBe(4);
    expect(state.workers[0].skills.content.xp).toBeCloseTo(2.8125, 9);
    expect(state.resources.credits).toBeCloseTo(80, 9);
  });

  it("pays day job cash at the You rate", () => {
    const state = gameWithYouOn("dayJob");
    step(state, 10);
    expect(state.resources.cash).toBeCloseTo(15 + 10 * 0.6 * 1.5, 9);
  });

  it("gives a hired Creator the 1.6x content rate through step", () => {
    const state = createInitialState();
    state.resources.cash = 40;
    expect(addAgent(state, "creator")).toBe(true);
    expect(assignActivity(state, "agent-1", "content")).toBe(true);

    step(state, 10);

    expect(state.resources.followers).toBeCloseTo(16, 9);
    expect(state.workers[1].skills.content.level).toBe(1);
    expect(state.workers[1].skills.content.xp).toBeCloseTo(10, 9);
  });

  it("levels each worker's own skill", () => {
    const state = createInitialState();
    state.resources.cash = 40;
    expect(addAgent(state, "creator")).toBe(true);
    expect(assignActivity(state, "you", "content")).toBe(true);
    expect(assignActivity(state, "agent-1", "content")).toBe(true);

    step(state, 20);

    expect(state.workers[0].skills.content.level).toBe(2);
    expect(state.workers[1].skills.content.level).toBe(2);
    expect(state.workers[0].skills.content.xp).toBeCloseTo(5, 9);
    expect(state.workers[1].skills.content.xp).toBeCloseTo(5, 9);

    expect(assignActivity(state, "agent-1", "dayJob")).toBe(true);
    step(state, 10);

    expect(state.workers[0].skills.content.level).toBe(2);
    expect(state.workers[1].skills.content.level).toBe(2);
    expect(state.workers[0].skills.content.xp).toBeCloseTo(15, 9);
    expect(state.workers[1].skills.dayJob.level).toBe(1);
    expect(state.workers[1].skills.dayJob.xp).toBeCloseTo(10, 9);
  });

  it("raises the Credits trickle with subscription tier", () => {
    const state = gameWithYouOn("content");
    state.elapsedSeconds = 600;
    state.subscriptionTier = 3;

    step(state, 10);

    expect(state.resources.credits).toBeCloseTo(20 + 10 * 2.25, 9);
  });

  it("produces nothing for an idle worker but still trickles credits", () => {
    const state = createInitialState();
    step(state, 60);
    expect(state.resources.followers).toBe(0);
    expect(state.workers[0].skills.content.level).toBe(1);
    expect(state.resources.credits).toBeCloseTo(80, 9);
  });

  it("keeps skill levels per activity when a worker switches", () => {
    const state = gameWithYouOn("content");
    step(state, 20);
    expect(state.workers[0].skills.content.level).toBe(2);

    expect(assignActivity(state, "you", "dayJob")).toBe(true);
    step(state, 10);

    expect(state.workers[0].skills.content.level).toBe(2);
    expect(state.workers[0].skills.content.xp).toBeCloseTo(5, 9);
    expect(state.workers[0].skills.dayJob.level).toBe(1);
    expect(state.workers[0].skills.dayJob.xp).toBeCloseTo(10, 9);
    expect(state.resources.cash).toBeCloseTo(15 + 6 * 1.5, 9);
    expect(state.resources.followers).toBeCloseTo(24.72, 9);
  });

  it("treats one 3,600-second step like 3,600 one-second steps", () => {
    const long = gameWithYouOn("content");
    step(long, 3_600);

    const short = gameWithYouOn("content");
    for (let i = 0; i < 3_600; i += 1) step(short, 1);

    expect(long.resources.followers).toBeCloseTo(short.resources.followers, 9);
    expect(long.resources.credits).toBeCloseTo(short.resources.credits, 9);
    expect(long.workers[0].skills.content.level).toBe(short.workers[0].skills.content.level);
    expect(long.workers[0].skills.content.xp).toBeCloseTo(short.workers[0].skills.content.xp, 9);
  });

  it("banks a partial second and runs whole ticks only", () => {
    const state = gameWithYouOn("content");
    step(state, 0.5);
    expect(state.resources.followers).toBe(0);
    expect(state.pendingSeconds).toBeCloseTo(0.5, 12);

    step(state, 0.5);
    expect(state.resources.followers).toBeCloseTo(1.2, 9);
    expect(state.pendingSeconds).toBe(0);
  });

  it("turns ten tenths of a second into one tick", () => {
    const state = gameWithYouOn("content");
    for (let i = 0; i < 10; i += 1) step(state, 0.1);
    expect(state.resources.followers).toBeCloseTo(1.2, 9);
    expect(state.pendingSeconds).toBe(0);
  });

  it("matches a 60-second step when fed half-second chunks", () => {
    const chunks = gameWithYouOn("content");
    for (let i = 0; i < 120; i += 1) step(chunks, 0.5);

    const whole = gameWithYouOn("content");
    step(whole, 60);

    expect(chunks.resources.followers).toBeCloseTo(whole.resources.followers, 9);
    expect(chunks.resources.credits).toBeCloseTo(whole.resources.credits, 9);
    expect(chunks.workers[0].skills.content.level).toBe(whole.workers[0].skills.content.level);
    expect(chunks.workers[0].skills.content.xp).toBeCloseTo(whole.workers[0].skills.content.xp, 9);
    expect(chunks.pendingSeconds).toBe(0);
  });

  it("does not change state for a zero-second step", () => {
    const state = createInitialState();
    const before = structuredClone(state);
    step(state, 0);
    expect(state).toEqual(before);
  });

  it("rejects negative or non-finite seconds", () => {
    const state = createInitialState();
    expect(() => step(state, -1)).toThrow(RangeError);
    expect(() => step(state, Number.NaN)).toThrow(RangeError);
    expect(() => step(state, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
