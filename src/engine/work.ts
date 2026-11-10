import {
  ACTIVITIES,
  BUILD_CREDITS_PER_POINT,
  BUILD_KNOWHOW_PER_POINT,
  CLIENT_CASH_PER_LEAD,
  CLIENT_CREDITS_PER_LEAD,
} from "./config";
import { workerRate, xpToNextLevel } from "./rates";
import type { GameState, Skill, Worker } from "./state";
import { buildPointsRequired, hasWon, isVentureGated } from "./ventures";

/**
 * Apply `seconds` of one worker's current activity. Returns false when the
 * worker is idle, the activity is not implemented, or nothing could be done.
 */
export function workWorker(state: GameState, worker: Worker, seconds: number): boolean {
  const activity = worker.activity;
  if (!activity) return false;
  const config = ACTIVITIES[activity];
  if (!config) return false;

  if (activity === "build") {
    const applied = applyBuild(state, workerRate(state, worker, "build"), seconds);
    if (!applied) return false;
    earnXp(worker.skills.build, seconds * (applied.points / applied.desired));
    return true;
  }

  if (activity === "clientWork") {
    const applied = applyClientWork(state, workerRate(state, worker, "clientWork"), seconds);
    if (!applied) return false;
    earnXp(worker.skills.clientWork, seconds * (applied.cash / applied.desiredCash));
    return true;
  }

  if (config.resource) {
    state.resources[config.resource] += workerRate(state, worker, activity) * seconds;
  }
  earnXp(worker.skills[activity], seconds);
  return true;
}

export interface BuildApplication {
  points: number;
  desired: number;
}

/**
 * Build output is capped by the resources it burns, so a starved builder makes
 * partial or no progress. A gated venture blocks the work before any burn.
 */
export function applyBuild(
  state: GameState,
  rate: number,
  seconds: number,
): BuildApplication | null {
  if (hasWon(state) || isVentureGated(state)) return null;
  const desired = rate * seconds;
  if (desired <= 0) return null;

  const creditLimit = state.resources.credits / BUILD_CREDITS_PER_POINT;
  const knowHowLimit = state.resources.knowHow / BUILD_KNOWHOW_PER_POINT;
  const points = Math.min(desired, creditLimit, knowHowLimit);
  if (points <= 0) return null;

  state.resources.credits = Math.max(
    0,
    state.resources.credits - points * BUILD_CREDITS_PER_POINT,
  );
  state.resources.knowHow = Math.max(
    0,
    state.resources.knowHow - points * BUILD_KNOWHOW_PER_POINT,
  );
  state.ventureProgress += points;
  return { points, desired };
}

export interface ClientApplication {
  cash: number;
  desiredCash: number;
}

/**
 * Client work turns Leads into Cash. Credits and Leads both cap the work, so a
 * worker stops when either stock runs out.
 */
export function applyClientWork(
  state: GameState,
  rate: number,
  seconds: number,
): ClientApplication | null {
  const desiredHandled = rate * seconds;
  if (desiredHandled <= 0) return null;

  const desiredCash = desiredHandled * CLIENT_CASH_PER_LEAD;
  const leadLimit = state.resources.leads * CLIENT_CASH_PER_LEAD;
  const creditLimit = (state.resources.credits / CLIENT_CREDITS_PER_LEAD) * CLIENT_CASH_PER_LEAD;
  const cash = Math.min(desiredCash, leadLimit, creditLimit);
  if (cash <= 0) return null;

  const handled = cash / CLIENT_CASH_PER_LEAD;
  state.resources.cash += cash;
  state.resources.leads = Math.max(0, state.resources.leads - handled);
  state.resources.credits = Math.max(
    0,
    state.resources.credits - handled * CLIENT_CREDITS_PER_LEAD,
  );
  return { cash, desiredCash };
}

/** Runs once after all workers and automations, so overflow carries. */
export function shipCompletedVentures(state: GameState): void {
  while (!hasWon(state)) {
    if (isVentureGated(state)) break;
    const required = buildPointsRequired(state.venturesShipped);
    if (state.ventureProgress < required) break;
    state.ventureProgress -= required;
    state.venturesShipped += 1;
  }
  if (isVentureGated(state) || hasWon(state)) state.ventureProgress = 0;
}

function earnXp(skill: Skill, xp: number): void {
  skill.xp += xp;
  while (skill.xp >= xpToNextLevel(skill.level)) {
    skill.xp -= xpToNextLevel(skill.level);
    skill.level += 1;
  }
}
