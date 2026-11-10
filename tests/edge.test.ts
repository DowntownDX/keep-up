import { describe, expect, it } from "vitest";
import { assignActivity, doItYourself } from "../src/engine/actions";
import { recordAutomation } from "../src/engine/automations";
import { resourceRates } from "../src/engine/rates";
import { edgeMultiplier, latestGeneration, releaseTime } from "../src/engine/releases";
import { createInitialState, createWorker, type GameState } from "../src/engine/state";
import { step, stepOffline } from "../src/engine/step";

/** A game at the given generation's release time, on the given tier. */
function at(generation: number, tier = 1): GameState {
  const state = createInitialState();
  state.elapsedSeconds = releaseTime(generation);
  state.subscriptionTier = tier;
  return state;
}

function assign(state: GameState, activity: Parameters<typeof assignActivity>[2]): void {
  if (!assignActivity(state, "you", activity)) throw new Error(`could not assign ${activity}`);
}

describe("clock", () => {
  it("advances one second per tick and releases generation 2 at 150", () => {
    const state = createInitialState();
    step(state, 149);
    expect(state.elapsedSeconds).toBe(149);

    step(state, 1);
    expect(state.elapsedSeconds).toBe(150);
  });

  it("applies a release to the tick that reaches it", () => {
    const state = at(1);
    state.elapsedSeconds = 149;
    assign(state, "dayJob");

    step(state, 1);

    expect(state.resources.cash).toBeCloseTo(15 + 0.6 * 1.25, 9);
  });

  it("releases generations during offline catch-up", () => {
    const state = createInitialState();
    stepOffline(state, 150);

    expect(state.elapsedSeconds).toBe(150);
    expect(latestGeneration(state)).toBe(2);
    expect(edgeMultiplier(state)).toBe(1.25);
    expect(state.resources.cash).toBe(15);
  });

  it("does not advance on a Do it yourself click", () => {
    const state = createInitialState();
    assign(state, "content");

    doItYourself(state, "you");

    expect(state.elapsedSeconds).toBe(0);
  });
});

describe("Cash earning", () => {
  it("pays day job Cash through Edge", () => {
    const state = at(6, 5);
    assign(state, "dayJob");

    step(state, 10);

    expect(state.resources.cash).toBeCloseTo(15 + 10 * 0.6 * 1.25, 9);
  });

  it("pays passive venture income through Edge", () => {
    const state = at(2);
    state.venturesShipped = 1;

    step(state, 10);

    expect(state.resources.cash).toBeCloseTo(15 + 0.5 * 1.25 * 10, 9);
  });

  it("pays Client work through Edge without changing Leads or Credits", () => {
    const state = at(6, 5);
    state.venturesShipped = 1;
    state.resources.leads = 10;
    state.resources.credits = 100;
    assign(state, "clientWork");

    step(state, 10);

    expect(state.resources.cash).toBeCloseTo(15 + 19.2 * 1.25 + 0.5 * 1.25 * 10, 9);
    expect(state.resources.leads).toBeCloseTo(10 - 2.4, 9);
    expect(state.resources.credits).toBeCloseTo(100 + 10 * 1.5 ** 4 - 12, 9);
    expect(state.workers[0].skills.clientWork.xp).toBeCloseTo(10, 9);
  });

  it("pays a cash automation through Edge while its snapshot stays fixed", () => {
    const state = at(6, 5);
    state.venturesShipped = 2;
    state.workers.push(createWorker("agent-1", "assistant"));
    state.nextAgentNumber = 2;
    assignActivity(state, "agent-1", "dayJob");
    recordAutomation(state, "agent-1");
    assignActivity(state, "agent-1", null);

    step(state, 10);

    expect(state.workers[1].automation?.rate).toBeCloseTo(0.4, 9);
    expect(state.resources.cash).toBeCloseTo(15 + 2 * 1.25 * 10 + 0.4 * 1.25 * 10, 9);
  });

  it("leaves non-Cash resources and the Credits trickle unscaled", () => {
    const state = at(10);
    assign(state, "content");

    step(state, 10);

    expect(state.resources.followers).toBeCloseTo(1.2, 9);
    expect(state.resources.credits).toBeCloseTo(30, 9);
  });

  it("reports the same Cash rate the tick pays", () => {
    const state = at(6, 5);
    assign(state, "dayJob");

    expect(resourceRates(state).cash).toBeCloseTo(0.6 * 1.25, 9);
  });
});
