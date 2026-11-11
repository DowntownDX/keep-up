import {
  BUILD_CREDITS_PER_POINT,
  BUILD_KNOWHOW_PER_POINT,
  CLIENT_CREDITS_PER_LEAD,
  PROMPT_BONUS_PER_LEVEL,
  SKILLS_BONUS_PER_LEVEL,
} from "../engine/config";
import { creditRate, promptCost, resourceRates, skillsCost, workerRate } from "../engine/rates";
import type { GameState } from "../engine/state";
import {
  buildPointsRequired,
  currentVentureIndex,
  hasWon,
  isVentureGated,
} from "../engine/ventures";

export type EtaCap = "build" | "credits" | "knowHow";

export interface VentureEta {
  seconds: number;
  cappedBy: EtaCap;
}

export interface EtaInput {
  remaining: number;
  buildRate: number;
  creditStock: number;
  creditSupply: number;
  knowHowStock: number;
  knowHowSupply: number;
}

/** Build points per second, including recorded automations. */
export function buildPointsPerSecond(state: GameState): number {
  let rate = 0;
  for (const worker of state.workers) {
    if (worker.activity === "build") rate += workerRate(state, worker, "build");
    if (worker.automation?.activity === "build") rate += worker.automation.rate;
  }
  return rate;
}

/** Credits per second spent by client work, which competes with the build. */
export function clientCreditBurn(state: GameState): number {
  let burn = 0;
  for (const worker of state.workers) {
    if (worker.activity === "clientWork") {
      burn += workerRate(state, worker, "clientWork") * CLIENT_CREDITS_PER_LEAD;
    }
    if (worker.automation?.activity === "clientWork") {
      burn += worker.automation.rate * CLIENT_CREDITS_PER_LEAD;
    }
  }
  return burn;
}

/**
 * One leg's time to finish. Stock covers the first points; a live supply covers
 * the rest. No supply and not enough stock means the venture cannot finish.
 */
function legSeconds(
  remaining: number,
  stock: number,
  supply: number,
  perPoint: number,
): number | null {
  const covered = stock / perPoint;
  if (remaining <= covered) return 0;
  if (supply <= 0) return null;
  return (remaining - covered) / (supply / perPoint);
}

/**
 * The slowest constraint wins: build output, Credits per point and Know-how
 * per point. A stock buffer counts even when its supply is zero. The estimate
 * assumes current rates; future upgrades can improve it, while a client worker
 * burning Credits can slow it.
 */
export function etaFrom(input: EtaInput): VentureEta | null {
  const remaining = Math.max(0, input.remaining);
  if (remaining === 0) return { seconds: 0, cappedBy: "build" };

  const build = input.buildRate > 0 ? remaining / input.buildRate : null;
  const credits = legSeconds(
    remaining,
    input.creditStock,
    input.creditSupply,
    BUILD_CREDITS_PER_POINT,
  );
  const knowHow = legSeconds(
    remaining,
    input.knowHowStock,
    input.knowHowSupply,
    BUILD_KNOWHOW_PER_POINT,
  );
  if (build === null || credits === null || knowHow === null) return null;

  const seconds = Math.max(build, credits, knowHow);
  const cappedBy: EtaCap =
    seconds === build ? "build" : seconds === credits ? "credits" : "knowHow";
  return { seconds, cappedBy };
}

export function ventureEta(state: GameState): VentureEta | null {
  const index = currentVentureIndex(state);
  if (index === null || hasWon(state) || isVentureGated(state)) return null;

  return etaFrom({
    remaining: buildPointsRequired(index) - state.ventureProgress,
    buildRate: buildPointsPerSecond(state),
    creditStock: state.resources.credits,
    creditSupply: Math.max(0, creditRate(state) - clientCreditBurn(state)),
    knowHowStock: state.resources.knowHow,
    knowHowSupply: resourceRates(state).knowHow,
  });
}

export function affordSeconds(current: number, rate: number, cost: number): number | null {
  if (current >= cost) return 0;
  if (!Number.isFinite(rate) || rate <= 0) return null;
  return (cost - current) / rate;
}

export interface UpgradeForecast {
  level: number;
  now: number;
  next: number;
  cost: number;
  seconds: number | null;
}

/**
 * Gross production, not net: a builder can be paused, and the strip already
 * shows the drain. The label is an estimate, not a promise.
 */
export function promptForecast(state: GameState): UpgradeForecast {
  const cost = promptCost(state.promptLevel);
  return {
    level: state.promptLevel,
    now: PROMPT_BONUS_PER_LEVEL * state.promptLevel,
    next: PROMPT_BONUS_PER_LEVEL * (state.promptLevel + 1),
    cost,
    seconds: affordSeconds(state.resources.cash, resourceRates(state).cash, cost),
  };
}

export function skillsForecast(state: GameState): UpgradeForecast {
  const cost = skillsCost(state.skillsLevel);
  return {
    level: state.skillsLevel,
    now: SKILLS_BONUS_PER_LEVEL * state.skillsLevel,
    next: SKILLS_BONUS_PER_LEVEL * (state.skillsLevel + 1),
    cost,
    seconds: affordSeconds(state.resources.knowHow, resourceRates(state).knowHow, cost),
  };
}
