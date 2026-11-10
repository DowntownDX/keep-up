import {
  AUTOMATION_FRACTION,
  BUILD_KNOWHOW_PER_POINT,
  MODEL_COUNT,
  VENTURE_COUNT,
  VENTURE_NAMES,
  type ActivityId,
  type AgentKind,
  type ResourceId,
} from "../engine/config";
import {
  addAgent,
  assignActivity,
  buyPrompt,
  buySkills,
  isActivityUnlocked,
  nextAgentCost,
  upgradeSubscription,
} from "../engine/actions";
import { recordAutomation } from "../engine/automations";
import { promptCost, skillsCost, workerRate } from "../engine/rates";
import {
  edgeMultiplier,
  latestGeneration,
  releaseTime,
} from "../engine/releases";
import { createInitialState, type GameState, type Worker } from "../engine/state";
import { step } from "../engine/step";
import {
  currentVentureIndex,
  hasWon,
  isFollowerGateMet,
  isSystemUnlocked,
  isVentureGated,
} from "../engine/ventures";

const HIRE_ORDER: readonly AgentKind[] = [
  "tutor",
  "creator",
  "builder",
  "assistant",
  "scout",
];

/** Ignore seat saving when the next seat is further away than this. */
const SEAT_SAVING_HORIZON_SECONDS = 10 * 60;
/** Build only while Know-how covers this many seconds of burn. */
const BUILD_BUFFER_SECONDS = 30;
/** Spend at most a quarter of a resource on one upgrade. */
const UPGRADE_SPEND_FRACTION = 0.25;
/** Re-record an automation once its live rate beats the snapshot by half. */
const AUTOMATION_REFRESH_FACTOR = 1.5;

const DAY_SECONDS = 24 * 60 * 60;

export interface VentureShip {
  index: number;
  name: string;
  atSeconds: number;
  edge: number;
  tier: number;
  generation: number;
}

export interface Hire {
  kind: AgentKind;
  atSeconds: number;
}

export interface EdgeChange {
  atSeconds: number;
  edge: number;
  generation: number;
  tier: number;
}

export interface BotReport {
  requestedDays: number;
  elapsedSeconds: number;
  won: boolean;
  ventures: VentureShip[];
  milestones: Record<string, number | null>;
  hires: Hire[];
  edgeChanges: EdgeChange[];
  fallBehindEpisodes: number;
  finalTier: number;
  finalGeneration: number;
  finalEdge: number;
  distinctEdgeValues: number;
  timeAtEdge: Record<string, number>;
  maxEdgeSecondsBeforeLastRelease: number;
  lastReleaseSeconds: number;
  sawNegativeResource: boolean;
  finalResources: Record<ResourceId, number>;
}

export interface BotRun {
  report: BotReport;
  state: GameState;
}

