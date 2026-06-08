import { describe, it, expect } from "vitest";
import { maskSecret } from "./mask";

describe("maskSecret", () => {
  it("shows only the last 4 chars", () => {
    expect(maskSecret("sk-abcd1234")).toBe("••••1234");
  });
  it("returns null for empty / nullish", () => {
    expect(maskSecret("")).toBeNull();
    expect(maskSecret(null)).toBeNull();
    expect(maskSecret(undefined)).toBeNull();
  });
  it("handles short secrets without leaking length beyond 4", () => {
    expect(maskSecret("ab")).toBe("••••ab");
  });
});
