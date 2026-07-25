import { describe, it, expect } from "vitest";
import {
  DEFAULT_DIRECTION,
  DIRECTION_META,
  isDirection,
  otherDirection,
  parseDirection,
  toCanonicalExample,
} from "./direction";

describe("parseDirection / isDirection", () => {
  it("accepts valid directions", () => {
    expect(parseDirection("c2f")).toBe("c2f");
    expect(parseDirection("f2c")).toBe("f2c");
  });
  it("falls back to default on invalid/missing", () => {
    expect(parseDirection("nonsense")).toBe(DEFAULT_DIRECTION);
    expect(parseDirection(null)).toBe(DEFAULT_DIRECTION);
    expect(parseDirection(undefined)).toBe(DEFAULT_DIRECTION);
  });
  it("isDirection narrows correctly", () => {
    expect(isDirection("c2f")).toBe(true);
    expect(isDirection("x")).toBe(false);
  });
});

describe("otherDirection", () => {
  it("flips", () => {
    expect(otherDirection("c2f")).toBe("f2c");
    expect(otherDirection("f2c")).toBe("c2f");
  });
});

describe("DIRECTION_META", () => {
  it("has both directions with required fields", () => {
    for (const d of ["c2f", "f2c"] as const) {
      expect(DIRECTION_META[d].sourceLabel).toBeTruthy();
      expect(DIRECTION_META[d].targetLabel).toBeTruthy();
      expect(DIRECTION_META[d].buttonText).toBeTruthy();
      expect(DIRECTION_META[d].badge).toBeTruthy();
    }
  });
});

describe("toCanonicalExample", () => {
  it("c2f: original=Cantonese, translated=Traditional", () => {
    expect(toCanonicalExample("c2f", "廣東話", "書面語")).toEqual({
      cantonese: "廣東話",
      traditional: "書面語",
    });
  });
  it("f2c: swaps so canonical stays (cantonese, traditional)", () => {
    expect(toCanonicalExample("f2c", "書面語", "廣東話")).toEqual({
      cantonese: "廣東話",
      traditional: "書面語",
    });
  });
});
