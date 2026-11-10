import { describe, expect, it } from "vitest";
import type { ActivityId } from "../src/engine/config";
import {
  creditRate,
  resourceNetRates,
  resourceRates,
  skillMultiplier,
  specialtyMultiplier,
  workerRate,
  xpToNextLevel,
} from "../src/engine/rates";
import { createInitialState, createWorker } from "../src/engine/state";

describe("skillMultiplier", () => {
  it("is 1 at level 1 and adds 12% per level above it", () => {
    expect(skillMultiplier(1)).toBe(1);
    expect(skillMultiplier(2)).toBeCloseTo(1.12);
    expect(skillMultiplier(10)).toBeCloseTo(2.08);
  });
});

describe("specialtyMultiplier", () => {
  it("gives You 1.2x at every activity", () => {
    expect(specialtyMultiplier("you", "dayJob")).toBe(1.2);
    expect(specialtyMultiplier("you", "content")).toBe(1.2);
    expect(specialtyMultiplier("you", "learn")).toBe(1.2);
  });

  it("gives an agent 1.6x only at its specialty", () => {
    expect(specialtyMultiplier("creator", "content")).toBe(1.6);
    expect(specialtyMultiplier("creator", "dayJob")).toBe(1);
    expect(specialtyMultiplier("assistant", "dayJob")).toBe(1.6);
    expect(specialtyMultiplier("assistant", "clientWork")).toBe(1.6);
    expect(specialtyMultiplier("tutor", "learn")).toBe(1.6);
  });
});

describe("workerRate", () => {
  it("combines base rate, specialty and skill level", () => {
    const state = createInitialState();
    const you = createWorker("you", "you");
    expect(workerRate(state, you, "content")).toBeCloseTo(1 * 1.2);
    you.skills.content.level = 3;
    expect(workerRate(state, you, "content")).toBeCloseTo(1 * 1.2 * 1.24);
  });

  it("uses 1x for a non-specialist agent", () => {
    const state = createInitialState();
    const creator = createWorker("agent-1", "creator");
    expect(workerRate(state, creator, "dayJob")).toBeCloseTo(0.5);
    expect(workerRate(state, creator, "content")).toBeCloseTo(1.6);
    expect(workerRate(state, creator, "learn")).toBeCloseTo(0.2);
  });

  it("is zero for an unknown activity", () => {
    const state = createInitialState();
    const builder = createWorker("agent-1", "builder");
    expect(workerRate(state, builder, "bogus" as ActivityId)).toBe(0);
  });

  it("gives a Builder its 1.6x at Build venture", () => {
    const state = createInitialState();
    expect(workerRate(state, createWorker("agent-1", "builder"), "build")).toBeCloseTo(1.6);
  });
});

describe("creditRate", () => {
  it("trickles 1 per second on the free tier", () => {
    expect(creditRate(createInitialState())).toBe(1);
  });

  it("grows 1.5x per subscription tier", () => {
    const state = createInitialState();
    state.subscriptionTier = 3;
    expect(creditRate(state)).toBeCloseTo(2.25);
  });
});

describe("xpToNextLevel", () => {
  it("needs 15 seconds at level 1 and grows 1.25x per level", () => {
    expect(xpToNextLevel(1)).toBe(15);
    expect(xpToNextLevel(2)).toBeCloseTo(18.75);
    expect(xpToNextLevel(3)).toBeCloseTo(23.4375);
  });
});

describe("resourceRates", () => {
  it("sums every working worker and the credits trickle", () => {
    const state = createInitialState();
    state.workers.push(createWorker("agent-1", "creator"));
    state.workers[0].activity = "content";
    state.workers[1].activity = "content";
    const rates = resourceRates(state);
    expect(rates.followers).toBeCloseTo(1.2 + 1.6);
    expect(rates.credits).toBe(1);
    expect(rates.cash).toBe(0);
  });

  it("ignores idle workers", () => {
    const rates = resourceRates(createInitialState());
    expect(rates.followers).toBe(0);
    expect(rates.knowHow).toBe(0);
  });

  it("adds passive venture income to Cash", () => {
    const state = createInitialState();
    state.venturesShipped = 2;
    expect(resourceRates(state).cash).toBeCloseTo(3, 9);
  });
});

describe("resourceNetRates", () => {
  it("subtracts the build burn workers are trying to spend", () => {
    const state = createInitialState();
    state.workers[0].activity = "build";
    const rates = resourceNetRates(state);
    expect(rates.credits).toBeCloseTo(1 - 1.2, 9);
    expect(rates.knowHow).toBeCloseTo(-0.24, 9);
  });

  it("does not subtract burn after the game is won", () => {
    const state = createInitialState();
    state.workers[0].activity = "build";
    state.venturesShipped = 10;
    const rates = resourceNetRates(state);
    expect(rates.credits).toBeCloseTo(1, 9);
    expect(rates.knowHow).toBe(0);
  });
});
