import { describe, expect, it } from "vitest";
import { createInitialState, createWorker, type GameState } from "../src/engine/state";
import {
  affordSeconds,
  buildPointsPerSecond,
  clientCreditBurn,
  etaFrom,
  promptForecast,
  skillsForecast,
  ventureEta,
} from "../src/ui/forecast";
import { formatBonus } from "../src/ui/format";

function withBuildAndTutor(): GameState {
  const state = createInitialState();
  state.workers[0].activity = "build";
  const tutor = createWorker("agent-1", "tutor");
  tutor.activity = "learn";
  state.workers.push(tutor);
  return state;
}

describe("etaFrom", () => {
  it("takes the slowest constraint", () => {
    expect(
      etaFrom({
        remaining: 260,
        buildRate: 2,
        creditStock: 0,
        creditSupply: 1,
        knowHowStock: 1000,
        knowHowSupply: 0.32,
      }),
    ).toEqual({ seconds: 260, cappedBy: "credits" });

    expect(
      etaFrom({
        remaining: 260,
        buildRate: 2,
        creditStock: 1000,
        creditSupply: 1,
        knowHowStock: 0,
        knowHowSupply: 0.02,
      }),
    ).toEqual({ seconds: 650, cappedBy: "knowHow" });

    expect(
      etaFrom({
        remaining: 260,
        buildRate: 1.2,
        creditStock: 0,
        creditSupply: 10,
        knowHowStock: 0,
        knowHowSupply: 10,
      }),
    ).toEqual({ seconds: 260 / 1.2, cappedBy: "build" });
  });

  it("lets a stock buffer cover a leg with no supply", () => {
    expect(
      etaFrom({
        remaining: 20,
        buildRate: 1,
        creditStock: 0,
        creditSupply: 1,
        knowHowStock: 5,
        knowHowSupply: 0,
      }),
    ).toEqual({ seconds: 20, cappedBy: "build" });
  });

  it("returns null when a leg cannot finish", () => {
    expect(
      etaFrom({
        remaining: 260,
        buildRate: 1,
        creditStock: 20,
        creditSupply: 1,
        knowHowStock: 5,
        knowHowSupply: 0,
      }),
    ).toBeNull();

    expect(
      etaFrom({
        remaining: 260,
        buildRate: 0,
        creditStock: 1000,
        creditSupply: 1,
        knowHowStock: 1000,
        knowHowSupply: 1,
      }),
    ).toBeNull();
  });

  it("finishes instantly when the remaining points are zero", () => {
    expect(
      etaFrom({
        remaining: 0,
        buildRate: 0,
        creditStock: 0,
        creditSupply: 0,
        knowHowStock: 0,
        knowHowSupply: 0,
      }),
    ).toEqual({ seconds: 0, cappedBy: "build" });
  });
});

describe("ventureEta", () => {
  it("forecasts a live build with credits as the cap", () => {
    const eta = ventureEta(withBuildAndTutor());
    expect(eta?.cappedBy).toBe("credits");
    expect(eta?.seconds).toBeCloseTo(240, 9);
  });

  it("moves the cap to build when credits flow faster", () => {
    const state = withBuildAndTutor();
    state.subscriptionTier = 2;
    const eta = ventureEta(state);
    expect(eta?.cappedBy).toBe("build");
    expect(eta?.seconds).toBeCloseTo(260 / 1.2, 9);
  });

  it("returns null when gated, won or not building", () => {
    const gated = withBuildAndTutor();
    gated.venturesShipped = 5;
    gated.resources.followers = 0;
    expect(ventureEta(gated)).toBeNull();

    const won = withBuildAndTutor();
    won.venturesShipped = 10;
    expect(ventureEta(won)).toBeNull();

    const idle = createInitialState();
    idle.workers[0].activity = null;
    expect(ventureEta(idle)).toBeNull();
  });

  it("subtracts the progress already made", () => {
    const state = withBuildAndTutor();
    state.ventureProgress = 100;
    const eta = ventureEta(state);
    expect(eta?.seconds).toBeCloseTo((260 - 100 - 20) / 1, 9);
  });

  it("returns null when client work burns the whole credit supply", () => {
    const state = createInitialState();
    state.venturesShipped = 2;
    state.resources.followers = 10;
    state.resources.credits = 0;
    state.resources.leads = 100;
    state.resources.knowHow = 1000;
    state.workers[0].activity = "build";
    const assistant = createWorker("agent-1", "assistant");
    assistant.activity = "clientWork";
    state.workers.push(assistant);
    const tutor = createWorker("agent-2", "tutor");
    tutor.activity = "learn";
    state.workers.push(tutor);

    expect(clientCreditBurn(state)).toBeCloseTo(1.6, 9);
    expect(ventureEta(state)).toBeNull();
  });
});

describe("buildPointsPerSecond", () => {
  it("sums workers on build and recorded automations", () => {
    const state = createInitialState();
    expect(buildPointsPerSecond(state)).toBe(0);
    state.workers[0].activity = "build";
    expect(buildPointsPerSecond(state)).toBeCloseTo(1.2, 9);
    state.workers[0].automation = { activity: "build", rate: 0.5 };
    expect(buildPointsPerSecond(state)).toBeCloseTo(1.7, 9);
  });
});

describe("affordSeconds", () => {
  it("handles now, no income, negative income and a normal wait", () => {
    expect(affordSeconds(25, 0, 25)).toBe(0);
    expect(affordSeconds(10, 0, 25)).toBeNull();
    expect(affordSeconds(10, -1, 25)).toBeNull();
    expect(affordSeconds(15, 0.9, 25)).toBeCloseTo(10 / 0.9, 9);
  });
});

describe("upgrade forecasts", () => {
  it("shows the current and next Prompt bonus and its wait", () => {
    const idle = promptForecast(createInitialState());
    expect(idle.level).toBe(0);
    expect(idle.now).toBe(0);
    expect(idle.next).toBeCloseTo(0.08, 9);
    expect(idle.cost).toBe(25);
    expect(idle.seconds).toBeNull();

    const working = createInitialState();
    working.workers[0].activity = "dayJob";
    const earning = promptForecast(working);
    expect(earning.seconds).toBeCloseTo(10 / 0.9, 9);
  });

  it("shows the current and next Skills bonus and its wait", () => {
    const idle = skillsForecast(createInitialState());
    expect(idle.now).toBe(0);
    expect(idle.next).toBeCloseTo(0.1, 9);
    expect(idle.cost).toBe(10);
    expect(idle.seconds).toBeNull();

    const learning = createInitialState();
    const tutor = createWorker("agent-1", "tutor");
    tutor.activity = "learn";
    learning.workers.push(tutor);
    expect(skillsForecast(learning).seconds).toBeCloseTo(5 / 0.32, 9);
  });

  it("does not clamp a cumulative bonus at 100%", () => {
    expect(formatBonus(0.08)).toBe("8%");
    expect(formatBonus(1.04)).toBe("104%");
    expect(formatBonus(2)).toBe("200%");
  });
});
