import { loadGame, serializeGame } from "../engine/save";
import { createInitialState, type GameState } from "../engine/state";
import { stepOffline } from "../engine/step";

export const SAVE_STORAGE_KEY = "keep-up.save";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Restore a stored save, applying offline time since it was written. */
export function restoreGame(raw: string | null, now: number): GameState {
  if (!raw) return createInitialState();
  const loaded = loadGame(raw);
  if (!loaded) return createInitialState();
  if (loaded.savedAt <= 0) return loaded.state;
  return stepOffline(loaded.state, (now - loaded.savedAt) / 1000);
}

export function loadStoredGame(storage: StorageLike, now: number): GameState {
  return restoreGame(storage.getItem(SAVE_STORAGE_KEY), now);
}

export function saveStoredGame(storage: StorageLike, state: GameState, now: number): boolean {
  try {
    storage.setItem(SAVE_STORAGE_KEY, serializeGame(state, now));
    return true;
  } catch {
    return false;
  }
}
