import { MAX_AGENTS, MAX_SUBSCRIPTION_TIER, VENTURE_COUNT } from "../engine/config";
import { latestGeneration } from "../engine/releases";
import type { GameState } from "../engine/state";

export interface Stamp {
  id: string;
  label: string;
  earned: (state: GameState) => boolean;
}

export const STAMPS: readonly Stamp[] = [
  {
    id: "first-ship",
    label: "First ship",
    earned: (state) => state.venturesShipped >= 1,
  },
  {
    id: "five-ships",
    label: "Five ventures",
    earned: (state) => state.venturesShipped >= 5,
  },
  {
    id: "ten-ships",
    label: "Ten ventures",
    earned: (state) => state.venturesShipped >= VENTURE_COUNT,
  },
  {
    id: "first-hire",
    label: "First hire",
    earned: (state) => state.workers.length >= 2,
  },
  {
    id: "full-crew",
    label: "Full crew",
    earned: (state) => state.workers.length >= MAX_AGENTS + 1,
  },
  {
    id: "tier-five",
    label: "Tier 5",
    earned: (state) => state.subscriptionTier >= 5 && state.subscriptionTier <= MAX_SUBSCRIPTION_TIER,
  },
  {
    id: "automated",
    label: "Automated",
    earned: (state) => state.workers.some((worker) => worker.automation !== null),
  },
  {
    id: "gen-five",
    label: "Gen 5",
    earned: (state) => latestGeneration(state) >= 5,
  },
];

export function earnedStamps(state: GameState): Stamp[] {
  return STAMPS.filter((stamp) => stamp.earned(state));
}
