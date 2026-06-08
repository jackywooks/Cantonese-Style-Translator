# Settings-configurable Gemini key (+ model picker) — Design

**Date:** 2026-06-01
**Status:** Approved design — ready for implementation plan
**Branch:** `feature/settings-gemini-key`
**Builds on:** the merged React Router v7 + Cloudflare Workers + D1 app (PRs #2, #3).

---

## 1. Goal

Let the single user set/update/clear the **Gemini API key** and choose the **Gemini model** from an in-app **Settings page**, instead of the key being a deploy-only Worker secret. The key is stored **encrypted at rest** in D1, shown masked, and never sent back to the client.

## 2. Non-goals (this PR)

- Changing the `APP_PASSWORD` from the UI (still a Worker secret).
- Multi-user / per-user settings (app is single-user).
- Any other settings beyond the API key + model.
- Bidirectional translation (separate spec/PR).

## 3. Decisions (from brainstorm)

| Decision | Choice |
|---|---|
| Storage | D1 `settings` table, API key **encrypted at rest** (AES-GCM) |
| Precedence | **Settings key overrides** the `GEMINI_API_KEY` Worker secret (secret = fallback) |
| Scope | API key (set / update / clear / test) **+ model picker** |
| Key exposure | Plaintext key **never** returned to the client; UI shows a masked hint only |

## 4. Data model

New migration `migrations/0003_settings.sql`:

```sql
CREATE TABLE settings (
  key        TEXT PRIMARY KEY,           -- 'gemini_api_key' | 'gemini_model'
  value      TEXT NOT NULL,              -- encrypted base64 for the key; plain string for model
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Generic key/value table (room for future settings without schema churn). Two keys used now:
- `gemini_api_key` → AES-GCM ciphertext, base64(`iv` ‖ `ciphertext`).
- `gemini_model` → plaintext model id (e.g. `gemini-2.5-flash`).

## 5. Crypto — `app/lib/crypto.server.ts`

AES-GCM via Web Crypto (available in the Workers runtime), keyed off `SESSION_SECRET`:

- `deriveKey()` — `crypto.subtle.importKey` on `SHA-256(SESSION_SECRET)` → AES-GCM `CryptoKey` (256-bit).
- `encrypt(plaintext): Promise<string>` — random 12-byte IV; returns base64 of `iv ‖ ciphertext`.
- `decrypt(stored): Promise<string>` — split IV/ciphertext, decrypt; throws on tamper/wrong key.

Rationale: protects the key in DB dumps / D1 console reads. The app can still decrypt (the secret lives in the Worker env) — this is defense-in-depth, not a vault. `SESSION_SECRET` must exist (already enforced by `requireEnv`); rotating it makes a stored key undecryptable → app falls back to the Worker secret and the UI shows "Not configured" so the user re-saves.

## 6. Resolution — `app/lib/settings.server.ts`

Thin layer over D1 + crypto:

- `getSetting(key): Promise<string | null>` — raw value or null.
- `setSetting(key, value): Promise<void>` — upsert (`INSERT … ON CONFLICT(key) DO UPDATE`).
- `deleteSetting(key): Promise<void>`.
- `getGeminiApiKey(): Promise<string>` — if `gemini_api_key` row exists → `decrypt()`; else `appEnv.GEMINI_API_KEY`. Throws (clear message) only if neither exists.
- `setGeminiApiKey(plaintext): Promise<void>` — `encrypt()` then upsert.
- `clearGeminiApiKey(): Promise<void>` — delete row (→ falls back to secret).
- `getGeminiModel(): Promise<string>` — `gemini_model` row or default `"gemini-2.5-flash"`.
- `getApiKeyStatus(): Promise<{ source: "settings" | "secret" | "none"; hint: string | null }>` — `hint` is a masked tail like `••••1234` derived from the (decrypted) key; **never** the full key.

## 7. Integration with existing code

- `app/lib/gemini.server.ts`: `translateTextWithExamples(apiKey, model, marked, examples)` — model becomes a **parameter** (drop the hardcoded `MODEL_NAME` constant; keep the same default upstream).
- `app/routes/translate.tsx` action: replace `appEnv.GEMINI_API_KEY` with `await getGeminiApiKey()` and pass `await getGeminiModel()`. On a missing-key error, surface the existing friendly error and a hint to visit `/settings`.

## 8. UI — `app/routes/settings.tsx`

Nav link "Settings" in `root.tsx` (only when authed). `requireAuth` in loader + action.

- **loader** → `{ status: getApiKeyStatus(), model: getGeminiModel(), models: [...] }`.
- **Status line**: "Using saved key" (+ masked hint) / "Using Worker secret" / "Not configured".
- **API key form** (`intent=save_key`): password-type input + Save. Empty submit is rejected.
- **Clear** (`intent=clear_key`): deletes the row → falls back to secret.
- **Test** (`intent=test_key`): runs a trivial Gemini call (`translateTextWithExamples` with a 1-word input, no examples) using the *currently resolved* key+model; returns `{ ok }` or a **sanitized** error (never echoes the key). Uses a `useFetcher` so it doesn't disturb the form.
- **Model picker** (`intent=save_model`): `<select>` of allowed ids → upsert `gemini_model`.

Allowed models live in one array constant (e.g. `app/lib/models.ts`): `gemini-2.5-flash` (default), `gemini-2.5-pro`. Action validates the submitted model is in the allow-list.

## 9. Security properties

- Key **encrypted at rest**; plaintext only in Worker memory during a request.
- Masked hint (last 4 chars) is the only key-derived data sent to the browser; full key never serialized into loader/action JSON.
- `test` errors sanitized (strip any substring equal to the key; reuse the existing invalid/quota mapping in `gemini.server.ts`).
- All settings routes behind `requireAuth`.

## 10. Files

- New: `migrations/0003_settings.sql`, `app/lib/crypto.server.ts`, `app/lib/settings.server.ts`, `app/lib/models.ts`, `app/routes/settings.tsx`, `app/lib/crypto.test.ts` (round-trip), `app/lib/settings.test.ts` (precedence/masking — pure parts).
- Modified: `app/routes.ts` (add `/settings`), `app/root.tsx` (nav link), `app/lib/gemini.server.ts` (model param), `app/routes/translate.tsx` (use resolvers).

## 11. Testing

- `crypto.test.ts`: `decrypt(encrypt(x)) === x`; tampered ciphertext throws; wrong-key fails. (Web Crypto runs under Node/vitest.)
- `settings.test.ts`: masking helper (`••••1234`); precedence logic with DB-present vs DB-absent (pure function over injected values, or mocked getters).
- Manual via `wrangler dev`: save key → status flips to "Using saved key"; translate works; clear → falls back to secret; test button ok/error; model change persists.

## 12. Risks

- **SESSION_SECRET rotation** invalidates a stored key → app falls back to secret, UI shows "Not configured"; documented behavior.
- **Web Crypto in vitest**: tests run in node env (Node 22 has `crypto.subtle`); confirm the vitest config `environment: node` already used.
- Migration must be applied local + remote (existing project rule).

## 13. Verification criteria

- typecheck + vitest + build green.
- `0003` applies; `settings` table present.
- Saving a key: D1 stores **ciphertext** (verify the stored value is not the plaintext); UI shows masked hint; translate uses it.
- Clear → translate falls back to Worker secret.
- Test button returns ok with a valid key, sanitized error with a bad one.
- Grep `build/client` → no plaintext key, no `settings.server`/`crypto.server` modules.