/** Play a fresh game with the simple rules from the build plan. */
export function runBot(days = 30, decisionSeconds = 5): BotRun {
  if (!Number.isFinite(days) || days <= 0) {
    throw new RangeError("days must be a finite number above zero");
  }
  if (!Number.isFinite(decisionSeconds) || decisionSeconds <= 0) {
    throw new RangeError("decisionSeconds must be a finite number above zero");
  }

  const state = createInitialState();
  const totalSeconds = days * DAY_SECONDS;
  const lastReleaseSeconds = releaseTime(MODEL_COUNT);

  const ventures: VentureShip[] = [];
  const hires: Hire[] = [];
  const edgeChanges: EdgeChange[] = [
    {
      atSeconds: 0,
      edge: edgeMultiplier(state),
      generation: latestGeneration(state),
      tier: state.subscriptionTier,
    },
  ];

  let elapsed = 0;
  let firstAgent: number | null = null;
  let firstGate: number | null = null;
  let currentEdge = edgeChanges[0].edge;
  let behind = false;
  let fallBehindEpisodes = 0;
  let sawNegativeResource = false;

  while (elapsed < totalSeconds && !hasWon(state)) {
    const agentsBefore = state.workers.length;
    decide(state);
    if (state.workers.length > agentsBefore) {
      const hired = state.workers[state.workers.length - 1];
      hires.push({ kind: hired.kind as AgentKind, atSeconds: elapsed });
      if (firstAgent === null) firstAgent = elapsed;
    }

    step(state, decisionSeconds);
    elapsed += decisionSeconds;

    while (ventures.length < state.venturesShipped) {
      const index = ventures.length;
      ventures.push({
        index,
        name: VENTURE_NAMES[index],
        atSeconds: elapsed,
        edge: edgeMultiplier(state),
        tier: state.subscriptionTier,
        generation: latestGeneration(state),
      });
    }

    if (firstGate === null && isFollowerGateMet(state)) firstGate = elapsed;
    if (Object.values(state.resources).some((amount) => amount < 0)) {
      sawNegativeResource = true;
    }

    const edge = edgeMultiplier(state);
    if (edge !== currentEdge) {
      currentEdge = edge;
      edgeChanges.push({
        atSeconds: elapsed,
        edge,
        generation: latestGeneration(state),
        tier: state.subscriptionTier,
      });
      if (edge < 1.5 && !behind) behind = true;
      if (edge === 1.5 && behind) {
        behind = false;
        fallBehindEpisodes += 1;
      }
    }
  }

  // Close the last Edge interval; durations are recomputed from the changes.
  const timeAtEdge: Record<string, number> = {};
  let maxEdgeSecondsBeforeLastRelease = 0;
  for (let index = 0; index < edgeChanges.length; index += 1) {
    const start = edgeChanges[index].atSeconds;
    const end = index + 1 < edgeChanges.length ? edgeChanges[index + 1].atSeconds : elapsed;
    const duration = end - start;
    if (duration <= 0) continue;
    const key = String(edgeChanges[index].edge);
    timeAtEdge[key] = (timeAtEdge[key] ?? 0) + duration;

    if (edgeChanges[index].edge === 1.5) {
      const from = Math.min(start, lastReleaseSeconds);
      const to = Math.min(end, lastReleaseSeconds);
      if (to > from) maxEdgeSecondsBeforeLastRelease += to - from;
    }
  }

  const milestones: Record<string, number | null> = {
    firstAgent,
    firstGate,
  };
  for (let index = 1; index <= VENTURE_COUNT; index += 1) {
    milestones[`venture${index}`] = ventures[index - 1]?.atSeconds ?? null;
  }

  return {
    state,
    report: {
      requestedDays: days,
      elapsedSeconds: elapsed,
      won: hasWon(state),
      ventures,
      milestones,
      hires,
      edgeChanges,
      fallBehindEpisodes,
      finalTier: state.subscriptionTier,
      finalGeneration: latestGeneration(state),
      finalEdge: edgeMultiplier(state),
      distinctEdgeValues: new Set(edgeChanges.map((change) => change.edge)).size,
      timeAtEdge,
      maxEdgeSecondsBeforeLastRelease,
      lastReleaseSeconds,
      sawNegativeResource,
      finalResources: { ...state.resources },
    },
  };
}

function decide(state: GameState): void {
  hireNext(state);
  upgradeSubscription(state);
  buyUpgrades(state);
  updateAutomations(state);
  assignWorkers(state);
}

function hireNext(state: GameState): void {
  for (const kind of HIRE_ORDER) {
    if (state.workers.some((worker) => worker.kind === kind)) continue;
    addAgent(state, kind);
    return;
  }
}

/** Buy one level of the cheaper upgrade, keeping most of the stock in reserve. */
function buyUpgrades(state: GameState): void {
  const prompt = promptCost(state.promptLevel);
  const skills = skillsCost(state.skillsLevel);
  const canPrompt = state.resources.cash > prompt / UPGRADE_SPEND_FRACTION;
  const canSkills = state.resources.knowHow > skills / UPGRADE_SPEND_FRACTION;

  if (canPrompt && (!canSkills || prompt <= skills)) {
    buyPrompt(state);
  } else if (canSkills) {
    buySkills(state);
  }
}

