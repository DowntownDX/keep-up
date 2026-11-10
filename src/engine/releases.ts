import {
  EDGE_MULTIPLIERS,
  FIRST_RELEASE_SECONDS,
  MAX_SUBSCRIPTION_TIER,
  MODEL_COUNT,
  RELEASE_INTERVAL_GROWTH,
  SUBSCRIPTION_UPGRADE_BASE_COST,
  SUBSCRIPTION_UPGRADE_COST_GROWTH,
} from "./config";
import type { GameState } from "./state";

export interface ReleaseStatus {
  generation: number;
  /** Game time, in seconds, when this generation arrives. */
  atSeconds: number;
}

/** Game time before the given one-based generation is released. */
export function releaseTime(generation: number): number {
  if (generation <= 1) return 0;
  if (generation > MODEL_COUNT) return Number.POSITIVE_INFINITY;
  return (
    (FIRST_RELEASE_SECONDS * (RELEASE_INTERVAL_GROWTH ** (generation - 1) - 1)) /
    (RELEASE_INTERVAL_GROWTH - 1)
  );
}

/** Latest generation the labs have released at this game time. */
export function latestGeneration(state: Pick<GameState, "elapsedSeconds">): number {
  let generation = 1;
  while (
    generation < MODEL_COUNT &&
    state.elapsedSeconds >= releaseTime(generation + 1)
  ) {
    generation += 1;
  }
  return generation;
}

/** The next generation to arrive, or null once every one is out. */
export function nextRelease(
  state: Pick<GameState, "elapsedSeconds">,
): ReleaseStatus | null {
  const latest = latestGeneration(state);
  if (latest >= MODEL_COUNT) return null;
  return { generation: latest + 1, atSeconds: releaseTime(latest + 1) };
}

export function generationsBehind(
  state: Pick<GameState, "elapsedSeconds" | "subscriptionTier">,
): number {
  return Math.max(0, latestGeneration(state) - state.subscriptionTier);
}

/**
 * Cash multiplier for how close the subscription is to the latest release.
 * Staying still while releases land drops it toward the 0.9 floor.
 */
export function edgeMultiplier(
  state: Pick<GameState, "elapsedSeconds" | "subscriptionTier">,
): number {
  const behind = generationsBehind(state);
  return EDGE_MULTIPLIERS[Math.min(behind, EDGE_MULTIPLIERS.length - 1)];
}

/** Cash actually earned from a nominal amount. The one place Edge applies. */
export function cashGain(
  state: Pick<GameState, "elapsedSeconds" | "subscriptionTier">,
  amount: number,
): number {
  return amount * edgeMultiplier(state);
}

/** Cash needed for the next tier, or null at the cap. */
export function subscriptionUpgradeCost(tier: number): number | null {
  if (tier >= MAX_SUBSCRIPTION_TIER) return null;
  return SUBSCRIPTION_UPGRADE_BASE_COST * SUBSCRIPTION_UPGRADE_COST_GROWTH ** (tier - 1);
}

/** Whether the next tier exists, has been released and is affordable. */
export function canUpgradeSubscription(
  state: Pick<GameState, "elapsedSeconds" | "subscriptionTier" | "resources">,
): boolean {
  if (state.subscriptionTier >= MAX_SUBSCRIPTION_TIER) return false;
  if (state.subscriptionTier >= latestGeneration(state)) return false;
  const cost = subscriptionUpgradeCost(state.subscriptionTier);
  return cost !== null && state.resources.cash >= cost;
}
