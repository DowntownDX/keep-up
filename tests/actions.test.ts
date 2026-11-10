import { describe, expect, it } from "vitest";
import { addAgent, assignActivity, nextAgentCost } from "../src/engine/actions";
import type { AgentKind } from "../src/engine/config";
import { createInitialState } from "../src/engine/state";

describe("assignActivity", () => {
  it("puts a worker on an implemented activity and can take it off", () => {
    const state = createInitialState();
    expect(assignActivity(state, "you", "content")).toBe(true);
    expect(state.workers[0].activity).toBe("content");
    expect(assignActivity(state, "you", null)).toBe(true);
    expect(state.workers[0].activity).toBeNull();
  });

  it("rejects an unknown worker", () => {
    const state = createInitialState();
    expect(assignActivity(state, "nobody", "content")).toBe(false);
  });

  it("rejects an activity that is not implemented yet", () => {
    const state = createInitialState();
    expect(assignActivity(state, "you", "findClients")).toBe(false);
    expect(state.workers[0].activity).toBeNull();
  });
});

describe("addAgent", () => {
  it("charges the first seat 40 Cash and the next 800", () => {
    const state = createInitialState();
    state.resources.cash = 1_000;
    expect(nextAgentCost(state)).toBe(40);
    expect(addAgent(state, "creator")).toBe(true);
    expect(state.resources.cash).toBe(960);
    expect(nextAgentCost(state)).toBe(800);
  });

  it("refuses a hire it cannot afford and leaves Cash alone", () => {
    const state = createInitialState();
    expect(state.resources.cash).toBe(15);
    expect(addAgent(state, "creator")).toBe(false);
    expect(state.resources.cash).toBe(15);
    expect(state.workers).toHaveLength(1);
  });

  it("hires each specialist once", () => {
    const state = createInitialState();
    state.resources.cash = 1_000;
    expect(addAgent(state, "creator")).toBe(true);
    expect(addAgent(state, "creator")).toBe(false);
    expect(state.workers).toHaveLength(2);
  });

  it("rejects an unknown agent kind", () => {
    const state = createInitialState();
    state.resources.cash = 1_000;
    expect(addAgent(state, "wizard" as AgentKind)).toBe(false);
  });

  it("stops at five agents and reports no next seat", () => {
    const state = createInitialState();
    state.resources.cash = 2_000_000;
    const kinds: AgentKind[] = ["assistant", "creator", "scout", "tutor", "builder"];
    for (const kind of kinds) {
      expect(addAgent(state, kind)).toBe(true);
    }
    expect(state.workers).toHaveLength(6);
    expect(nextAgentCost(state)).toBeNull();
    expect(addAgent(state, "creator")).toBe(false);
  });
});
