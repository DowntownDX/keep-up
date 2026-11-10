import {
  BUILD_POINTS_BASE,
  BUILD_POINTS_GROWTH,
  FOLLOWER_GATE_BASE,
  FOLLOWER_GATE_GROWTH,
  FOLLOWER_GATE_START_INDEX,
  FUNNEL_FOLLOWERS_PER_LEAD,
  SYSTEM_UNLOCK_VENTURES,
  VENTURE_COUNT,
  VENTURE_INCOME_BASE,
  VENTURE_INCOME_GROWTH,
  type SystemId,
} from "./config";
import { cashGain } from "./releases";
import type { GameState } from "./state";

/** Build points needed to ship the venture at this zero-based index. */
export function buildPointsRequired(ventureIndex: number): number {
  return BUILD_POINTS_BASE * BUILD_POINTS_GROWTH ** ventureIndex;
}

/** Passive Cash per second paid by the venture at this zero-based index. */
export function ventureIncome(ventureIndex: number): number {
  return VENTURE_INCOME_BASE * VENTURE_INCOME_GROWTH ** ventureIndex;
}

export function passiveCashRate(state: GameState): number {
  let total = 0;
  for (let index = 0; index < state.venturesShipped; index += 1) {
    total += ventureIncome(index);
  }
  return cashGain(state, total);
}

export function currentVentureIndex(state: GameState): number | null {
  return state.venturesShipped < VENTURE_COUNT ? state.venturesShipped : null;
}

export function isSystemUnlocked(state: GameState, system: SystemId): boolean {
  return state.venturesShipped >= SYSTEM_UNLOCK_VENTURES[system];
}

export function hasWon(state: GameState): boolean {
  return state.venturesShipped >= VENTURE_COUNT;
}

/** Followers needed to launch the venture at this zero-based index. */
export function followersRequired(ventureIndex: number): number {
  if (ventureIndex < FOLLOWER_GATE_START_INDEX) return 0;
  return (
    FOLLOWER_GATE_BASE *
    FOLLOWER_GATE_GROWTH ** (ventureIndex - FOLLOWER_GATE_START_INDEX)
  );
}

export function isVentureGated(state: GameState): boolean {
  const index = currentVentureIndex(state);
  return index !== null && state.resources.followers < followersRequired(index);
}

/** Leads per second from the audience funnel, once venture 3 unlocks it. */
export function audienceFunnelRate(state: GameState): number {
  if (!isSystemUnlocked(state, "audienceFunnel")) return 0;
  return state.resources.followers / FUNNEL_FOLLOWERS_PER_LEAD;
}
