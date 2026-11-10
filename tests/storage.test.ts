import { describe, expect, it } from "vitest";
import { serializeGame } from "../src/engine/save";
import { createInitialState, type GameState } from "../src/engine/state";
import { stepOffline } from "../src/engine/step";
import {
  loadStoredGame,
  restoreGame,
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

describe("storage helpers", () => {
  it("saves and loads through the storage key", () => {
    const storage = new FakeStorage();
    const state = sampleState();
    const now = 1_700_000_000_000;

    expect(saveStoredGame(storage, state, now)).toBe(true);
    expect(storage.getItem(SAVE_STORAGE_KEY)).not.toBeNull();
    expect(loadStoredGame(storage, now)).toEqual(state);
  });

  it("starts fresh when the key is absent", () => {
    expect(loadStoredGame(new FakeStorage(), 1_000)).toEqual(createInitialState());
  });

  it("reports a failed write", () => {
    const storage: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(saveStoredGame(storage, createInitialState(), 1_000)).toBe(false);
  });
});
