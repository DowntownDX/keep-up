import { OFFLINE_CAP_SECONDS, TICK_SECONDS } from "./config";
import { applyAutomation } from "./automations";
import { creditRate } from "./rates";
import type { GameState } from "./state";
import { audienceFunnelRate, passiveCashRate } from "./ventures";
import { shipCompletedVentures, workWorker } from "./work";

const TICK_EPSILON = 1e-9;

/**
 * Advance the game by `seconds`. Time is passed in; the engine never reads a
 * clock. Only whole ticks run; the unused fraction is banked in
 * state.pendingSeconds and applied on a later call.
 */
export function step(state: GameState, seconds: number): GameState {
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new RangeError("seconds must be a finite number of zero or more");
  }
  state.pendingSeconds += seconds;
  while (state.pendingSeconds + TICK_EPSILON >= TICK_SECONDS) {
    tick(state);
    state.pendingSeconds -= TICK_SECONDS;
  }
  if (state.pendingSeconds < 0) state.pendingSeconds = 0;
  return state;
}

/**
 * Catch up after time away. Elapsed time is capped at eight hours and advanced
 * through the normal fixed ticks. Non-finite or non-positive time is ignored.
 */
export function stepOffline(state: GameState, elapsedSeconds: number): GameState {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return state;
  return step(state, Math.min(elapsedSeconds, OFFLINE_CAP_SECONDS));
}

function tick(state: GameState): void {
  // The clock moves before production, so a release landing on this tick
  // already sets Edge for it.
  state.elapsedSeconds += TICK_SECONDS;
  state.resources.credits += creditRate(state) * TICK_SECONDS;
  state.resources.cash += passiveCashRate(state) * TICK_SECONDS;
  state.resources.leads += audienceFunnelRate(state) * TICK_SECONDS;
  for (const worker of state.workers) {
    workWorker(state, worker, TICK_SECONDS);
  }
  for (const worker of state.workers) {
    applyAutomation(state, worker, TICK_SECONDS);
  }
  shipCompletedVentures(state);
}
