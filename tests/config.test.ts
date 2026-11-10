import { describe, expect, it } from "vitest";
import { AGENT_KINDS, AGENT_SEAT_COSTS, MAX_AGENTS } from "../src/engine/config";

describe("config", () => {
  it("has one seat cost per agent kind", () => {
    expect(MAX_AGENTS).toBe(AGENT_KINDS.length);
    expect(AGENT_SEAT_COSTS).toHaveLength(MAX_AGENTS);
  });
});
