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
