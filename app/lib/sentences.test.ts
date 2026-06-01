import { describe, it, expect } from "vitest";
import { splitSentences, parseMarkers, buildMarkedText } from "./sentences";

describe("splitSentences", () => {
  it("splits by terminators", () => {
    expect(splitSentences("你食咗飯未呀？我食咗喇。")).toEqual([
      "你食咗飯未呀？",
      "我食咗喇。",
    ]);
  });
  it("keeps 「…」 quoted blocks intact", () => {
    expect(splitSentences("佢話「我唔去喇」。")).toEqual([
      "佢話",
      "「我唔去喇」",
      "。",
    ]);
  });
  it("treats text with no terminator as one sentence", () => {
    expect(splitSentences("食飯")).toEqual(["食飯"]);
  });
  it("returns [] for empty input", () => {
    expect(splitSentences("   ")).toEqual([]);
  });
});

describe("buildMarkedText", () => {
  it("prefixes each sentence with [S:N]", () => {
    expect(buildMarkedText(["A。", "B。"])).toBe("[S:1] A。 [S:2] B。");
  });
});

describe("parseMarkers", () => {
  it("maps markers back to text, joining multi-part segments", () => {
    const out = "[S:1] 第一. [S:2] 第二甲. [S:2] 第二乙.";
    expect(parseMarkers(out)).toEqual({
      "[S:1]": "第一.",
      "[S:2]": "第二甲. 第二乙.",
    });
  });
  it("returns empty object for output with no markers", () => {
    expect(parseMarkers("just text")).toEqual({});
  });
});
