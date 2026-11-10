import { describe, expect, it } from "vitest";
import type { ActivityId } from "../src/engine/config";
import { loadGame, SAVE_VERSION, serializeGame } from "../src/engine/save";
import { createInitialState, createWorker, type GameState } from "../src/engine/state";

const V1_SAVE = JSON.stringify({
  version: 1,
  state: {
    resources: { cash: 42.5, followers: 100, leads: 0, knowHow: 7.25, credits: 30 },
    workers: [
      {
        id: "you",
        kind: "you",
        activity: "content",
        skills: {
          dayJob: { level: 1, xp: 0 },
          content: { level: 2, xp: 5 },
          learn: { level: 1, xp: 0 },
          findClients: { level: 1, xp: 0 },
          clientWork: { level: 1, xp: 0 },
          build: { level: 1, xp: 0 },
        },
      },
    ],
    subscriptionTier: 1,
    nextAgentNumber: 1,
    pendingSeconds: 0.25,
  },
});

function payload(version: number, state: unknown): string {
  return JSON.stringify({ version, state });
}

function richState(): GameState {
  const state = createInitialState();
  state.resources = { cash: 123.5, followers: 250, leads: 4, knowHow: 33.5, credits: 77 };
  state.workers.push(createWorker("agent-1", "creator"));
  state.nextAgentNumber = 2;
  state.workers[0].activity = "content";
  state.workers[1].activity = "content";
  state.workers[0].skills.content = { level: 3, xp: 7.5 };
  state.workers[1].skills.content = { level: 2, xp: 1.25 };
  state.pendingSeconds = 0.4;
  state.venturesShipped = 2;
  state.ventureProgress = 12.5;
  return state;
}

describe("save format", () => {
  it("writes the current version and state", () => {
    expect(SAVE_VERSION).toBe(2);
    const parsed = JSON.parse(serializeGame(createInitialState())) as {
      version: number;
      state: GameState;
    };
    expect(parsed.version).toBe(SAVE_VERSION);
    expect(parsed.state.venturesShipped).toBe(0);
    expect(parsed.state.resources.cash).toBe(15);
  });

  it("reloads a rich state identically", () => {
    const state = richState();
    expect(loadGame(serializeGame(state))).toEqual(state);
  });
});

describe("migration", () => {
  it("loads a version 1 save and adds the venture fields", () => {
    const loaded = loadGame(V1_SAVE);
    if (loaded === null) throw new Error("version 1 save should load");

    expect(loaded.venturesShipped).toBe(0);
    expect(loaded.ventureProgress).toBe(0);
    expect(loaded.resources.cash).toBe(42.5);
    expect(loaded.workers[0].skills.content).toEqual({ level: 2, xp: 5 });
    expect(loaded.workers[0].activity).toBe("content");
    expect(loaded.pendingSeconds).toBe(0.25);
  });

  it("rejects versions with no migration path or a newer format", () => {
    const state = createInitialState();
    expect(loadGame(payload(0, state))).toBeNull();
    expect(loadGame(payload(99, state))).toBeNull();
  });
});

describe("invalid saves", () => {
  it("rejects broken JSON and non-object payloads", () => {
    expect(loadGame("{")).toBeNull();
    expect(loadGame("")).toBeNull();
    expect(loadGame("null")).toBeNull();
    expect(loadGame("[]")).toBeNull();
    expect(loadGame("123")).toBeNull();
    expect(loadGame('"text"')).toBeNull();
  });

  it("rejects a missing or non-numeric version", () => {
    const state = createInitialState();
    expect(loadGame(JSON.stringify({ state }))).toBeNull();
    expect(loadGame(JSON.stringify({ version: "2", state }))).toBeNull();
  });

  it("rejects negative or non-numeric resources", () => {
    const negative = structuredClone(createInitialState());
    negative.resources.cash = -1;
    expect(loadGame(payload(SAVE_VERSION, negative))).toBeNull();

    const missing = structuredClone(createInitialState()) as unknown as Record<string, unknown>;
    const resources = missing.resources as Record<string, unknown>;
    resources.cash = null;
    expect(loadGame(payload(SAVE_VERSION, missing))).toBeNull();
  });

  it("rejects a worker missing one of the six skills", () => {
    const state = structuredClone(createInitialState());
    const skills = state.workers[0].skills as Partial<
      Record<ActivityId, { level: number; xp: number }>
    >;
    delete skills.content;
    expect(loadGame(payload(SAVE_VERSION, state))).toBeNull();
  });

  it("rejects an unknown activity but accepts a not-yet-implemented one", () => {
    const bogus = structuredClone(createInitialState());
    bogus.workers[0].activity = "bogus" as ActivityId;
    expect(loadGame(payload(SAVE_VERSION, bogus))).toBeNull();

    const future = structuredClone(createInitialState());
    future.workers[0].activity = "findClients";
    const loaded = loadGame(payload(SAVE_VERSION, future));
    expect(loaded?.workers[0].activity).toBe("findClients");
  });

  it("rejects a pending remainder that would run for more than one tick", () => {
    const state = structuredClone(createInitialState());
    state.pendingSeconds = 1_000_000_000;
    expect(loadGame(payload(SAVE_VERSION, state))).toBeNull();

    state.pendingSeconds = 1;
    expect(loadGame(payload(SAVE_VERSION, state))).toBeNull();
  });

  it("rejects a stale next agent number", () => {
    const state = structuredClone(createInitialState());
    state.workers.push(createWorker("agent-1", "creator"));
    state.nextAgentNumber = 1;
    expect(loadGame(payload(SAVE_VERSION, state))).toBeNull();
  });

  it("rejects venture progress at or above the current requirement", () => {
    const state = structuredClone(createInitialState());
    state.venturesShipped = 1;
    state.ventureProgress = 300;
    expect(loadGame(payload(SAVE_VERSION, state))).toBeNull();

    state.ventureProgress = 299;
    expect(loadGame(payload(SAVE_VERSION, state))).not.toBeNull();
  });
});
