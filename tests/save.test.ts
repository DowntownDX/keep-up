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

const V2_SAVE = JSON.stringify({
  version: 2,
  state: {
    ...(JSON.parse(V1_SAVE) as { state: Record<string, unknown> }).state,
    venturesShipped: 1,
    ventureProgress: 12.5,
  },
});

const V3_SAVE = JSON.stringify({
  version: 3,
  savedAt: 1_700_000_000_000,
  state: (JSON.parse(V2_SAVE) as { state: Record<string, unknown> }).state,
});

function payload(version: number, state: unknown, savedAt?: unknown): string {
  const envelope: Record<string, unknown> = { version, state };
  if (savedAt !== undefined) envelope.savedAt = savedAt;
  return JSON.stringify(envelope);
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
  state.promptLevel = 3;
  state.skillsLevel = 2;
  return state;
}

describe("save format", () => {
  it("writes the current version, timestamp and state", () => {
    expect(SAVE_VERSION).toBe(4);
    const parsed = JSON.parse(serializeGame(createInitialState(), 1_700_000_000_000)) as {
      version: number;
      savedAt: number;
      state: GameState;
    };
    expect(parsed.version).toBe(SAVE_VERSION);
    expect(parsed.savedAt).toBe(1_700_000_000_000);
    expect(parsed.state.venturesShipped).toBe(0);
    expect(parsed.state.promptLevel).toBe(0);
    expect(parsed.state.resources.cash).toBe(15);
  });

  it("reloads a rich state identically", () => {
    const state = richState();
    const loaded = loadGame(serializeGame(state, 1_700_000_000_000));
    expect(loaded).toEqual({ state, savedAt: 1_700_000_000_000 });
  });

  it("rejects a bad timestamp when saving", () => {
    expect(() => serializeGame(createInitialState(), -1)).toThrow(RangeError);
    expect(() => serializeGame(createInitialState(), Number.NaN)).toThrow(RangeError);
  });
});

describe("migration", () => {
  it("loads a version 1 save through every migration", () => {
    const loaded = loadGame(V1_SAVE);
    if (loaded === null) throw new Error("version 1 save should load");

    expect(loaded.savedAt).toBe(0);
    expect(loaded.state.venturesShipped).toBe(0);
    expect(loaded.state.ventureProgress).toBe(0);
    expect(loaded.state.promptLevel).toBe(0);
    expect(loaded.state.skillsLevel).toBe(0);
    expect(loaded.state.resources.cash).toBe(42.5);
    expect(loaded.state.workers[0].skills.content).toEqual({ level: 2, xp: 5 });
    expect(loaded.state.workers[0].activity).toBe("content");
    expect(loaded.state.pendingSeconds).toBe(0.25);
  });

  it("loads a version 2 save and adds a zero timestamp", () => {
    const loaded = loadGame(V2_SAVE);
    if (loaded === null) throw new Error("version 2 save should load");

    expect(loaded.savedAt).toBe(0);
    expect(loaded.state.venturesShipped).toBe(1);
    expect(loaded.state.ventureProgress).toBe(12.5);
    expect(loaded.state.promptLevel).toBe(0);
    expect(loaded.state.skillsLevel).toBe(0);
  });

  it("loads a version 3 save and adds zero upgrade levels", () => {
    const loaded = loadGame(V3_SAVE);
    if (loaded === null) throw new Error("version 3 save should load");

    expect(loaded.savedAt).toBe(1_700_000_000_000);
    expect(loaded.state.venturesShipped).toBe(1);
    expect(loaded.state.promptLevel).toBe(0);
    expect(loaded.state.skillsLevel).toBe(0);
  });

  it("rejects versions with no migration path or a newer format", () => {
    const state = createInitialState();
    expect(loadGame(payload(0, state))).toBeNull();
    expect(loadGame(payload(99, state, 1_000))).toBeNull();
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
    expect(loadGame(JSON.stringify({ version: "4", state, savedAt: 1 }))).toBeNull();
  });

  it("rejects a missing, negative or non-numeric timestamp", () => {
    const state = createInitialState();
    expect(loadGame(payload(SAVE_VERSION, state))).toBeNull();
    expect(loadGame(payload(SAVE_VERSION, state, -1))).toBeNull();
    expect(loadGame(payload(SAVE_VERSION, state, "now"))).toBeNull();
  });

  it("rejects negative or non-numeric resources", () => {
    const negative = structuredClone(createInitialState());
    negative.resources.cash = -1;
    expect(loadGame(payload(SAVE_VERSION, negative, 1_000))).toBeNull();

    const missing = structuredClone(createInitialState()) as unknown as Record<string, unknown>;
    const resources = missing.resources as Record<string, unknown>;
    resources.cash = null;
    expect(loadGame(payload(SAVE_VERSION, missing, 1_000))).toBeNull();
  });

  it("rejects a worker missing one of the six skills", () => {
    const state = structuredClone(createInitialState());
    const skills = state.workers[0].skills as Partial<
      Record<ActivityId, { level: number; xp: number }>
    >;
    delete skills.content;
    expect(loadGame(payload(SAVE_VERSION, state, 1_000))).toBeNull();
  });

  it("rejects a locked activity, and accepts it once its venture opened", () => {
    const bogus = structuredClone(createInitialState());
    bogus.workers[0].activity = "bogus" as ActivityId;
    expect(loadGame(payload(SAVE_VERSION, bogus, 1_000))).toBeNull();

    const locked = structuredClone(createInitialState());
    locked.workers[0].activity = "findClients";
    expect(loadGame(payload(SAVE_VERSION, locked, 1_000))).toBeNull();

    const open = structuredClone(createInitialState());
    open.venturesShipped = 1;
    open.workers[0].activity = "findClients";
    const loaded = loadGame(payload(SAVE_VERSION, open, 1_000));
    expect(loaded?.state.workers[0].activity).toBe("findClients");
  });

  it("rejects negative or fractional upgrade levels", () => {
    const negative = structuredClone(createInitialState());
    negative.promptLevel = -1;
    expect(loadGame(payload(SAVE_VERSION, negative, 1_000))).toBeNull();

    const fractional = structuredClone(createInitialState());
    fractional.skillsLevel = 1.5;
    expect(loadGame(payload(SAVE_VERSION, fractional, 1_000))).toBeNull();
  });

  it("rejects a pending remainder that would run for more than one tick", () => {
    const state = structuredClone(createInitialState());
    state.pendingSeconds = 1_000_000_000;
    expect(loadGame(payload(SAVE_VERSION, state, 1_000))).toBeNull();

    state.pendingSeconds = 1;
    expect(loadGame(payload(SAVE_VERSION, state, 1_000))).toBeNull();
  });

  it("rejects a stale next agent number", () => {
    const state = structuredClone(createInitialState());
    state.workers.push(createWorker("agent-1", "creator"));
    state.nextAgentNumber = 1;
    expect(loadGame(payload(SAVE_VERSION, state, 1_000))).toBeNull();
  });

  it("rejects venture progress at or above the current requirement", () => {
    const state = structuredClone(createInitialState());
    state.venturesShipped = 1;
    state.ventureProgress = 300;
    expect(loadGame(payload(SAVE_VERSION, state, 1_000))).toBeNull();

    state.ventureProgress = 299;
    expect(loadGame(payload(SAVE_VERSION, state, 1_000))).not.toBeNull();
  });
});
