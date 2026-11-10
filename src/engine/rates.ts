import {
  ACTIVITIES,
  CREDITS_BASE_PER_SECOND,
  RESOURCE_IDS,
  SKILL_BONUS_PER_LEVEL,
  SPECIALTY_ACTIVITIES,
  SPECIALTY_MULTIPLIER,
  SUBSCRIPTION_TRICKLE_GROWTH,
  XP_BASE_SECONDS,
  XP_GROWTH,
  YOU_MULTIPLIER,
  type ActivityId,
  type ResourceId,
  type WorkerKind,
} from "./config";
import type { GameState, Worker } from "./state";

export function skillMultiplier(level: number): number {
  return 1 + SKILL_BONUS_PER_LEVEL * (level - 1);
}

export function specialtyMultiplier(kind: WorkerKind, activity: ActivityId): number {
  if (kind === "you") return YOU_MULTIPLIER;
  return SPECIALTY_ACTIVITIES[kind].includes(activity) ? SPECIALTY_MULTIPLIER : 1;
}

/** Output per second for one worker on one activity. */
export function workerRate(worker: Worker, activity: ActivityId): number {
  const config = ACTIVITIES[activity];
  if (!config) return 0;
  const skill = worker.skills[activity];
  return (
    config.basePerSecond * specialtyMultiplier(worker.kind, activity) * skillMultiplier(skill.level)
  );
}

export function creditRate(state: GameState): number {
  return CREDITS_BASE_PER_SECOND * SUBSCRIPTION_TRICKLE_GROWTH ** (state.subscriptionTier - 1);
}

/** Seconds of work needed to go from this level to the next. */
export function xpToNextLevel(level: number): number {
  return XP_BASE_SECONDS * XP_GROWTH ** (level - 1);
}

/** Total production per second, by resource. Used by the UI and the sim. */
export function resourceRates(state: GameState): Record<ResourceId, number> {
  const rates = Object.fromEntries(RESOURCE_IDS.map((id) => [id, 0])) as Record<
    ResourceId,
    number
  >;
  rates.credits = creditRate(state);
  for (const worker of state.workers) {
    const activity = worker.activity;
    if (!activity) continue;
    const config = ACTIVITIES[activity];
    if (!config?.resource) continue;
    rates[config.resource] += workerRate(worker, activity);
  }
  return rates;
}
