import { describe, expect, it } from "vitest";
import { VENTURE_NAMES } from "../src/engine/config";
import { createInitialState } from "../src/engine/state";
import {
  buildPointsRequired,
  currentVentureIndex,
  hasWon,
  isSystemUnlocked,
  passiveCashRate,
  ventureIncome,
} from "../src/engine/ventures";

describe("venture schedule", () => {
  it("lists the ten ventures in order", () => {
    expect(VENTURE_NAMES).toHaveLength(10);
    expect(VENTURE_NAMES[0]).toBe("Prompt pack");
    expect(VENTURE_NAMES[9]).toBe("Product portfolio");
  });

  it("grows the build requirement 5x per venture", () => {
    expect(buildPointsRequired(0)).toBe(60);
    expect(buildPointsRequired(1)).toBe(300);
    expect(buildPointsRequired(2)).toBe(1_500);
  });

  it("grows passive income 3x per venture", () => {
    expect(ventureIncome(0)).toBe(0.5);
    expect(ventureIncome(1)).toBe(1.5);
    expect(ventureIncome(2)).toBe(4.5);
  });
});

describe("passiveCashRate", () => {
  it("is zero before any venture ships", () => {
    expect(passiveCashRate(createInitialState())).toBe(0);
  });

  it("sums the income of every shipped venture", () => {
    const state = createInitialState();
    state.venturesShipped = 3;
    expect(passiveCashRate(state)).toBeCloseTo(6.5, 9);
  });
});

describe("currentVentureIndex", () => {
  it("is the number shipped until all ten are done", () => {
    const state = createInitialState();
    expect(currentVentureIndex(state)).toBe(0);
    state.venturesShipped = 9;
    expect(currentVentureIndex(state)).toBe(9);
    state.venturesShipped = 10;
    expect(currentVentureIndex(state)).toBeNull();
  });
});

describe("isSystemUnlocked", () => {
  it("unlocks the start systems immediately", () => {
    const state = createInitialState();
    expect(isSystemUnlocked(state, "promptLibrary")).toBe(true);
    expect(isSystemUnlocked(state, "teamBonuses")).toBe(true);
    expect(isSystemUnlocked(state, "skills")).toBe(false);
    expect(isSystemUnlocked(state, "automations")).toBe(false);
    expect(isSystemUnlocked(state, "audienceFunnel")).toBe(false);
  });

  it("turns systems on at their venture counts", () => {
    const state = createInitialState();
    state.venturesShipped = 1;
    expect(isSystemUnlocked(state, "skills")).toBe(true);
    expect(isSystemUnlocked(state, "automations")).toBe(false);

    state.venturesShipped = 2;
    expect(isSystemUnlocked(state, "automations")).toBe(true);
    expect(isSystemUnlocked(state, "audienceFunnel")).toBe(false);

    state.venturesShipped = 3;
    expect(isSystemUnlocked(state, "audienceFunnel")).toBe(true);
  });
});

describe("hasWon", () => {
  it("is true only after the tenth venture ships", () => {
    const state = createInitialState();
    state.venturesShipped = 9;
    expect(hasWon(state)).toBe(false);
    state.venturesShipped = 10;
    expect(hasWon(state)).toBe(true);
  });
});
