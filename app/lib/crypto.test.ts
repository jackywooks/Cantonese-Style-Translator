import { describe, it, expect } from "vitest";
import { encryptWithSecret, decryptWithSecret } from "./crypto";

const SECRET = "test-session-secret-长-random-string";

describe("crypto round-trip", () => {
  it("decrypts what it encrypts", async () => {
    const plain = "sk-my-gemini-api-key-1234";
    const enc = await encryptWithSecret(SECRET, plain);
    expect(enc).not.toContain(plain); // ciphertext, not plaintext
    expect(await decryptWithSecret(SECRET, enc)).toBe(plain);
  });

  it("produces different ciphertext each time (random IV)", async () => {
    const a = await encryptWithSecret(SECRET, "same");
    const b = await encryptWithSecret(SECRET, "same");
    expect(a).not.toBe(b);
    expect(await decryptWithSecret(SECRET, a)).toBe("same");
    expect(await decryptWithSecret(SECRET, b)).toBe("same");
  });

  it("fails to decrypt with the wrong secret", async () => {
    const enc = await encryptWithSecret(SECRET, "secret-value");
    await expect(decryptWithSecret("wrong-secret", enc)).rejects.toThrow();
  });

  it("fails on tampered ciphertext", async () => {
    const enc = await encryptWithSecret(SECRET, "secret-value");
    const tampered = enc.slice(0, -2) + (enc.slice(-2) === "AA" ? "BB" : "AA");
    await expect(decryptWithSecret(SECRET, tampered)).rejects.toThrow();
  });
});
