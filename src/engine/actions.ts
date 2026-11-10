import {
  ACTIVITIES,
  ACTIVE_CLICK_SECONDS,
  AGENT_KINDS,
  AGENT_SEAT_COSTS,
  MAX_AGENTS,
  type ActivityId,
  type AgentKind,
} from "./config";
import { promptCost, skillsCost } from "./rates";
import { createWorker, type GameState } from "./state";
import { shipCompletedVentures, workWorker } from "./work";

/** Whether the current venture count has opened this activity. */
export function isActivityUnlocked(state: GameState, activity: ActivityId): boolean {
  const config = ACTIVITIES[activity];
  return config !== undefined && state.venturesShipped >= config.unlockVentures;
}

/** Put a worker on an activity, or take it off with null. */
export function assignActivity(
  state: GameState,
  workerId: string,
  activity: ActivityId | null,
): boolean {
  const worker = state.workers.find((candidate) => candidate.id === workerId);
  if (!worker) return false;
  if (activity !== null && !isActivityUnlocked(state, activity)) return false;
  worker.activity = activity;
  return true;
}

/** Cash needed for the next agent seat, or null when the team is full. */
export function nextAgentCost(state: GameState): number | null {
  const agents = state.workers.filter((worker) => worker.kind !== "you").length;
  if (agents >= MAX_AGENTS) return null;
  return AGENT_SEAT_COSTS[agents];
}

/** Hire one specialist. Each kind can be hired once. */
export function addAgent(state: GameState, kind: AgentKind): boolean {
  if (!AGENT_KINDS.includes(kind)) return false;
  if (state.workers.some((worker) => worker.kind === kind)) return false;
  const cost = nextAgentCost(state);
  if (cost === null || state.resources.cash < cost) return false;
  state.resources.cash -= cost;
  state.workers.push(createWorker(`agent-${state.nextAgentNumber}`, kind));
  state.nextAgentNumber += 1;
  return true;
}

/**
 * Apply one click of active play to a worker. This is worker work only: no
 * Credits trickle, passive Cash or tick remainder is added.
 */
export function doItYourself(state: GameState, workerId: string): boolean {
  const worker = state.workers.find((candidate) => candidate.id === workerId);
  if (!worker) return false;
  const worked = workWorker(state, worker, ACTIVE_CLICK_SECONDS);
  if (worked) shipCompletedVentures(state);
  return worked;
}

/** Buy one Prompt library level with Cash. */
export function buyPrompt(state: GameState): boolean {
  const cost = promptCost(state.promptLevel);
  if (state.resources.cash < cost) return false;
  state.resources.cash -= cost;
  state.promptLevel += 1;
  return true;
}

/** Buy one Skills level with Know-how. */
export function buySkills(state: GameState): boolean {
  const cost = skillsCost(state.skillsLevel);
  if (state.resources.knowHow < cost) return false;
  state.resources.knowHow -= cost;
  state.skillsLevel += 1;
  return true;
}
