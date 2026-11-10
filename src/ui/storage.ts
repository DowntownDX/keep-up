import { OFFLINE_CAP_SECONDS, RESOURCE_IDS, type ResourceId } from "../engine/config";
import { loadGame, serializeGame } from "../engine/save";
import { createInitialState, type GameState } from "../engine/state";
import { stepOffline } from "../engine/step";

export const SAVE_STORAGE_KEY = "keep-up.save";

/** Ignore sub-second gaps; they have no whole tick to report. */
const MIN_SUMMARY_SECONDS = 1;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface OfflineGain {
  resource: ResourceId;
  amount: number;
}

export interface OfflineSummary {
  /** Game seconds actually applied, after the cap. */
  elapsedSeconds: number;
  /** Whether the real gap was longer than the cap. */
  capped: boolean;
  gains: OfflineGain[];
  venturesShipped: number;
}

export interface RestoreResult {
  state: GameState;
  summary: OfflineSummary | null;
}

/** Restore a save and report what the offline catch-up produced. */
export function restoreGameWithReport(raw: string | null, now: number): RestoreResult {
  if (!raw) return { state: createInitialState(), summary: null };
  const loaded = loadGame(raw);
  if (!loaded) return { state: createInitialState(), summary: null };
  if (loaded.savedAt <= 0) return { state: loaded.state, summary: null };

  const elapsed = (now - loaded.savedAt) / 1000;
  if (!Number.isFinite(elapsed) || elapsed <= 0) {
    return { state: loaded.state, summary: null };
  }

  const elapsedSeconds = Math.min(elapsed, OFFLINE_CAP_SECONDS);
  const before = { ...loaded.state.resources };
  const venturesBefore = loaded.state.venturesShipped;
  const state = stepOffline(loaded.state, elapsedSeconds);

  if (elapsedSeconds < MIN_SUMMARY_SECONDS) {
    return { state, summary: null };
  }

  const gains: OfflineGain[] = [];
  for (const resource of RESOURCE_IDS) {
    const amount = state.resources[resource] - before[resource];
    if (amount > 0) gains.push({ resource, amount });
  }

  return {
    state,
    summary: {
      elapsedSeconds,
      capped: elapsed > OFFLINE_CAP_SECONDS,
      gains,
      venturesShipped: state.venturesShipped - venturesBefore,
    },
  };
}

/** Restore a stored save, applying offline time since it was written. */
export function restoreGame(raw: string | null, now: number): GameState {
  return restoreGameWithReport(raw, now).state;
}

export function loadStoredGameWithReport(storage: StorageLike, now: number): RestoreResult {
  return restoreGameWithReport(storage.getItem(SAVE_STORAGE_KEY), now);
}

export function loadStoredGame(storage: StorageLike, now: number): GameState {
  return loadStoredGameWithReport(storage, now).state;
}

export function saveStoredGame(storage: StorageLike, state: GameState, now: number): boolean {
  try {
    storage.setItem(SAVE_STORAGE_KEY, serializeGame(state, now));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredGame(storage: StorageLike): boolean {
  try {
    storage.removeItem(SAVE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
