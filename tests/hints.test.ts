import { describe, expect, it } from "vitest";
import { assignActivity } from "../src/engine/actions";
import { createInitialState, createWorker, type GameState } from "../src/engine/state";
import { nextHint } from "../src/ui/hints";

function assign(state: GameState, activity: Parameters<typeof assignActivity>[2]): void {
  if (!assignActivity(state, "you", activity)) throw new Error(`could not assign ${activity}`);
}

describe("nextHint", () => {
  it("starts by putting someone to work", () => {
    expect(nextHint(createInitialState()).id).toBe("start");
  });

  it("celebrates a finished run", () => {
    const state = createInitialState();
    state.venturesShipped = 10;
    expect(nextHint(state).id).toBe("won");
  });

  it("points at Followers when a venture is gated", () => {
    const state = createInitialState();
    state.venturesShipped = 5;
    assign(state, "content");

    const hint = nextHint(state);

    expect(hint.id).toBe("gate");
    expect(hint.detail).toMatch(/1\.1M Followers/);
  });

  it("tells the player to hire once the seat is affordable", () => {
    const state = createInitialState();
    assign(state, "dayJob");
    state.resources.cash = 40;

    expect(nextHint(state).id).toBe("hire");
  });

  it("tells the first worker to save for an agent", () => {
    const state = createInitialState();
    assign(state, "dayJob");

    expect(nextHint(state).id).toBe("save-agent");
  });

  it("points at the build activity when nobody is building", () => {
    const state = createInitialState();
    state.workers.push(createWorker("agent-1", "tutor"));
    state.nextAgentNumber = 2;
    assign(state, "learn");
    state.resources.cash = 0;

    expect(nextHint(state).id).toBe("build");
  });

  it("suggests a subscription when the generation is out and affordable", () => {
    const state = createInitialState();
    state.elapsedSeconds = 150;
    state.workers.push(createWorker("agent-1", "tutor"));
    state.nextAgentNumber = 2;
    assign(state, "build");
    assignActivity(state, "agent-1", "learn");
    state.resources.cash = 25;

    expect(nextHint(state).id).toBe("subscription");
  });

  it("suggests recording an automation once it is unlocked", () => {
    const state = createInitialState();
    state.venturesShipped = 2;
    state.workers.push(createWorker("agent-1", "creator"));
    state.nextAgentNumber = 2;
    assign(state, "build");
    assignActivity(state, "agent-1", "content");

    expect(nextHint(state).id).toBe("automation");
  });

  it("suggests an upgrade when nothing else is waiting", () => {
    const state = createInitialState();
    state.venturesShipped = 2;
    state.workers.push(createWorker("agent-1", "builder"));
    state.nextAgentNumber = 2;
    assign(state, "build");
    assignActivity(state, "agent-1", "build");
    state.workers[1].automation = { activity: "build", rate: 0.5 };
    state.resources.cash = 25;

    expect(nextHint(state).id).toBe("upgrade");
  });

  it("falls back to the loop hint", () => {
    const state = createInitialState();
    state.workers.push(createWorker("agent-1", "builder"));
    state.nextAgentNumber = 2;
    assign(state, "build");
    assignActivity(state, "agent-1", "build");
    state.resources.cash = 0;
    state.resources.knowHow = 0;

    expect(nextHint(state).id).toBe("keep-going");
  });
});
