import { describe, expect, it } from "vitest";
import { VENTURE_NAMES } from "../src/engine/config";
import { releaseTime } from "../src/engine/releases";
import { createInitialState, createWorker, type GameState } from "../src/engine/state";
import {
  FEED_CAP,
  appendFeed,
  createFeedState,
  diffEvents,
  isReset,
  reduceFeed,
  type FeedEvent,
} from "../src/ui/events";

function evolved(change: (state: GameState) => void): GameState {
  const state = structuredClone(createInitialState());
  change(state);
  return state;
}

describe("diffEvents", () => {
  it("records nothing for an identical state", () => {
    const state = createInitialState();
    expect(diffEvents(state, structuredClone(state))).toEqual([]);
  });

  it("records a single venture by name and several as one line", () => {
    const start = createInitialState();
    const one = evolved((state) => {
      state.venturesShipped = 1;
    });
    expect(diffEvents(start, one)).toEqual([
      { kind: "venture", text: `Shipped ${VENTURE_NAMES[0]}` },
    ]);

    const three = evolved((state) => {
      state.venturesShipped = 3;
    });
    expect(diffEvents(start, three)).toEqual([
      { kind: "venture", text: "Shipped 3 ventures" },
    ]);
  });

  it("records one skill line per worker and activity, with the span", () => {
    const start = createInitialState();
    const levelTwo = evolved((state) => {
      state.workers[0].skills.content.level = 2;
    });
    expect(diffEvents(start, levelTwo)).toEqual([
      { kind: "skill", text: "You: Make content level 2" },
    ]);

    const levelFour = evolved((state) => {
      state.workers[0].skills.content.level = 4;
    });
    expect(diffEvents(start, levelFour)).toEqual([
      { kind: "skill", text: "You: Make content 1 → 4" },
    ]);
  });

  it("keeps two workers levelling the same skill as two events", () => {
    const start = evolved((state) => {
      state.workers.push(createWorker("agent-1", "creator"));
    });
    const next = structuredClone(start);
    next.workers[0].skills.content.level = 2;
    next.workers[1].skills.content.level = 2;

    const drafts = diffEvents(start, next);
    expect(drafts).toHaveLength(2);
    expect(drafts.map((draft) => draft.text)).toEqual([
      "You: Make content level 2",
      "Creator agent: Make content level 2",
    ]);

    const feed = reduceFeed(createFeedState(start), next);
    expect(feed.events).toHaveLength(2);
    expect(new Set(feed.events.map((event) => event.id)).size).toBe(2);
  });

  it("records hires, upgrades and automation", () => {
    const start = createInitialState();
    const next = evolved((state) => {
      state.workers.push(createWorker("agent-1", "assistant"));
      state.promptLevel = 1;
      state.skillsLevel = 1;
      state.subscriptionTier = 2;
      state.workers[0].automation = { activity: "content", rate: 0.1 };
    });

    expect(diffEvents(start, next).map((draft) => draft.kind)).toEqual([
      "hire",
      "automation",
      "prompt",
      "skills",
      "subscription",
    ]);
  });

  it("does not record the same automation twice", () => {
    const recorded = evolved((state) => {
      state.workers[0].automation = { activity: "content", rate: 0.1 };
    });
    expect(diffEvents(recorded, structuredClone(recorded))).toEqual([]);
  });

  it("records a release once per generation step and aggregates several", () => {
    const start = createInitialState();
    const one = evolved((state) => {
      state.elapsedSeconds = releaseTime(2);
    });
    expect(diffEvents(start, one)).toEqual([
      { kind: "release", text: "Generation 2 released" },
    ]);
    expect(diffEvents(one, structuredClone(one))).toEqual([]);

    const two = evolved((state) => {
      state.elapsedSeconds = releaseTime(3);
    });
    expect(diffEvents(start, two)).toEqual([
      { kind: "release", text: "2 generations released" },
    ]);
  });

  it("uses the next state's elapsed seconds for every event", () => {
    const start = createInitialState();
    const next = evolved((state) => {
      state.elapsedSeconds = 42;
      state.venturesShipped = 1;
    });
    expect(diffEvents(start, next)[0]).toBeDefined();
    const feed = reduceFeed(createFeedState(start), next);
    expect(feed.events.every((event) => event.atSeconds === 42)).toBe(true);
  });
});

