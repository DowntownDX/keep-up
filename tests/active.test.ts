import { describe, expect, it } from "vitest";
import { assignActivity, doItYourself } from "../src/engine/actions";
import { createInitialState, createWorker, type GameState } from "../src/engine/state";
import { step } from "../src/engine/step";

function gameWithYouOn(activity: "content" | "learn" | "dayJob" | "build"): GameState {
  const state = createInitialState();
  if (!assignActivity(state, "you", activity)) throw new Error(`could not assign ${activity}`);
  return state;
}

describe("doItYourself", () => {
  it("adds 1.5 seconds of the worker's activity", () => {
    const state = gameWithYouOn("content");

    expect(doItYourself(state, "you")).toBe(true);

    expect(state.resources.followers).toBeCloseTo(1.8, 9);
    expect(state.workers[0].skills.content.xp).toBeCloseTo(1.5, 9);
    expect(state.workers[0].skills.content.level).toBe(1);
    expect(state.resources.credits).toBe(20);
    expect(state.pendingSeconds).toBe(0);
  });

  it("works for learn and day job too", () => {
    const learn = gameWithYouOn("learn");
    doItYourself(learn, "you");
    expect(learn.resources.knowHow).toBeCloseTo(5.36, 9);

    const dayJob = gameWithYouOn("dayJob");
    doItYourself(dayJob, "you");
    expect(dayJob.resources.cash).toBeCloseTo(15 + 1.5 * 0.6 * 1.5, 9);
  });

  it("burns Credits and Know-how when building", () => {
    const state = gameWithYouOn("build");

    expect(doItYourself(state, "you")).toBe(true);

    expect(state.ventureProgress).toBeCloseTo(1.8, 9);
    expect(state.resources.credits).toBeCloseTo(18.2, 9);
    expect(state.resources.knowHow).toBeCloseTo(4.64, 9);
    expect(state.workers[0].skills.build.xp).toBeCloseTo(1.5, 9);
  });

  it("rejects an idle or unknown worker and a starved build", () => {
    const idle = createInitialState();
    expect(doItYourself(idle, "you")).toBe(false);
    expect(doItYourself(idle, "nobody")).toBe(false);

    const starved = gameWithYouOn("build");
    starved.resources.knowHow = 0;
    expect(doItYourself(starved, "you")).toBe(false);
    expect(starved.ventureProgress).toBe(0);
    expect(starved.resources.credits).toBe(20);
  });

  it("rejects building after all ten ventures have shipped", () => {
    const state = gameWithYouOn("build");
    state.venturesShipped = 10;

    expect(doItYourself(state, "you")).toBe(false);
    expect(state.ventureProgress).toBe(0);
    expect(state.resources.credits).toBe(20);
  });

  it("keeps the click's level for the whole 1.5 seconds", () => {
    const state = gameWithYouOn("content");
    state.workers[0].skills.content.xp = 14.5;

    doItYourself(state, "you");

    expect(state.resources.followers).toBeCloseTo(1.8, 9);
    expect(state.workers[0].skills.content.level).toBe(2);
    expect(state.workers[0].skills.content.xp).toBeCloseTo(1, 9);
  });

  it("ships a venture when the click completes it", () => {
    const state = gameWithYouOn("build");
    state.resources.credits = 1_000;
    state.resources.knowHow = 1_000;
    state.ventureProgress = 59;

    expect(doItYourself(state, "you")).toBe(true);

    expect(state.venturesShipped).toBe(1);
    expect(state.ventureProgress).toBeCloseTo(0.8, 9);
    expect(state.resources.cash).toBe(15);
  });

  it("pays no passive Cash or Credits trickle on a click", () => {
    const state = gameWithYouOn("content");
    state.venturesShipped = 1;

    doItYourself(state, "you");

    expect(state.resources.cash).toBe(15);
    expect(state.resources.credits).toBe(20);
  });
});

describe("shipping after a tick", () => {
  it("ships once after two builders, so overflow keeps both contributions", () => {
    const state = createInitialState();
    state.workers.push(createWorker("agent-1", "builder"));
    state.nextAgentNumber = 2;
    if (!assignActivity(state, "you", "build")) throw new Error("could not assign You");
    if (!assignActivity(state, "agent-1", "build")) throw new Error("could not assign builder");
    state.resources.credits = 1_000;
    state.resources.knowHow = 1_000;
    state.ventureProgress = 59;

    step(state, 1);

    expect(state.venturesShipped).toBe(1);
    expect(state.ventureProgress).toBeCloseTo(1.8, 9);
  });
});
