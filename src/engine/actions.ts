import {
  ACTIVITIES,
  AGENT_KINDS,
  AGENT_SEAT_COSTS,
  MAX_AGENTS,
  type ActivityId,
  type AgentKind,
} from "./config";
import { createWorker, type GameState } from "./state";

/** Put a worker on an activity, or take it off with null. */
export function assignActivity(
  state: GameState,
  workerId: string,
  activity: ActivityId | null,
): boolean {
  const worker = state.workers.find((candidate) => candidate.id === workerId);
  if (!worker) return false;
  if (activity !== null && !Object.hasOwn(ACTIVITIES, activity)) return false;
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
