import { describe, expect, it } from "vitest";
import { upgradeSubscription } from "../src/engine/actions";
import { MODEL_COUNT } from "../src/engine/config";
import { creditRate } from "../src/engine/rates";
import {
  canUpgradeSubscription,
  cashGain,
  edgeMultiplier,
  generationsBehind,
  latestGeneration,
  nextRelease,
  releaseTime,
  subscriptionUpgradeCost,
} from "../src/engine/releases";
import { createInitialState, type GameState } from "../src/engine/state";

function at(elapsedSeconds: number, tier = 1): GameState {
  const state = createInitialState();
  state.elapsedSeconds = elapsedSeconds;
  state.subscriptionTier = tier;
  return state;
}

describe("release schedule", () => {
  it("releases generation 1 at zero and generation 2 at 150 seconds", () => {
    expect(releaseTime(1)).toBe(0);
    expect(releaseTime(2)).toBe(150);
    expect(latestGeneration(at(0))).toBe(1);
    expect(latestGeneration(at(149.999))).toBe(1);
    expect(latestGeneration(at(150))).toBe(2);
  });

  it("makes each later interval three times longer", () => {
    expect(releaseTime(3)).toBe(600);
    expect(releaseTime(4)).toBe(1_950);
    expect(releaseTime(4) - releaseTime(3)).toBe(3 * (releaseTime(3) - releaseTime(2)));
    expect(latestGeneration(at(599))).toBe(2);
    expect(latestGeneration(at(600))).toBe(3);
  });

  it("caps at ten generations and reports the next one", () => {
    expect(MODEL_COUNT).toBe(10);
    expect(latestGeneration(at(Number.MAX_SAFE_INTEGER))).toBe(10);
    expect(nextRelease(at(0))).toEqual({ generation: 2, atSeconds: 150 });
    expect(nextRelease(at(150))).toEqual({ generation: 3, atSeconds: 600 });
    expect(nextRelease(at(Number.MAX_SAFE_INTEGER))).toBeNull();
  });
});

describe("Edge", () => {
  it("maps zero to four generations behind to 1.5, 1.25, 1.1, 1 and 0.9", () => {
    const expected = [1.5, 1.25, 1.1, 1, 0.9];
    const latest = latestGeneration(at(6_000));

    expected.forEach((multiplier, behind) => {
      const state = at(6_000, latest - behind);
      expect(generationsBehind(state)).toBe(behind);
      expect(edgeMultiplier(state)).toBe(multiplier);
    });
  });

  it("floors at 0.9 for four or more generations behind", () => {
    const state = at(Number.MAX_SAFE_INTEGER, 1);
    expect(generationsBehind(state)).toBe(9);
    expect(edgeMultiplier(state)).toBe(0.9);
  });

  it("scales Cash gains and leaves them untouched at the latest generation", () => {
    expect(cashGain(at(0), 10)).toBe(15);
    expect(cashGain(at(6_000, 4), 10)).toBe(12.5);
    expect(cashGain(at(Number.MAX_SAFE_INTEGER, 1), 10)).toBe(9);
  });
});

describe("subscription cost", () => {
  it("starts at 50 Cash and grows 6x per tier", () => {
    expect(subscriptionUpgradeCost(1)).toBe(50);
    expect(subscriptionUpgradeCost(2)).toBe(300);
    expect(subscriptionUpgradeCost(3)).toBe(1_800);
    expect(subscriptionUpgradeCost(10)).toBeNull();
  });

  it("requires a released generation, a free tier and enough Cash", () => {
    const before = at(149);
    before.resources.cash = 1_000;
    expect(canUpgradeSubscription(before)).toBe(false);

    const released = at(150);
    expect(canUpgradeSubscription(released)).toBe(false);
    released.resources.cash = 49;
    expect(canUpgradeSubscription(released)).toBe(false);
    released.resources.cash = 50;
    expect(canUpgradeSubscription(released)).toBe(true);

    const top = at(Number.MAX_SAFE_INTEGER, 10);
    top.resources.cash = 1_000_000;
    expect(canUpgradeSubscription(top)).toBe(false);
  });
});

describe("subscription upgrade", () => {
  it("charges the next tier and raises the Credits trickle", () => {
    const state = at(150);
    state.resources.cash = 100;
    const before = creditRate(state);

    expect(upgradeSubscription(state)).toBe(true);

    expect(state.subscriptionTier).toBe(2);
    expect(state.resources.cash).toBe(50);
    expect(creditRate(state)).toBeCloseTo(before * 1.5, 9);
    expect(edgeMultiplier(state)).toBe(1.5);
  });

  it("rejects an unreleased generation, short Cash and the cap unchanged", () => {
    const early = at(149);
    early.resources.cash = 1_000;
    const before = structuredClone(early);
    expect(upgradeSubscription(early)).toBe(false);
    expect(early).toEqual(before);

    const poor = at(150);
    poor.resources.cash = 49;
    expect(upgradeSubscription(poor)).toBe(false);
    expect(poor.subscriptionTier).toBe(1);
    expect(poor.resources.cash).toBe(49);

    const top = at(10, 10);
    top.resources.cash = 1_000_000_000;
    expect(upgradeSubscription(top)).toBe(false);
    expect(top.subscriptionTier).toBe(10);
  });
});
