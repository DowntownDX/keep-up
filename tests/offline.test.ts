import { describe, expect, it } from "vitest";
import { createInitialState, type GameState } from "../src/engine/state";
import { step, stepOffline } from "../src/engine/step";

function runningState(): GameState {
  const state = createInitialState();
  state.resources.credits = 1_000_000;
  state.resources.knowHow = 1_000_000;
  state.workers[0].activity = "build";
  return state;
}

describe("stepOffline", () => {
  it("matches 8 hours of one-second steps", () => {
    const offline = runningState();
    stepOffline(offline, 8 * 60 * 60);

    const stepped = runningState();
    for (let i = 0; i < 8 * 60 * 60; i += 1) step(stepped, 1);

    expect(offline).toEqual(stepped);
  });

  it("caps a longer absence at 8 hours", () => {
    const nineHours = runningState();
    stepOffline(nineHours, 9 * 60 * 60);

    const eightHours = runningState();
    stepOffline(eightHours, 8 * 60 * 60);

    expect(nineHours).toEqual(eightHours);
  });

  it("ignores negative, zero, NaN and infinite elapsed time", () => {
    const state = runningState();
    const before = structuredClone(state);

    for (const elapsed of [-1, 0, Number.NaN, Number.POSITIVE_INFINITY]) {
      stepOffline(state, elapsed);
    }

    expect(state).toEqual(before);
  });
});