describe("isReset", () => {
  it("flags each backward field and ignores forward moves", () => {
    const start = evolved((state) => {
      state.elapsedSeconds = 100;
      state.venturesShipped = 2;
      state.workers.push(createWorker("agent-1", "assistant"));
    });

    expect(isReset(start, createInitialState())).toBe(true);
    expect(
      isReset(start, { ...structuredClone(start), elapsedSeconds: 99 }),
    ).toBe(true);
    expect(
      isReset(start, { ...structuredClone(start), venturesShipped: 1 }),
    ).toBe(true);
    expect(
      isReset(start, { ...structuredClone(start), workers: [start.workers[0]] }),
    ).toBe(true);
    expect(isReset(start, structuredClone(start))).toBe(false);
  });
});

describe("reduceFeed", () => {
  it("seeds from the loaded state and records nothing on the second mount pass", () => {
    const loaded = evolved((state) => {
      state.elapsedSeconds = 10_000;
      state.venturesShipped = 4;
      state.workers.push(createWorker("agent-1", "creator"));
    });
    const seeded = createFeedState(loaded);

    expect(seeded.events).toEqual([]);
    expect(reduceFeed(seeded, loaded)).toBe(seeded);
  });

  it("clears when the state resets", () => {
    const start = createInitialState();
    const shipped = evolved((state) => {
      state.venturesShipped = 1;
      state.elapsedSeconds = 60;
    });
    const feed = reduceFeed(createFeedState(start), shipped);
    expect(feed.events).toHaveLength(1);

    const reset = reduceFeed(feed, createInitialState());
    expect(reset.events).toEqual([]);
    expect(reset.nextId).toBe(0);
  });

  it("clears on a reset token even when the clock has not moved", () => {
    const start = createInitialState();
    const leveled = structuredClone(start);
    leveled.workers[0].skills.dayJob.level = 2;
    const feed = reduceFeed(createFeedState(start, 0), leveled, 0);
    expect(feed.events).toHaveLength(1);

    const reset = reduceFeed(feed, createInitialState(), 1);
    expect(reset.events).toEqual([]);
    expect(reset.resetToken).toBe(1);
  });

  it("caps the feed newest first and drops the oldest", () => {
    let current = createInitialState();
    let feed = createFeedState(current);
    for (let level = 1; level <= FEED_CAP + 2; level += 1) {
      const next = structuredClone(current);
      next.promptLevel = level;
      feed = reduceFeed(feed, next);
      current = next;
    }

    expect(feed.events).toHaveLength(FEED_CAP);
    expect(feed.events[0]?.text).toBe(`Prompt library level ${FEED_CAP + 2}`);
    expect(feed.events.at(-1)?.text).toBe(`Prompt library level 3`);
    expect(new Set(feed.events.map((event) => event.id)).size).toBe(FEED_CAP);
  });
});

describe("appendFeed", () => {
  it("prepends incoming events and keeps the cap", () => {
    const older: FeedEvent[] = [
      { id: 2, atSeconds: 2, kind: "prompt", text: "old" },
      { id: 1, atSeconds: 1, kind: "prompt", text: "older" },
    ];
    const incoming: FeedEvent[] = [
      { id: 4, atSeconds: 4, kind: "venture", text: "new" },
      { id: 3, atSeconds: 4, kind: "skill", text: "next" },
    ];
    expect(appendFeed(older, incoming, 3).map((event) => event.id)).toEqual([4, 3, 2]);
  });
});
