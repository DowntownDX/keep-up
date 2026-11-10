import { describe, expect, it } from "vitest";
import { App } from "../src/App";

describe("scaffold", () => {
  it("exports the app root", () => {
    expect(typeof App).toBe("function");
  });
});
