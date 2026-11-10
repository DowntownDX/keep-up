import {
  ACTIVITIES,
  BUILD_CREDITS_PER_POINT,
  BUILD_KNOWHOW_PER_POINT,
  CLIENT_CASH_PER_LEAD,
  CLIENT_CREDITS_PER_LEAD,
  CREDITS_BASE_PER_SECOND,
  PROMPT_BASE_COST,
  PROMPT_BONUS_PER_LEVEL,
  PROMPT_COST_GROWTH,
  RESOURCE_IDS,
  SKILL_BONUS_PER_LEVEL,
  SKILLS_BASE_COST,
  SKILLS_BONUS_PER_LEVEL,
  SKILLS_COST_GROWTH,
  SPECIALTY_ACTIVITIES,
  SPECIALTY_MULTIPLIER,
  SUBSCRIPTION_TRICKLE_GROWTH,
  TEAM_BONUS_PER_LEVEL,
  XP_BASE_SECONDS,
  XP_GROWTH,
  YOU_MULTIPLIER,
  type ActivityId,
  type ResourceId,
  type WorkerKind,
} from "./config";
import { cashGain } from "./releases";
import type { GameState, Worker } from "./state";
import { audienceFunnelRate, hasWon, isVentureGated, passiveCashRate } from "./ventures";

export function skillMultiplier(level: number): number {
  return 1 + SKILL_BONUS_PER_LEVEL * (level - 1);
}

export function specialtyMultiplier(kind: WorkerKind, activity: ActivityId): number {
  if (kind === "you") return YOU_MULTIPLIER;
  return SPECIALTY_ACTIVITIES[kind].includes(activity) ? SPECIALTY_MULTIPLIER : 1;
}

export function promptCost(level: number): number {
  return PROMPT_BASE_COST * PROMPT_COST_GROWTH ** level;
}

export function skillsCost(level: number): number {
  return SKILLS_BASE_COST * SKILLS_COST_GROWTH ** level;
}

/** Prompt levels boost non-Cash output, since Cash pays for them. */
export function promptMultiplier(state: GameState, activity: ActivityId): number {
  const config = ACTIVITIES[activity];
  if (!config || config.resource === "cash") return 1;
  return 1 + PROMPT_BONUS_PER_LEVEL * state.promptLevel;
}

/** Skills levels boost non-Know-how output, since Know-how pays for them. */
export function skillsMultiplier(state: GameState, activity: ActivityId): number {
  const config = ACTIVITIES[activity];
  if (!config || config.resource === "knowHow") return 1;
  return 1 + SKILLS_BONUS_PER_LEVEL * state.skillsLevel;
}

/** Each specialist level above 1 adds to that activity for every worker. */
export function teamBonusMultiplier(state: GameState, activity: ActivityId): number {
  let levels = 0;
  for (const worker of state.workers) {
    if (worker.kind === "you") continue;
    if (!SPECIALTY_ACTIVITIES[worker.kind].includes(activity)) continue;
    levels += Math.max(0, worker.skills[activity].level - 1);
  }
  return 1 + TEAM_BONUS_PER_LEVEL * levels;
}

/**
 * Activity base units per second for one worker, after every multiplier.
 * Client work's unit is a Lead handled, not Cash.
 */
export function workerRate(state: GameState, worker: Worker, activity: ActivityId): number {
  const config = ACTIVITIES[activity];
  if (!config) return 0;
  const skill = worker.skills[activity];
  return (
    config.basePerSecond *
    specialtyMultiplier(worker.kind, activity) *
    skillMultiplier(skill.level) *
    promptMultiplier(state, activity) *
    skillsMultiplier(state, activity) *
    teamBonusMultiplier(state, activity)
  );
}

export function creditRate(state: GameState): number {
  return CREDITS_BASE_PER_SECOND * SUBSCRIPTION_TRICKLE_GROWTH ** (state.subscriptionTier - 1);
}

/** Seconds of work needed to go from this level to the next. */
export function xpToNextLevel(level: number): number {
  return XP_BASE_SECONDS * XP_GROWTH ** (level - 1);
}

/**
 * Gross production per second, by resource. Build and Client work burns are
 * stock-capped rather than rates, so they are not subtracted here.
 */
export function resourceRates(state: GameState): Record<ResourceId, number> {
  const rates = Object.fromEntries(RESOURCE_IDS.map((id) => [id, 0])) as Record<
    ResourceId,
    number
  >;
  rates.credits = creditRate(state);
  rates.cash = passiveCashRate(state);
  rates.leads = audienceFunnelRate(state);
  for (const worker of state.workers) {
    const activity = worker.activity;
    if (!activity) continue;
    const config = ACTIVITIES[activity];
    if (!config) continue;
    if (activity === "clientWork") {
      rates.cash += cashGain(state, workerRate(state, worker, activity) * CLIENT_CASH_PER_LEAD);
      continue;
    }
    if (config.resource) {
      const produced = workerRate(state, worker, activity);
      rates[config.resource] += config.resource === "cash" ? cashGain(state, produced) : produced;
    }
  }
  for (const worker of state.workers) {
    const automation = worker.automation;
    if (!automation) continue;
    const config = ACTIVITIES[automation.activity];
    if (!config) continue;
    if (automation.activity === "clientWork") {
      rates.cash += cashGain(state, automation.rate * CLIENT_CASH_PER_LEAD);
      continue;
    }
    if (config.resource) {
      rates[config.resource] +=
        config.resource === "cash" ? cashGain(state, automation.rate) : automation.rate;
    }
  }
  return rates;
}

/**
 * Net flow for the screen. Burn is the amount workers are trying to spend, not
 * what the stock allows, so a starved worker still shows the drain.
 */
export function resourceNetRates(state: GameState): Record<ResourceId, number> {
  const rates = resourceRates(state);
  const won = hasWon(state);
  const gated = isVentureGated(state);

  for (const worker of state.workers) {
    const activity = worker.activity;
    if (activity === "build" && !won && !gated) {
      const points = workerRate(state, worker, activity);
      rates.credits -= points * BUILD_CREDITS_PER_POINT;
      rates.knowHow -= points * BUILD_KNOWHOW_PER_POINT;
    }

    if (activity === "clientWork") {
      const handled = workerRate(state, worker, activity);
      rates.leads -= handled;
      rates.credits -= handled * CLIENT_CREDITS_PER_LEAD;
    }

    const automation = worker.automation;
    if (!automation) continue;
    if (automation.activity === "build" && !won && !gated) {
      rates.credits -= automation.rate * BUILD_CREDITS_PER_POINT;
      rates.knowHow -= automation.rate * BUILD_KNOWHOW_PER_POINT;
    }
    if (automation.activity === "clientWork") {
      rates.leads -= automation.rate;
      rates.credits -= automation.rate * CLIENT_CREDITS_PER_LEAD;
    }
  }
  return rates;
}
