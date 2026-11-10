import {
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

export const SAVE_VERSION = 2;

type RawState = Record<string, unknown>;

/**
 * Version 1 is the Phase 1 state shape, before ventures. Loading it adds the
 * venture fields at their starting values. Future migrations go here, keyed by
 * the version being upgraded from.
 */
const MIGRATIONS: Record<number, (state: RawState) => RawState> = {
  1: (state) => ({ ...state, venturesShipped: 0, ventureProgress: 0 }),
};

export function serializeGame(state: GameState): string {
  const snapshot: GameState = {
    resources: state.resources,
    workers: state.workers,
    subscriptionTier: state.subscriptionTier,
    nextAgentNumber: state.nextAgentNumber,
    pendingSeconds: state.pendingSeconds,
    venturesShipped: state.venturesShipped,
    ventureProgress: state.ventureProgress,
  };
  return JSON.stringify({ version: SAVE_VERSION, state: snapshot });
}

export function loadGame(raw: string): GameState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  const { version, state } = parsed;
  if (typeof version !== "number" || !Number.isInteger(version) || !isRecord(state)) {
    return null;
  }

  let migrated: unknown = state;
  let currentVersion = version;
  while (currentVersion < SAVE_VERSION) {
    const migrate = MIGRATIONS[currentVersion];
    if (!migrate) return null;
    migrated = migrate(migrated as RawState);
    currentVersion += 1;
  }
  if (currentVersion !== SAVE_VERSION) return null;

  return isValidState(migrated) ? migrated : null;
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
  const workerIds = new Set<string>();
  const agentKinds = new Set<string>();
  let youCount = 0;
  let maxAgentNumber = 0;

  for (const worker of workers) {
    if (!isValidWorker(worker)) return false;
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

  return true;
}
