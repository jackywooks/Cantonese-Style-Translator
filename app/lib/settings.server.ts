import { appEnv } from "./env.server";
import { decrypt, encrypt } from "./crypto.server";
import { DEFAULT_GEMINI_MODEL } from "./models";
import { maskSecret } from "./mask";

const KEY_API = "gemini_api_key";
const KEY_MODEL = "gemini_model";

function db(): D1Database {
  return appEnv.DB;
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await db()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .bind(key)
    .first<{ value: string }>();
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db()
    .prepare(
      "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) " +
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    )
    .bind(key, value)
    .run();
}

export async function deleteSetting(key: string): Promise<void> {
  await db().prepare("DELETE FROM settings WHERE key = ?").bind(key).run();
}

/** Resolve the effective Gemini key: saved (decrypted) Settings key overrides
 *  the GEMINI_API_KEY Worker secret. Throws only if neither exists. */
export async function getGeminiApiKey(): Promise<string> {
  const stored = await getSetting(KEY_API);
  if (stored) {
    try {
      return await decrypt(stored);
    } catch {
      // Undecryptable (e.g. SESSION_SECRET rotated) — fall through to secret.
    }
  }
  const secret = appEnv.GEMINI_API_KEY;
  if (secret) return secret;
  throw new Error(
    "No Gemini API key configured. Add one on the Settings page.",
  );
}

export async function setGeminiApiKey(plaintext: string): Promise<void> {
  await setSetting(KEY_API, await encrypt(plaintext));
}

export async function clearGeminiApiKey(): Promise<void> {
  await deleteSetting(KEY_API);
}

export async function getGeminiModel(): Promise<string> {
  return (await getSetting(KEY_MODEL)) ?? DEFAULT_GEMINI_MODEL;
}

export async function setGeminiModel(model: string): Promise<void> {
  await setSetting(KEY_MODEL, model);
}

export interface ApiKeyStatus {
  source: "settings" | "secret" | "none";
  hint: string | null;
}

/** Where the effective key comes from + a masked hint. Never returns the key. */
export async function getApiKeyStatus(): Promise<ApiKeyStatus> {
  const stored = await getSetting(KEY_API);
  if (stored) {
    try {
      return { source: "settings", hint: maskSecret(await decrypt(stored)) };
    } catch {
      // fall through to secret check
    }
  }
  if (appEnv.GEMINI_API_KEY) {
    return { source: "secret", hint: maskSecret(appEnv.GEMINI_API_KEY) };
  }
  return { source: "none", hint: null };
}
