import { describe, expect, it } from "vitest";
import { assignActivity, isActivityUnlocked } from "../src/engine/actions";
import { resourceNetRates, resourceRates } from "../src/engine/rates";
import { createInitialState, type GameState } from "../src/engine/state";
import { step } from "../src/engine/step";

function unlocked(activity: "findClients" | "clientWork"): GameState {
  const state = createInitialState();
  state.venturesShipped = 1;
  if (!assignActivity(state, "you", activity)) throw new Error(`could not assign ${activity}`);
  return state;
}

describe("activity unlocks", () => {
  it("keeps the side hustle locked until venture 1 ships", () => {
    const state = createInitialState();
    expect(isActivityUnlocked(state, "findClients")).toBe(false);
    expect(isActivityUnlocked(state, "clientWork")).toBe(false);
    expect(assignActivity(state, "you", "findClients")).toBe(false);
    expect(assignActivity(state, "you", "clientWork")).toBe(false);

    state.venturesShipped = 1;
    expect(isActivityUnlocked(state, "findClients")).toBe(true);
    expect(isActivityUnlocked(state, "clientWork")).toBe(true);
    expect(assignActivity(state, "you", "findClients")).toBe(true);
  });
});

describe("Find clients", () => {
  it("produces Leads at the You rate", () => {
    const state = unlocked("findClients");
    step(state, 10);
    expect(state.resources.leads).toBeCloseTo(1.2, 9);
    expect(state.workers[0].skills.findClients.xp).toBeCloseTo(10, 9);
  });

  it("shows a positive Leads rate", () => {
    const state = unlocked("findClients");
    expect(resourceRates(state).leads).toBeCloseTo(0.12, 9);
    expect(resourceNetRates(state).leads).toBeCloseTo(0.12, 9);
  });
});

describe("Client work", () => {
  it("turns Leads into Cash at full speed", () => {
    const state = unlocked("clientWork");
    state.resources.leads = 10;
    state.resources.credits = 100;

    step(state, 10);

    expect(state.resources.cash).toBeCloseTo(15 + 19.2 + 5, 9);
    expect(state.resources.leads).toBeCloseTo(10 - 2.4, 9);
    expect(state.resources.credits).toBeCloseTo(100 + 10 - 12, 9);
    expect(state.workers[0].skills.clientWork.xp).toBeCloseTo(10, 9);
  });

  it("stops when Leads run out", () => {
    const state = unlocked("clientWork");
    state.resources.leads = 0.1;
    state.resources.credits = 100;

    step(state, 10);

    expect(state.resources.cash).toBeCloseTo(15 + 0.8 + 5, 9);
    expect(state.resources.leads).toBeCloseTo(0, 9);
    expect(state.resources.credits).toBeCloseTo(100 + 10 - 0.5, 9);
    expect(state.workers[0].skills.clientWork.xp).toBeCloseTo(10 * (0.8 / 19.2), 9);
  });

  it("caps a tick when Credits are short", () => {
    const state = unlocked("clientWork");
    state.resources.leads = 10;
    state.resources.credits = 0;

    step(state, 1);

    expect(state.resources.cash).toBeCloseTo(15 + 1.6 + 0.5, 9);
    expect(state.resources.leads).toBeCloseTo(10 - 0.2, 9);
    expect(state.resources.credits).toBeCloseTo(0, 9);
    expect(state.workers[0].skills.clientWork.xp).toBeCloseTo(1.6 / 1.92, 9);
  });

  it("never leaves Leads or Credits below zero", () => {
    const state = unlocked("clientWork");
    state.resources.leads = 0.01;
    state.resources.credits = 0.1;

    step(state, 10);

    expect(state.resources.leads).toBeGreaterThanOrEqual(0);
    expect(state.resources.credits).toBeGreaterThanOrEqual(0);
  });

  it("shows Cash production and the Leads and Credits demand", () => {
    const state = unlocked("clientWork");
    expect(resourceRates(state).cash).toBeCloseTo(1.92 + 0.5, 9);
    const net = resourceNetRates(state);
    expect(net.leads).toBeCloseTo(-0.24, 9);
    expect(net.credits).toBeCloseTo(1 - 1.2, 9);
  });
});
