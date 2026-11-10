import { describe, expect, it } from "vitest";
import { assignActivity } from "../src/engine/actions";
import { recordAutomation } from "../src/engine/automations";
import { resourceRates } from "../src/engine/rates";
import { createInitialState, createWorker, type GameState } from "../src/engine/state";
import { step } from "../src/engine/step";

function agentGame(kind: "creator" | "builder" | "assistant"): GameState {
  const state = createInitialState();
  state.venturesShipped = 2;
  state.workers.push(createWorker("agent-1", kind));
  state.nextAgentNumber = 2;
  state.resources.credits = 1_000;
  state.resources.knowHow = 1_000;
  return state;
}

describe("recording", () => {
  it("snapshots 50% of the agent's current output", () => {
    const state = agentGame("creator");
    assignActivity(state, "agent-1", "content");

    expect(recordAutomation(state, "agent-1")).toBe(true);

    expect(state.workers[1].automation).toEqual({ activity: "content", rate: 0.8 });
  });

  it("rejects You, an idle agent, an unknown id and a locked system", () => {
    const locked = createInitialState();
    locked.venturesShipped = 1;
    locked.workers.push(createWorker("agent-1", "creator"));
    locked.nextAgentNumber = 2;
    assignActivity(locked, "agent-1", "content");
    expect(recordAutomation(locked, "agent-1")).toBe(false);

    const state = agentGame("creator");
    expect(recordAutomation(state, "you")).toBe(false);
    expect(recordAutomation(state, "agent-1")).toBe(false);
    expect(recordAutomation(state, "nobody")).toBe(false);
  });

  it("replaces the snapshot when re-recorded", () => {
    const state = agentGame("creator");
    assignActivity(state, "agent-1", "content");
    recordAutomation(state, "agent-1");
    assignActivity(state, "agent-1", "learn");

    expect(recordAutomation(state, "agent-1")).toBe(true);
    expect(state.workers[1].automation).toEqual({ activity: "learn", rate: 0.1 });
  });
});

describe("running", () => {
  it("keeps producing after the worker changes activity, with no XP", () => {
    const state = agentGame("creator");
    assignActivity(state, "agent-1", "content");
    state.workers[1].skills.content.xp = 2;
    recordAutomation(state, "agent-1");
    assignActivity(state, "agent-1", "dayJob");

    step(state, 10);

    expect(state.resources.followers).toBeCloseTo(8, 9);
    expect(state.workers[1].skills.content.xp).toBeCloseTo(2, 9);
    expect(resourceRates(state).followers).toBeCloseTo(0.8, 9);
  });

  it("stays fixed when later upgrades would raise the live rate", () => {
    const state = agentGame("creator");
    assignActivity(state, "agent-1", "content");
    recordAutomation(state, "agent-1");
    assignActivity(state, "agent-1", null);
    state.promptLevel = 5;
    state.skillsLevel = 5;

    step(state, 10);

    expect(state.resources.followers).toBeCloseTo(8, 9);
  });

  it("burns stock for a build automation", () => {
    const state = agentGame("builder");
    assignActivity(state, "agent-1", "build");
    recordAutomation(state, "agent-1");
    assignActivity(state, "agent-1", null);

    step(state, 10);

    expect(state.ventureProgress).toBeCloseTo(8, 9);
    expect(state.resources.credits).toBeCloseTo(1_002, 9);
    expect(state.resources.knowHow).toBeCloseTo(998.4, 9);
    expect(state.workers[1].skills.build.xp).toBe(0);
  });

  it("burns Leads and Credits for a client-work automation", () => {
    const state = agentGame("assistant");
    state.resources.leads = 100;
    state.resources.credits = 100;
    assignActivity(state, "agent-1", "clientWork");
    recordAutomation(state, "agent-1");
    assignActivity(state, "agent-1", null);

    step(state, 10);

    expect(state.resources.cash).toBeCloseTo(15 + 20 + 12.8, 9);
    expect(state.resources.leads).toBeCloseTo(98.4, 9);
    expect(state.resources.credits).toBeCloseTo(102, 9);
    expect(state.workers[1].skills.clientWork.xp).toBe(0);
  });
});

describe("Follower gates", () => {
  it("blocks a worker build and its burn below the count", () => {
    const state = createInitialState();
    state.venturesShipped = 5;
    assignActivity(state, "you", "build");

    step(state, 10);

    expect(state.ventureProgress).toBe(0);
    expect(state.resources.credits).toBeCloseTo(30, 9);
    expect(state.resources.knowHow).toBe(5);
  });

  it("releases the gate at 5,000 Followers", () => {
    const state = createInitialState();
    state.venturesShipped = 5;
    state.resources.followers = 5_000;
    assignActivity(state, "you", "build");

    step(state, 10);

    expect(state.ventureProgress).toBeCloseTo(12, 9);
  });

  it("discards overflow that lands on a gated venture", () => {
    const state = createInitialState();
    state.venturesShipped = 4;
    state.ventureProgress = 37_499;
    assignActivity(state, "you", "build");

    step(state, 1);

    expect(state.venturesShipped).toBe(5);
    expect(state.ventureProgress).toBe(0);
  });

  it("keeps a gated build automation inert", () => {
    const state = agentGame("builder");
    state.venturesShipped = 5;
    state.workers[1].activity = "build";
    recordAutomation(state, "agent-1");
    assignActivity(state, "agent-1", null);
    const credits = state.resources.credits;
    const knowHow = state.resources.knowHow;

    step(state, 10);

    expect(state.ventureProgress).toBe(0);
    expect(state.resources.credits).toBeCloseTo(credits + 10, 9);
    expect(state.resources.knowHow).toBeCloseTo(knowHow, 9);
  });
});

describe("audience funnel", () => {
  it("stays off until venture 3 and then makes Leads from Followers", () => {
    const locked = createInitialState();
    locked.venturesShipped = 2;
    locked.resources.followers = 4_000;
    step(locked, 10);
    expect(locked.resources.leads).toBe(0);

    const open = createInitialState();
    open.venturesShipped = 3;
    open.resources.followers = 4_000;
    step(open, 10);
    expect(open.resources.leads).toBeCloseTo(20, 9);
    expect(open.resources.followers).toBe(4_000);
    expect(resourceRates(open).leads).toBeCloseTo(2, 9);
  });
});
