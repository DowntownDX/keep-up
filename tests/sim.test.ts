import { describe, expect, it } from "vitest";
import { runBot } from "../src/sim/bot";

describe("sim bot", () => {
  it("ships venture 1 within ten minutes without negative resources", () => {
    const { report } = runBot(10 / (24 * 60), 5);

    expect(report.sawNegativeResource).toBe(false);
    expect(report.milestones.firstAgent).not.toBeNull();
    expect(report.milestones.venture1).not.toBeNull();
    expect(report.hires.length).toBeGreaterThan(0);
  });

  it("is deterministic", () => {
    const first = runBot(1).report;
    const second = runBot(1).report;

    expect(second.ventures).toEqual(first.ventures);
    expect(second.milestones).toEqual(first.milestones);
    expect(second.edgeChanges).toEqual(first.edgeChanges);
    expect(second.hires).toEqual(first.hires);
  });

  it("rejects a non-positive horizon", () => {
    expect(() => runBot(0)).toThrow(RangeError);
    expect(() => runBot(-1)).toThrow(RangeError);
    expect(() => runBot(1, 0)).toThrow(RangeError);
  });
});
