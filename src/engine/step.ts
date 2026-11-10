import { ACTIVITIES, TICK_SECONDS } from "./config";
import { creditRate, workerRate, xpToNextLevel } from "./rates";
import type { GameState, Skill } from "./state";

/**
 * Advance the game by `seconds`. Time is passed in; the engine never reads a
 * clock. Works in fixed ticks so a long step matches many short ones.
 */
export function step(state: GameState, seconds: number): GameState {
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new RangeError("seconds must be a finite number of zero or more");
  }
  let remaining = seconds;
  while (remaining > 0) {
    const dt = Math.min(TICK_SECONDS, remaining);
    tick(state, dt);
    remaining -= dt;
  }
  return state;
}

function tick(state: GameState, dt: number): void {
  state.resources.credits += creditRate(state) * dt;
  for (const worker of state.workers) {
    const activity = worker.activity;
    if (!activity) continue;
    const config = ACTIVITIES[activity];
    if (!config) continue;
    if (config.resource) {
      state.resources[config.resource] += workerRate(worker, activity) * dt;
    }
    earnXp(worker.skills[activity], dt);
  }
}

function earnXp(skill: Skill, xp: number): void {
  skill.xp += xp;
  while (skill.xp >= xpToNextLevel(skill.level)) {
    skill.xp -= xpToNextLevel(skill.level);
    skill.level += 1;
  }
}
