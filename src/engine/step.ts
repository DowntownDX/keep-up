import { ACTIVITIES, TICK_SECONDS } from "./config";
import { creditRate, workerRate, xpToNextLevel } from "./rates";
import type { GameState, Skill } from "./state";

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

function tick(state: GameState): void {
  state.resources.credits += creditRate(state) * TICK_SECONDS;
  for (const worker of state.workers) {
    const activity = worker.activity;
    if (!activity) continue;
    const config = ACTIVITIES[activity];
    if (!config) continue;
    if (config.resource) {
      state.resources[config.resource] += workerRate(worker, activity) * TICK_SECONDS;
    }
    earnXp(worker.skills[activity], TICK_SECONDS);
  }
}

function earnXp(skill: Skill, xp: number): void {
  skill.xp += xp;
  while (skill.xp >= xpToNextLevel(skill.level)) {
    skill.xp -= xpToNextLevel(skill.level);
    skill.level += 1;
  }
}
