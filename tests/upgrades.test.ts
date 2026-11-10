import { describe, expect, it } from "vitest";
import { buyPrompt, buySkills } from "../src/engine/actions";
import {
  promptCost,
  promptMultiplier,
  skillsCost,
  skillsMultiplier,
  teamBonusMultiplier,
  workerRate,
} from "../src/engine/rates";
import { createInitialState, createWorker } from "../src/engine/state";

describe("upgrade costs", () => {
  it("grows the Prompt library 1.5x per level", () => {
    expect(promptCost(0)).toBe(25);
    expect(promptCost(1)).toBeCloseTo(37.5, 9);
    expect(promptCost(2)).toBeCloseTo(56.25, 9);
  });

  it("grows Skills 1.6x per level", () => {
    expect(skillsCost(0)).toBe(10);
    expect(skillsCost(1)).toBeCloseTo(16, 9);
    expect(skillsCost(2)).toBeCloseTo(25.6, 9);
  });
});

describe("multipliers", () => {
  it("applies Prompt levels to non-Cash output only", () => {
    const state = createInitialState();
    state.promptLevel = 2;
    expect(promptMultiplier(state, "content")).toBeCloseTo(1.16, 9);
    expect(promptMultiplier(state, "learn")).toBeCloseTo(1.16, 9);
    expect(promptMultiplier(state, "findClients")).toBeCloseTo(1.16, 9);
    expect(promptMultiplier(state, "build")).toBeCloseTo(1.16, 9);
    expect(promptMultiplier(state, "dayJob")).toBe(1);
    expect(promptMultiplier(state, "clientWork")).toBe(1);
  });

  it("applies Skills levels to non-Know-how output only", () => {
    const state = createInitialState();
    state.skillsLevel = 3;
    expect(skillsMultiplier(state, "dayJob")).toBeCloseTo(1.3, 9);
    expect(skillsMultiplier(state, "content")).toBeCloseTo(1.3, 9);
    expect(skillsMultiplier(state, "clientWork")).toBeCloseTo(1.3, 9);
    expect(skillsMultiplier(state, "build")).toBeCloseTo(1.3, 9);
    expect(skillsMultiplier(state, "learn")).toBe(1);
  });

  it("keys team bonuses by activity and ignores level 1", () => {
    const state = createInitialState();
    const assistant = createWorker("agent-1", "assistant");
    assistant.skills.dayJob.level = 3;
    assistant.skills.clientWork.level = 4;
    state.workers.push(assistant);

    expect(teamBonusMultiplier(state, "dayJob")).toBeCloseTo(1.01, 9);
    expect(teamBonusMultiplier(state, "clientWork")).toBeCloseTo(1.015, 9);
    expect(teamBonusMultiplier(state, "content")).toBe(1);
    expect(teamBonusMultiplier(state, "build")).toBe(1);
  });

  it("stacks Prompt, Skills, specialty and worker skill", () => {
    const state = createInitialState();
    state.promptLevel = 1;
    state.skillsLevel = 1;
    const you = createWorker("you", "you");
    you.skills.content.level = 2;

    expect(workerRate(state, you, "content")).toBeCloseTo(0.1 * 1.2 * 1.12 * 1.08 * 1.1, 9);
  });
});

describe("purchases", () => {
  it("buys a Prompt level with Cash and refuses when short", () => {
    const state = createInitialState();
    state.resources.cash = 25;
    expect(buyPrompt(state)).toBe(true);
    expect(state.promptLevel).toBe(1);
    expect(state.resources.cash).toBe(0);
    expect(buyPrompt(state)).toBe(false);
    expect(state.promptLevel).toBe(1);
  });

  it("buys a Skills level with Know-how and refuses when short", () => {
    const state = createInitialState();
    state.resources.knowHow = 10;
    expect(buySkills(state)).toBe(true);
    expect(state.skillsLevel).toBe(1);
    expect(state.resources.knowHow).toBe(0);
    expect(buySkills(state)).toBe(false);
    expect(state.skillsLevel).toBe(1);
  });
});
