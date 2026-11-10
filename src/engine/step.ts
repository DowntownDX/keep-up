import {
  ACTIVITIES,
  BUILD_CREDITS_PER_POINT,
  BUILD_KNOWHOW_PER_POINT,
  OFFLINE_CAP_SECONDS,
  TICK_SECONDS,
} from "./config";
import { creditRate, workerRate, xpToNextLevel } from "./rates";
import type { GameState, Skill, Worker } from "./state";
import { buildPointsRequired, hasWon, passiveCashRate } from "./ventures";

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
  state.resources.credits += creditRate(state) * TICK_SECONDS;
  state.resources.cash += passiveCashRate(state) * TICK_SECONDS;
  for (const worker of state.workers) {
    const activity = worker.activity;
    if (!activity) continue;
    const config = ACTIVITIES[activity];
    if (!config) continue;
    if (activity === "build") {
      workOnVenture(state, worker);
      continue;
    }
    if (config.resource) {
      state.resources[config.resource] += workerRate(worker, activity) * TICK_SECONDS;
    }
    earnXp(worker.skills[activity], TICK_SECONDS);
  }
  shipCompletedVentures(state);
}

/**
 * One tick of building. Output is capped by the resources it burns, so a
 * starved builder makes partial or no progress.
 */
function workOnVenture(state: GameState, worker: Worker): void {
  if (hasWon(state)) return;
  const desired = workerRate(worker, "build") * TICK_SECONDS;
  if (desired <= 0) return;

  const creditLimit = state.resources.credits / BUILD_CREDITS_PER_POINT;
  const knowHowLimit = state.resources.knowHow / BUILD_KNOWHOW_PER_POINT;
  const points = Math.min(desired, creditLimit, knowHowLimit);
  if (points <= 0) return;

  state.resources.credits = Math.max(
    0,
    state.resources.credits - points * BUILD_CREDITS_PER_POINT,
  );
  state.resources.knowHow = Math.max(
    0,
    state.resources.knowHow - points * BUILD_KNOWHOW_PER_POINT,
  );
  state.ventureProgress += points;
  earnXp(worker.skills.build, TICK_SECONDS * (points / desired));
}

/** Runs once per tick, after every worker has contributed, so overflow carries. */
function shipCompletedVentures(state: GameState): void {
  while (!hasWon(state) && state.ventureProgress >= buildPointsRequired(state.venturesShipped)) {
    state.ventureProgress -= buildPointsRequired(state.venturesShipped);
    state.venturesShipped += 1;
  }
  if (hasWon(state)) state.ventureProgress = 0;
}

function earnXp(skill: Skill, xp: number): void {
  skill.xp += xp;
  while (skill.xp >= xpToNextLevel(skill.level)) {
    skill.xp -= xpToNextLevel(skill.level);
    skill.level += 1;
  }
}
