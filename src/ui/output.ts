import { ACTIVITIES } from "../engine/config";
import { cashGain } from "../engine/releases";
import { creditRate, resourceRates, workerRate } from "../engine/rates";
import type { GameState, Worker } from "../engine/state";
import { hasWon } from "../engine/ventures";
import { RESOURCE_LABELS } from "./labels";

export interface WorkerOutput {
  /** Units per second after every multiplier, in the unit the chip names. */
  value: number;
  unit: string;
}

/**
 * The rate a worker produces while on an activity. Client work is measured in
 * Leads handled, not Cash paid; day job Cash includes Edge, matching the strip.
 */
export function workerOutput(state: GameState, worker: Worker): WorkerOutput | null {
  const activity = worker.activity;
  if (!activity) return null;
  const rate = workerRate(state, worker, activity);

  if (activity === "dayJob") {
    return { value: cashGain(state, rate), unit: "Cash/s" };
  }
  if (activity === "clientWork") {
    return { value: rate, unit: "Leads/s" };
  }
  if (activity === "build") {
    return { value: rate, unit: "pts/s" };
  }

  const resource = ACTIVITIES[activity]?.resource;
  if (!resource) return null;
  return { value: rate, unit: `${RESOURCE_LABELS[resource]}/s` };
}

/** Whether the current stock leaves nothing for this worker to apply. */
export function workerStarved(state: GameState, worker: Worker): boolean {
  if (worker.activity === "build") {
    return (
      hasWon(state) ||
      state.resources.credits <= 0 ||
      state.resources.knowHow <= 0
    );
  }
  if (worker.activity === "clientWork") {
    return state.resources.leads <= 0 || state.resources.credits <= 0;
  }
  return false;
}

/**
 * Starved with nothing left to draw on. Check each leg separately: a zero
 * stock with a live supply is still work, and a positive stock covers the work
 * even when no one is refilling it.
 */
export function workerStalled(state: GameState, worker: Worker): boolean {
  if (!workerStarved(state, worker)) return false;
  const creditsGone =
    state.resources.credits <= 0 && creditRate(state) <= 0;

  if (worker.activity === "clientWork") {
    const leadsGone =
      state.resources.leads <= 0 && resourceRates(state).leads <= 0;
    return leadsGone || creditsGone;
  }
  if (worker.activity === "build") {
    const knowHowGone =
      state.resources.knowHow <= 0 && resourceRates(state).knowHow <= 0;
    return knowHowGone || creditsGone;
  }
  return false;
}
