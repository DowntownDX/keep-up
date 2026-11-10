import { ACTIVITIES, AUTOMATION_FRACTION } from "./config";
import { workerRate } from "./rates";
import type { GameState, Worker } from "./state";
import { isSystemUnlocked } from "./ventures";
import { applyBuild, applyClientWork } from "./work";

/**
 * Freeze 50% of an agent's current output on that worker. Re-recording
 * replaces it. The snapshot never scales again and earns no XP.
 */
export function recordAutomation(state: GameState, workerId: string): boolean {
  if (!isSystemUnlocked(state, "automations")) return false;
  const worker = state.workers.find((candidate) => candidate.id === workerId);
  if (!worker || worker.kind === "you" || !worker.activity) return false;
  if (ACTIVITIES[worker.activity] === undefined) return false;

  worker.automation = {
    activity: worker.activity,
    rate: workerRate(state, worker, worker.activity) * AUTOMATION_FRACTION,
  };
  return true;
}

/** Run a recorded snapshot for one tick or click-sized slice. */
export function applyAutomation(state: GameState, worker: Worker, seconds: number): void {
  const automation = worker.automation;
  if (!automation) return;
  const config = ACTIVITIES[automation.activity];
  if (!config) return;

  if (automation.activity === "build") {
    applyBuild(state, automation.rate, seconds);
    return;
  }

  if (automation.activity === "clientWork") {
    applyClientWork(state, automation.rate, seconds);
    return;
  }

  if (config.resource) {
    state.resources[config.resource] += automation.rate * seconds;
  }
}
