import { requireEnv } from "./env.server";
import { decryptWithSecret, encryptWithSecret } from "./crypto";

/** Encrypt plaintext using SESSION_SECRET → base64(iv ‖ ciphertext). */
export function encrypt(plaintext: string): Promise<string> {
  return encryptWithSecret(requireEnv("SESSION_SECRET"), plaintext);
}

/** Decrypt base64(iv ‖ ciphertext) using SESSION_SECRET. Throws on tamper. */
export function decrypt(stored: string): Promise<string> {
  return decryptWithSecret(requireEnv("SESSION_SECRET"), stored);
}
