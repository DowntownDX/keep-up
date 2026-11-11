import { ACTIVITY_IDS, VENTURE_NAMES } from "../engine/config";
import { latestGeneration } from "../engine/releases";
import type { GameState } from "../engine/state";
import { ACTIVITY_NAMES, WORKER_LABELS } from "./labels";

export type FeedKind =
  | "venture"
  | "skill"
  | "hire"
  | "prompt"
  | "skills"
  | "subscription"
  | "automation"
  | "release";

export interface FeedDraft {
  kind: FeedKind;
  text: string;
}

export interface FeedEvent extends FeedDraft {
  id: number;
  atSeconds: number;
}

export interface FeedState {
  events: FeedEvent[];
  last: GameState;
  nextId: number;
  resetToken: number;
}

export const FEED_CAP = 6;

/** Newest first; drop the oldest when the cap is reached. */
export function appendFeed(
  feed: FeedEvent[],
  incoming: FeedEvent[],
  cap = FEED_CAP,
): FeedEvent[] {
  if (incoming.length === 0) return feed;
  return [...incoming, ...feed].slice(0, cap);
}

/**
 * A reset is the only in-session move that lowers these fields. A loaded save
 * starts the hook, so it is never compared against a fresh game.
 */
export function isReset(prev: GameState, next: GameState): boolean {
  return (
    next.elapsedSeconds < prev.elapsedSeconds ||
    next.venturesShipped < prev.venturesShipped ||
    next.workers.length < prev.workers.length
  );
}

export function diffEvents(prev: GameState, next: GameState): FeedDraft[] {
  const events: FeedDraft[] = [];

  const shipped = next.venturesShipped - prev.venturesShipped;
  if (shipped > 0) {
    events.push({
      kind: "venture",
      text:
        shipped === 1
          ? `Shipped ${VENTURE_NAMES[next.venturesShipped - 1]}`
          : `Shipped ${shipped} ventures`,
    });
  }

  const generation = latestGeneration(next);
  const released = generation - latestGeneration(prev);
  if (released > 0) {
    events.push({
      kind: "release",
      text:
        released === 1
          ? `Generation ${generation} released`
          : `${released} generations released`,
    });
  }

  for (const worker of next.workers) {
    if (!prev.workers.some((candidate) => candidate.id === worker.id)) {
      events.push({ kind: "hire", text: `${WORKER_LABELS[worker.kind]} hired` });
    }
  }

  for (const worker of next.workers) {
    const before = prev.workers.find((candidate) => candidate.id === worker.id);
    if (!before) continue;

    for (const activity of ACTIVITY_IDS) {
      const was = before.skills[activity]?.level ?? 1;
      const now = worker.skills[activity]?.level ?? 1;
      if (now > was) {
        events.push({
          kind: "skill",
          text: `${WORKER_LABELS[worker.kind]}: ${ACTIVITY_NAMES[activity]} ${
            now === was + 1 ? `level ${now}` : `${was} → ${now}`
          }`,
        });
      }
    }

    if (
      worker.automation &&
      (!before.automation ||
        before.automation.activity !== worker.automation.activity ||
        before.automation.rate !== worker.automation.rate)
    ) {
      events.push({
        kind: "automation",
        text: `${WORKER_LABELS[worker.kind]}: automation ${
          before.automation ? "updated" : "recorded"
        } (${ACTIVITY_NAMES[worker.automation.activity]})`,
      });
    }
  }

  if (next.promptLevel > prev.promptLevel) {
    events.push({ kind: "prompt", text: `Prompt library level ${next.promptLevel}` });
  }
  if (next.skillsLevel > prev.skillsLevel) {
    events.push({ kind: "skills", text: `Skills level ${next.skillsLevel}` });
  }
  if (next.subscriptionTier > prev.subscriptionTier) {
    events.push({
      kind: "subscription",
      text: `Subscription tier ${next.subscriptionTier}`,
    });
  }

  return events;
}

export function createFeedState(state: GameState, resetToken = 0): FeedState {
  return { events: [], last: state, nextId: 0, resetToken };
}

export function reduceFeed(
  feed: FeedState,
  next: GameState,
  resetToken = feed.resetToken,
): FeedState {
  if (resetToken !== feed.resetToken || isReset(feed.last, next)) {
    return createFeedState(next, resetToken);
  }

  const drafts = diffEvents(feed.last, next);
  if (drafts.length === 0) {
    return feed.last === next ? feed : { ...feed, last: next };
  }

  let id = feed.nextId;
  const incoming = drafts.map((draft) => ({
    ...draft,
    id: (id += 1),
    atSeconds: next.elapsedSeconds,
  }));
  return {
    events: appendFeed(feed.events, incoming),
    last: next,
    nextId: id,
    resetToken,
  };
}
