import { describe, expect, it } from "vitest";
import { WORKER_KINDS, type ActivityId, type WorkerKind } from "../src/engine/config";
import { createInitialState, createWorker } from "../src/engine/state";
import { step } from "../src/engine/step";
import { WORKER_MARKS } from "../src/ui/labels";
import { workerOutput, workerStalled, workerStarved } from "../src/ui/output";

function outputFor(activity: ActivityId | null, kind: WorkerKind = "you") {
  const state = createInitialState();
  const worker = createWorker("worker", kind);
  worker.activity = activity;
  return workerOutput(state, worker);
}

function expectOutput(
  activity: ActivityId,
  kind: WorkerKind,
  value: number,
  unit: string,
) {
  const output = outputFor(activity, kind);
  expect(output?.unit).toBe(unit);
  expect(output?.value).toBeCloseTo(value, 10);
}

describe("workerOutput", () => {
  it("returns null for an idle worker", () => {
    expect(outputFor(null)).toBeNull();
  });

  it("names the resource each activity produces", () => {
    expectOutput("content", "you", 0.12, "Followers/s");
    expectOutput("learn", "you", 0.24, "Know-how/s");
    expectOutput("findClients", "you", 0.12, "Leads/s");
    expectOutput("build", "you", 1.2, "pts/s");
  });

  it("measures client work in Leads handled, not Cash paid", () => {
    expectOutput("clientWork", "you", 0.24, "Leads/s");
  });

  it("includes Edge in the day job Cash rate", () => {
    expectOutput("dayJob", "you", 0.9, "Cash/s");
  });

  it("applies the specialist multiplier", () => {
    expectOutput("content", "creator", 0.16, "Followers/s");
  });
});

describe("WORKER_MARKS", () => {
  it("gives every kind a unique monogram", () => {
    const marks = WORKER_KINDS.map((kind) => WORKER_MARKS[kind]);
    expect(marks).toHaveLength(WORKER_KINDS.length);
    expect(new Set(marks).size).toBe(WORKER_KINDS.length);
  });
});

describe("workerStalled", () => {
  it("stalls client work with no leads and no lead supply", () => {
    const state = createInitialState();
    state.venturesShipped = 1;
    state.resources.leads = 0;
    const worker = state.workers[0];
    worker.activity = "clientWork";

    expect(workerStarved(state, worker)).toBe(true);
    expect(workerStalled(state, worker)).toBe(true);
  });

  it("keeps client work working when a scout supplies leads", () => {
    const state = createInitialState();
    state.venturesShipped = 1;
    state.resources.leads = 0;
    const worker = state.workers[0];
    worker.activity = "clientWork";
    const scout = createWorker("scout", "scout");
    scout.activity = "findClients";
    state.workers.push(scout);

    expect(workerStalled(state, worker)).toBe(false);
  });

  it("stalls a builder with no know-how supply", () => {
    const state = createInitialState();
    state.resources.credits = 0;
    state.resources.knowHow = 0;
    const builder = createWorker("builder", "builder");
    builder.activity = "build";

    expect(workerStalled(state, builder)).toBe(true);
  });

  it("keeps a builder working when a tutor supplies know-how", () => {
    const state = createInitialState();
    state.resources.credits = 0;
    state.resources.knowHow = 0;
    const builder = createWorker("builder", "builder");
    builder.activity = "build";
    const tutor = createWorker("tutor", "tutor");
    tutor.activity = "learn";
    state.workers.push(tutor);

    expect(workerStalled(state, builder)).toBe(false);
  });

  it("does not stall a builder whose know-how stock still covers the work", () => {
    const state = createInitialState();
    state.resources.credits = 0;
    state.resources.knowHow = 100;
    const builder = createWorker("builder", "builder");
    builder.activity = "build";
    state.workers.push(builder);

    expect(workerStalled(state, builder)).toBe(false);
    const before = state.ventureProgress;
    step(state, 1);
    expect(state.ventureProgress).toBeGreaterThan(before);
  });

  it("does not stall client work whose lead stock still covers the work", () => {
    const state = createInitialState();
    state.venturesShipped = 1;
    state.resources.credits = 0;
    state.resources.leads = 100;
    const worker = state.workers[0];
    worker.activity = "clientWork";

    expect(workerStalled(state, worker)).toBe(false);
    const before = state.resources.cash;
    step(state, 1);
    expect(state.resources.cash).toBeGreaterThan(before);
  });

  it("does not treat a producer with an empty stock as starved", () => {
    const state = createInitialState();
    state.resources.followers = 0;
    const worker = state.workers[0];
    worker.activity = "content";

    expect(workerStarved(state, worker)).toBe(false);
    expect(workerStalled(state, worker)).toBe(false);
  });
});
