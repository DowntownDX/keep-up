import {
  ACTIVITIES,
  BUILD_CREDITS_PER_POINT,
  BUILD_KNOWHOW_PER_POINT,
  CLIENT_CASH_PER_LEAD,
  CLIENT_CREDITS_PER_LEAD,
} from "./config";
import { workerRate, xpToNextLevel } from "./rates";
import type { GameState, Skill, Worker } from "./state";
import { buildPointsRequired, hasWon } from "./ventures";

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
    return workOnVenture(state, worker, seconds);
  }

  if (activity === "clientWork") {
    return workClientWork(state, worker, seconds);
  }

  if (config.resource) {
    state.resources[config.resource] += workerRate(state, worker, activity) * seconds;
  }
  earnXp(worker.skills[activity], seconds);
  return true;
}

/**
 * Build output is capped by the resources it burns, so a starved builder makes
 * partial or no progress. XP follows the fraction of the requested work done.
 */
function workOnVenture(state: GameState, worker: Worker, seconds: number): boolean {
  if (hasWon(state)) return false;
  const desired = workerRate(state, worker, "build") * seconds;
  if (desired <= 0) return false;

  const creditLimit = state.resources.credits / BUILD_CREDITS_PER_POINT;
  const knowHowLimit = state.resources.knowHow / BUILD_KNOWHOW_PER_POINT;
  const points = Math.min(desired, creditLimit, knowHowLimit);
  if (points <= 0) return false;

  state.resources.credits = Math.max(
    0,
    state.resources.credits - points * BUILD_CREDITS_PER_POINT,
  );
  state.resources.knowHow = Math.max(
    0,
    state.resources.knowHow - points * BUILD_KNOWHOW_PER_POINT,
  );
  state.ventureProgress += points;
  earnXp(worker.skills.build, seconds * (points / desired));
  return true;
}

/**
 * Client work turns Leads into Cash. Credits and Leads both cap the work, so a
 * worker stops when either stock runs out. XP follows the fraction completed.
 */
function workClientWork(state: GameState, worker: Worker, seconds: number): boolean {
  const desiredHandled = workerRate(state, worker, "clientWork") * seconds;
  if (desiredHandled <= 0) return false;

  const desiredCash = desiredHandled * CLIENT_CASH_PER_LEAD;
  const leadLimit = state.resources.leads * CLIENT_CASH_PER_LEAD;
  const creditLimit = (state.resources.credits / CLIENT_CREDITS_PER_LEAD) * CLIENT_CASH_PER_LEAD;
  const cash = Math.min(desiredCash, leadLimit, creditLimit);
  if (cash <= 0) return false;

  const handled = cash / CLIENT_CASH_PER_LEAD;
  state.resources.cash += cash;
  state.resources.leads = Math.max(0, state.resources.leads - handled);
  state.resources.credits = Math.max(
    0,
    state.resources.credits - handled * CLIENT_CREDITS_PER_LEAD,
  );
  earnXp(worker.skills.clientWork, seconds * (cash / desiredCash));
  return true;
}

/** Runs once after all workers have contributed, so overflow carries. */
export function shipCompletedVentures(state: GameState): void {
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
