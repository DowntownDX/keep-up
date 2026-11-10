import { describe, expect, it } from "vitest";
import { serializeGame } from "../src/engine/save";
import { createInitialState, type GameState } from "../src/engine/state";
import { stepOffline } from "../src/engine/step";
import {
  clearStoredGame,
  loadStoredGame,
  loadStoredGameWithReport,
  restoreGame,
  restoreGameWithReport,
  SAVE_STORAGE_KEY,
  saveStoredGame,
  type StorageLike,
} from "../src/ui/storage";

class FakeStorage implements StorageLike {
  private readonly data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}

function sampleState(): GameState {
  const state = createInitialState();
  state.venturesShipped = 1;
  state.workers[0].activity = "content";
  state.resources.followers = 50;
  return state;
}

describe("restoreGame", () => {
  it("starts fresh when there is no save", () => {
    expect(restoreGame(null, 1_000)).toEqual(createInitialState());
  });

  it("round-trips a save written now", () => {
    const state = sampleState();
    const raw = serializeGame(state, 1_700_000_000_000);
    expect(restoreGame(raw, 1_700_000_000_000)).toEqual(state);
  });

  it("applies one hour of offline progress", () => {
    const state = sampleState();
    const savedAt = 1_700_000_000_000;
    const raw = serializeGame(state, savedAt);

    const expected = stepOffline(structuredClone(state), 3_600);
    expect(restoreGame(raw, savedAt + 3_600_000)).toEqual(expected);
  });

  it("caps a long absence at eight hours", () => {
    const state = sampleState();
    const savedAt = 1_700_000_000_000;
    const raw = serializeGame(state, savedAt);

    const nineHours = restoreGame(raw, savedAt + 9 * 3_600_000);
    const eightHours = restoreGame(raw, savedAt + 8 * 3_600_000);
    expect(nineHours).toEqual(eightHours);
  });

  it("does not rewind when the clock is behind the save", () => {
    const state = sampleState();
    const savedAt = 1_700_000_000_000;
    const raw = serializeGame(state, savedAt);
    expect(restoreGame(raw, savedAt - 60_000)).toEqual(state);
  });

  it("treats a zero timestamp as no offline time", () => {
    const state = sampleState();
    const raw = serializeGame(state, 0);
    expect(restoreGame(raw, 9_999_999_999_999)).toEqual(state);
  });

  it("starts fresh when the save is corrupt", () => {
    expect(restoreGame("{", 1_000)).toEqual(createInitialState());
  });
});

describe("offline report", () => {
  it("reports one hour of elapsed time and its gains", () => {
    const state = sampleState();
    const savedAt = 1_700_000_000_000;
    const raw = serializeGame(state, savedAt);

    const result = restoreGameWithReport(raw, savedAt + 3_600_000);

    expect(result.summary?.elapsedSeconds).toBe(3_600);
    expect(result.summary?.capped).toBe(false);
    expect(result.summary?.venturesShipped).toBe(0);
    expect(
      result.summary?.gains.some((gain) => gain.resource === "followers" && gain.amount > 0),
    ).toBe(true);
    expect(result.state).toEqual(stepOffline(structuredClone(state), 3_600));
  });

  it("flags a gap over the cap and reports eight hours", () => {
    const state = sampleState();
    const savedAt = 1_700_000_000_000;
    const raw = serializeGame(state, savedAt);

    const result = restoreGameWithReport(raw, savedAt + 9 * 3_600_000);

    expect(result.summary?.elapsedSeconds).toBe(8 * 3_600);
    expect(result.summary?.capped).toBe(true);
  });

  it("has no report without a positive elapsed time", () => {
    const state = sampleState();
    const savedAt = 1_700_000_000_000;
    const raw = serializeGame(state, savedAt);

    expect(restoreGameWithReport(null, savedAt).summary).toBeNull();
    expect(restoreGameWithReport("{", savedAt).summary).toBeNull();
    expect(restoreGameWithReport(serializeGame(state, 0), savedAt).summary).toBeNull();
    expect(restoreGameWithReport(raw, savedAt).summary).toBeNull();
    expect(restoreGameWithReport(raw, savedAt - 60_000).summary).toBeNull();
    expect(restoreGameWithReport(raw, savedAt + 500).summary).toBeNull();
  });
});

describe("storage helpers", () => {
  it("saves and loads through the storage key", () => {
    const storage = new FakeStorage();
    const state = sampleState();
    const now = 1_700_000_000_000;

    expect(saveStoredGame(storage, state, now)).toBe(true);
    expect(storage.getItem(SAVE_STORAGE_KEY)).not.toBeNull();
    expect(loadStoredGame(storage, now)).toEqual(state);
  });

  it("loads the report alongside the state", () => {
    const storage = new FakeStorage();
    const state = sampleState();
    const now = 1_700_000_000_000;
    saveStoredGame(storage, state, now);

    const result = loadStoredGameWithReport(storage, now + 3_600_000);

    expect(result.summary?.elapsedSeconds).toBe(3_600);
    expect(result.state).toEqual(stepOffline(structuredClone(state), 3_600));
  });

  it("starts fresh when the key is absent", () => {
    expect(loadStoredGame(new FakeStorage(), 1_000)).toEqual(createInitialState());
  });

  it("clears the save key", () => {
    const storage = new FakeStorage();
    saveStoredGame(storage, sampleState(), 1_700_000_000_000);

    expect(clearStoredGame(storage)).toBe(true);
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBeNull();
    expect(loadStoredGame(storage, 1_700_000_000_000)).toEqual(createInitialState());
  });

  it("reports a failed write and a failed clear", () => {
    const storage: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("locked");
      },
    };
    expect(saveStoredGame(storage, createInitialState(), 1_000)).toBe(false);
    expect(clearStoredGame(storage)).toBe(false);
  });
});
