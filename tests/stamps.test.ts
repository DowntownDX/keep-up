import { describe, expect, it } from "vitest";
import {
  MAX_AGENTS,
  MAX_SUBSCRIPTION_TIER,
  VENTURE_COUNT,
} from "../src/engine/config";
import { releaseTime } from "../src/engine/releases";
import { createInitialState, createWorker, type GameState } from "../src/engine/state";
import { STAMPS, earnedStamps } from "../src/ui/stamps";

const stamp = (id: string) => {
  const found = STAMPS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`missing stamp ${id}`);
  return found;
};

function evolved(change: (state: GameState) => void): GameState {
  const state = structuredClone(createInitialState());
  change(state);
  return state;
}

describe("stamps", () => {
  it("starts with nothing earned", () => {
    expect(earnedStamps(createInitialState())).toEqual([]);
  });

  it("earns venture stamps at their thresholds", () => {
    expect(stamp("first-ship").earned(evolved((state) => (state.venturesShipped = 0)))).toBe(false);
    expect(stamp("first-ship").earned(evolved((state) => (state.venturesShipped = 1)))).toBe(true);
    expect(stamp("five-ships").earned(evolved((state) => (state.venturesShipped = 4)))).toBe(false);
    expect(stamp("five-ships").earned(evolved((state) => (state.venturesShipped = 5)))).toBe(true);
    expect(
      stamp("ten-ships").earned(evolved((state) => (state.venturesShipped = VENTURE_COUNT - 1))),
    ).toBe(false);
    expect(
      stamp("ten-ships").earned(evolved((state) => (state.venturesShipped = VENTURE_COUNT))),
    ).toBe(true);
  });

  it("earns crew stamps at their thresholds", () => {
    const withAgents = (count: number) =>
      evolved((state) => {
        for (let index = 1; index <= count; index += 1) {
          state.workers.push(createWorker(`agent-${index}`, "assistant"));
        }
      });

    expect(stamp("first-hire").earned(withAgents(0))).toBe(false);
    expect(stamp("first-hire").earned(withAgents(1))).toBe(true);
    expect(stamp("full-crew").earned(withAgents(MAX_AGENTS - 1))).toBe(false);
    expect(stamp("full-crew").earned(withAgents(MAX_AGENTS))).toBe(true);
  });

  it("earns tier, automation and generation stamps", () => {
    expect(MAX_SUBSCRIPTION_TIER).toBeGreaterThanOrEqual(5);
    expect(stamp("tier-five").earned(evolved((state) => (state.subscriptionTier = 4)))).toBe(false);
    expect(stamp("tier-five").earned(evolved((state) => (state.subscriptionTier = 5)))).toBe(true);

    expect(stamp("automated").earned(createInitialState())).toBe(false);
    expect(
      stamp("automated").earned(
        evolved((state) => {
          state.workers[0].automation = { activity: "content", rate: 0.1 };
        }),
      ),
    ).toBe(true);

    expect(
      stamp("gen-five").earned(evolved((state) => (state.elapsedSeconds = releaseTime(5) - 1))),
    ).toBe(false);
    expect(
      stamp("gen-five").earned(evolved((state) => (state.elapsedSeconds = releaseTime(5)))),
    ).toBe(true);
  });

  it("has unique ids, labels and reachable bounds", () => {
    expect(new Set(STAMPS.map((entry) => entry.id)).size).toBe(STAMPS.length);
    expect(STAMPS.every((entry) => entry.label.trim().length > 0)).toBe(true);
    expect(VENTURE_COUNT).toBeGreaterThanOrEqual(10);
    expect(MAX_AGENTS + 1).toBeGreaterThanOrEqual(6);
  });

  it("returns to nothing earned after a reset", () => {
    const rich = evolved((state) => {
      state.venturesShipped = VENTURE_COUNT;
      state.subscriptionTier = 5;
      state.elapsedSeconds = releaseTime(5);
      state.workers[0].automation = { activity: "content", rate: 0.1 };
      for (let index = 1; index <= MAX_AGENTS; index += 1) {
        state.workers.push(createWorker(`agent-${index}`, "assistant"));
      }
    });

    expect(earnedStamps(rich).length).toBe(STAMPS.length);
    expect(earnedStamps(createInitialState())).toEqual([]);
  });
});
