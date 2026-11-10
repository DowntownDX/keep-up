import { nextAgentCost } from "../engine/actions";
import { promptCost, skillsCost } from "../engine/rates";
import { canUpgradeSubscription, latestGeneration, subscriptionUpgradeCost } from "../engine/releases";
import type { GameState } from "../engine/state";
import {
  currentVentureIndex,
  followersRequired,
  hasWon,
  isSystemUnlocked,
  isVentureGated,
} from "../engine/ventures";
import { formatAmount } from "./format";

export interface Hint {
  id: string;
  title: string;
  detail: string;
}

/**
 * One next move for the player, in a fixed order. Hints never change state;
 * they only describe what the current state makes useful.
 */
export function nextHint(state: GameState): Hint {
  if (hasWon(state)) {
    return {
      id: "won",
      title: "You made it",
      detail: "All ten ventures shipped. Your income no longer depends on the day job.",
    };
  }

  if (state.workers.every((worker) => worker.activity === null)) {
    return {
      id: "start",
      title: "Put someone to work",
      detail: "Pick Day job tasks for Cash or Make content for Followers on a worker card.",
    };
  }

  const index = currentVentureIndex(state);
  if (index !== null && isVentureGated(state)) {
    return {
      id: "gate",
      title: "Grow your audience",
      detail:
        `Venture ${index + 1} needs ${formatAmount(followersRequired(index))} Followers and you have ` +
        `${formatAmount(state.resources.followers)}. Put a worker on Make content.`,
    };
  }

  const seatCost = nextAgentCost(state);
  if (seatCost !== null && state.resources.cash >= seatCost) {
    return {
      id: "hire",
      title: "Hire your next agent",
      detail: `A seat costs ${formatAmount(seatCost)} Cash. Pick the specialist whose activity you need next.`,
    };
  }

  if (state.workers.length === 1 && seatCost !== null) {
    return {
      id: "save-agent",
      title: "Save for your first agent",
      detail: `You have ${formatAmount(state.resources.cash)} of ${formatAmount(seatCost)} Cash. Day job tasks earns the rest.`,
    };
  }

  if (
    index !== null &&
    state.workers.every((worker) => worker.activity !== "build") &&
    !isVentureGated(state)
  ) {
    return {
      id: "build",
      title: "Start the next venture",
      detail: "Assign a worker to Build venture. It burns Credits and Know-how for every build point.",
    };
  }

  if (canUpgradeSubscription(state)) {
    const cost = subscriptionUpgradeCost(state.subscriptionTier);
    return {
      id: "subscription",
      title: "Upgrade your subscription",
      detail: `Generation ${latestGeneration(state)} is out. Pay ${formatAmount(cost ?? 0)} Cash to keep Edge at 1.5x.`,
    };
  }

  if (
    isSystemUnlocked(state, "automations") &&
    state.workers.some(
      (worker) => worker.kind !== "you" && worker.activity !== null && worker.automation === null,
    )
  ) {
    return {
      id: "automation",
      title: "Record an automation",
      detail: "Freeze half of an agent's current output so it keeps working after the agent moves.",
    };
  }

  if (
    state.resources.cash >= promptCost(state.promptLevel) ||
    state.resources.knowHow >= skillsCost(state.skillsLevel)
  ) {
    return {
      id: "upgrade",
      title: "Buy an upgrade",
      detail: "The Prompt library and Skills add permanent output for every worker.",
    };
  }

  return {
    id: "keep-going",
    title: "Keep the loop running",
    detail: "Do it yourself adds 1.5 seconds of work. Progress saves in this browser.",
  };
}