function updateAutomations(state: GameState): void {
  if (!isSystemUnlocked(state, "automations")) return;
  for (const worker of state.workers) {
    if (worker.kind === "you" || !worker.activity) continue;
    const live = workerRate(state, worker, worker.activity) * AUTOMATION_FRACTION;
    const current = worker.automation;
    if (!current || live > current.rate * AUTOMATION_REFRESH_FACTOR) {
      recordAutomation(state, worker.id);
    }
  }
}

function assignWorkers(state: GameState): void {
  const gated = isVentureGated(state);
  const won = hasWon(state);
  const index = currentVentureIndex(state);
  const nextCost = nextAgentCost(state);
  const buildRate = estimateBuildRate(state);
  const knowHowDrain = buildRate * BUILD_KNOWHOW_PER_POINT;
  const knowHowStarved = state.resources.knowHow < knowHowDrain * BUILD_BUFFER_SECONDS;
  const canBuild = !won && !gated && !knowHowStarved;

  for (const worker of state.workers) {
    switch (worker.kind) {
      case "tutor":
        assign(state, worker, "learn");
        break;
      case "creator":
        assign(state, worker, "content");
        break;
      case "scout":
        assign(state, worker, "findClients");
        break;
      case "assistant":
        if (
          isActivityUnlocked(state, "clientWork") &&
          state.resources.leads >= 1 &&
          state.resources.credits > 100
        ) {
          assign(state, worker, "clientWork");
        } else {
          assign(state, worker, "dayJob");
        }
        break;
      case "builder":
        assign(state, worker, canBuild ? "build" : "learn");
        break;
      case "you":
        assignYou(state, worker, { gated, canBuild, knowHowStarved, nextCost, index });
        break;
    }
  }
}

function assignYou(
  state: GameState,
  worker: Worker,
  options: {
    gated: boolean;
    canBuild: boolean;
    knowHowStarved: boolean;
    nextCost: number | null;
    index: number | null;
  },
): void {
  // The first seat is the only one that needs active Cash: it buys the Tutor.
  if (state.workers.length === 1) {
    assign(state, worker, "dayJob");
    return;
  }

  if (options.gated) {
    assign(state, worker, "content");
    return;
  }

  if (options.canBuild) {
    assign(state, worker, "build");
    return;
  }

  if (options.knowHowStarved) {
    assign(state, worker, "learn");
    return;
  }

  // No useful build right now; keep Cash moving toward the next seat or the
  // next venture's unlocks.
  if (options.nextCost !== null && options.nextCost <= estimateCash(state) * SEAT_SAVING_HORIZON_SECONDS) {
    assign(state, worker, "dayJob");
    return;
  }

  if (options.index !== null && isActivityUnlocked(state, "findClients")) {
    assign(state, worker, "findClients");
    return;
  }

  assign(state, worker, "dayJob");
}

function assign(state: GameState, worker: Worker, activity: ActivityId): void {
  if (!isActivityUnlocked(state, activity)) return;
  assignActivity(state, worker.id, activity);
}

function estimateBuildRate(state: GameState): number {
  let rate = 0;
  for (const worker of state.workers) {
    if (worker.kind === "you" || worker.kind === "builder") {
      rate += workerRate(state, worker, "build");
    }
  }
  return Math.max(rate, 1);
}

function estimateCash(state: GameState): number {
  let rate = 0;
  for (const worker of state.workers) {
    if (!worker.activity) continue;
    if (worker.activity === "dayJob" || worker.activity === "clientWork") {
      rate += workerRate(state, worker, worker.activity);
    }
  }
  return Math.max(rate, 0.1);
}
