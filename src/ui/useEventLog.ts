import { useEffect, useState } from "react";
import type { GameState } from "../engine/state";
import { createFeedState, reduceFeed, type FeedEvent } from "./events";

/**
 * Diff the live state into a short ledger. The first state seeds the baseline,
 * so a load or a StrictMode mount records nothing. A reset token clears the
 * feed even when the reset happens before the clock has moved.
 */
export function useEventLog(state: GameState, resetToken: number): FeedEvent[] {
  const [feed, setFeed] = useState(() => createFeedState(state, resetToken));

  useEffect(() => {
    setFeed((current) => reduceFeed(current, state, resetToken));
  }, [state, resetToken]);

  return feed.events;
}
