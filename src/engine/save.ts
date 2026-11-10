import {
  ACTIVITIES,
  ACTIVITY_IDS,
  RESOURCE_IDS,
  TICK_SECONDS,
  VENTURE_COUNT,
  WORKER_KINDS,
  type ActivityId,
  type WorkerKind,
} from "./config";
import type { GameState, Skill, Worker } from "./state";
import { buildPointsRequired } from "./ventures";

export const SAVE_VERSION = 4;

export interface LoadedSave {
  state: GameState;
  /** Wall-clock time the save was written. Zero means no offline catch-up. */
  savedAt: number;
}

type RawState = Record<string, unknown>;

interface RawSave {
  version: number;
  state: RawState;
  savedAt?: unknown;
}

/**
 * Version 1 is the Phase 1 state shape, before ventures. Version 2 adds the
 * venture fields. Version 3 adds the envelope timestamp. Migrations run in
 * order and are keyed by the version being upgraded from.
 */
const MIGRATIONS: Record<number, (save: RawSave) => RawSave> = {
  1: (save) => ({
    ...save,
    state: { ...save.state, venturesShipped: 0, ventureProgress: 0 },
  }),
  2: (save) => ({ ...save, savedAt: 0 }),
  3: (save) => ({ ...save, state: { ...save.state, promptLevel: 0, skillsLevel: 0 } }),
};

export function serializeGame(state: GameState, savedAt: number): string {
  if (!Number.isFinite(savedAt) || savedAt < 0) {
    throw new RangeError("savedAt must be a finite timestamp of zero or more");
  }
  const snapshot: GameState = {
    resources: state.resources,
    workers: state.workers,
    subscriptionTier: state.subscriptionTier,
    nextAgentNumber: state.nextAgentNumber,
    pendingSeconds: state.pendingSeconds,
    venturesShipped: state.venturesShipped,
    ventureProgress: state.ventureProgress,
    promptLevel: state.promptLevel,
    skillsLevel: state.skillsLevel,
  };
  return JSON.stringify({ version: SAVE_VERSION, savedAt, state: snapshot });
}

export function loadGame(raw: string): LoadedSave | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  const { version, state, savedAt } = parsed;
  if (typeof version !== "number" || !Number.isInteger(version) || !isRecord(state)) {
    return null;
  }

  let save: RawSave = { version, state, savedAt };
  let currentVersion = version;
  while (currentVersion < SAVE_VERSION) {
    const migrate = MIGRATIONS[currentVersion];
    if (!migrate) return null;
    save = migrate(save);
    currentVersion += 1;
  }
  if (currentVersion !== SAVE_VERSION) return null;

  const loadedState = save.state;
  if (!isValidState(loadedState)) return null;
  const loadedSavedAt = save.savedAt;
  if (!isFiniteNumber(loadedSavedAt) || loadedSavedAt < 0) return null;

  return { state: loadedState, savedAt: loadedSavedAt };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isIntegerAtLeast(value: unknown, minimum: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= minimum;
}

function isValidSkill(value: unknown): value is Skill {
  if (!isRecord(value)) return false;
  return isIntegerAtLeast(value.level, 1) && isFiniteNumber(value.xp) && value.xp >= 0;
}

function isValidWorker(value: unknown): value is Worker {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string" || value.id === "") return false;
  if (typeof value.kind !== "string" || !WORKER_KINDS.includes(value.kind as WorkerKind)) {
    return false;
  }
  if (
    value.activity !== null &&
    (typeof value.activity !== "string" ||
      !ACTIVITY_IDS.includes(value.activity as ActivityId))
  ) {
    return false;
  }

  const skills = value.skills;
  if (!isRecord(skills)) return false;
  return ACTIVITY_IDS.every((activity) => isValidSkill(skills[activity]));
}

function isValidState(value: unknown): value is GameState {
  if (!isRecord(value)) return false;

  const resources = value.resources;
  if (!isRecord(resources)) return false;
  for (const id of RESOURCE_IDS) {
    const amount = resources[id];
    if (!isFiniteNumber(amount) || amount < 0) return false;
  }

  const workers = value.workers;
  if (!Array.isArray(workers) || workers.length === 0) return false;
  const validatedWorkers: Worker[] = [];
  const workerIds = new Set<string>();
  const agentKinds = new Set<string>();
  let youCount = 0;
  let maxAgentNumber = 0;

  for (const worker of workers) {
    if (!isValidWorker(worker)) return false;
    validatedWorkers.push(worker);
    if (workerIds.has(worker.id)) return false;
    workerIds.add(worker.id);

    if (worker.kind === "you") {
      youCount += 1;
    } else {
      if (agentKinds.has(worker.kind)) return false;
      agentKinds.add(worker.kind);
    }

    const match = /^agent-(\d+)$/.exec(worker.id);
    if (match) {
      maxAgentNumber = Math.max(maxAgentNumber, Number(match[1]));
    }
  }
  if (youCount !== 1) return false;

  if (!isIntegerAtLeast(value.subscriptionTier, 1)) return false;
  if (!isIntegerAtLeast(value.nextAgentNumber, 1)) return false;
  if (value.nextAgentNumber <= maxAgentNumber) return false;
  if (!isIntegerAtLeast(value.promptLevel, 0)) return false;
  if (!isIntegerAtLeast(value.skillsLevel, 0)) return false;

  if (
    !isFiniteNumber(value.pendingSeconds) ||
    value.pendingSeconds < 0 ||
    value.pendingSeconds >= TICK_SECONDS
  ) {
    return false;
  }

  if (!isIntegerAtLeast(value.venturesShipped, 0)) return false;
  if (value.venturesShipped > VENTURE_COUNT) return false;
  if (!isFiniteNumber(value.ventureProgress) || value.ventureProgress < 0) return false;
  if (value.venturesShipped < VENTURE_COUNT) {
    if (value.ventureProgress >= buildPointsRequired(value.venturesShipped)) return false;
  } else if (value.ventureProgress !== 0) {
    return false;
  }

  for (const worker of validatedWorkers) {
    if (!worker.activity) continue;
    const config = ACTIVITIES[worker.activity];
    if (!config || value.venturesShipped < config.unlockVentures) return false;
  }

  return true;
}
