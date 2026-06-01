import { env } from "cloudflare:workers";

/**
 * App-level environment shape. D1 binding comes from wrangler.jsonc;
 * the three secrets are set via `wrangler secret put` (and `.dev.vars`
 * locally) so they are NOT in the generated Env type — we declare them here.
 */
export interface AppEnv {
  DB: D1Database;
  GEMINI_API_KEY: string;
  APP_PASSWORD: string;
  SESSION_SECRET: string;
}

export const appEnv = env as unknown as AppEnv;

/**
 * Read a required secret/binding, throwing a clear error if it is missing
 * rather than letting `undefined` flow into cookie crypto or the DB driver
 * and surface later as a cryptic failure.
 */
export function requireEnv(key: keyof AppEnv): string {
  const value = appEnv[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(
      `Missing required environment value "${String(key)}". ` +
        `Set it via \`wrangler secret put ${String(key)}\` (prod) or in .dev.vars (local).`,
    );
  }
  return value;
}
