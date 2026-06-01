# Cantonese-Style-Translator — Remix + Cloudflare D1 Evolution

**Date:** 2026-05-31
**Status:** Approved design — ready for implementation plan
**Topic:** Evolve the client-only SPA into a full-stack Remix app on Cloudflare with a real database for multishot examples and persisted, rectifiable translation results.

---

## 1. Context — current state

A fully client-side Vite + React + TS SPA:

- **Translation** (`services/geminiService.ts`): splits Cantonese input into `[S:N]`-marked sentences, sends to **Gemini** (`gemini-2.5-flash-preview-04-17`) with multishot examples embedded in the prompt, parses markers back into sentence pairs.
- **Examples** (multishot): stored in **`localStorage`** only as `{cantonese, traditionalChinese}`; managed in `ManageExamplesPage` (add/edit/delete, CSV import/export). Not shared across devices; lost when storage clears.
- **Results**: shown in an editable table (inline rectify, "add to examples"), but **not persisted** — gone on reload.
- ⚠️ **Gemini API key is baked into the client bundle** (`process.env.API_KEY` via Vite `define`) → public once deployed.

## 2. Goals

1. Real **database** (Cloudflare D1) for multishot examples — shared, persistent, server-side.
2. **Auto-persist every translation run**; per-sentence **flag-as-incorrect + inline edit (rectify)**.
3. **Promote** a rectified sentence into the examples set.
4. Move the **Gemini call server-side** so the API key is a secret, never in the bundle.
5. Single-user **password gate**.
6. Deploy on **Cloudflare free tier**.

## 3. Non-goals (v1)

- Multi-user accounts / per-user data (single shared instance only).
- In-UI CSV import/export (CSV is used once for the seed migration; defer UI import/export).
- SSR-heavy optimisation, i18n, analytics.
- Swapping Gemini for Workers AI (possible future cost/perf experiment).

## 4. Resolved decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend / framework | **Remix v2 (Vite)** on **Cloudflare Pages** | User chose Remix to learn it; Pages reuses existing `deploy.yml` wiring. (React Router v7 is the successor and uses the same concepts if preferred later.) |
| Database | **Cloudflare D1** (serverless SQLite) | Free tier (5 GB, 5M reads/day, 100k writes/day); relational fit for examples + results. |
| AI | **Gemini**, called from Remix server | Keep current prompt/quality; key becomes a server secret. |
| Auth | Single **password gate** (signed cookie session) | User is sole user; cheapest protection against quota abuse. |
| History persistence | **Auto-save every run**; sentences flaggable + editable | User choice. |
| Examples seed | **Seed D1 from `translation_examples.csv`** via migration | User choice. |
| Deploy target | **Cloudflare Pages** (`wrangler pages deploy`) | Continuity with current pipeline. |
| CSV import/export UI | **Deferred** to a later phase | Out of v1 scope; seed covers initial data. |
| Tests | **Vitest** on pure logic (`sentences.ts`) | Highest-value, lowest-cost coverage. |

## 5. Architecture

```
Browser (React, Remix client)
   │  HTML + data
   ▼
Remix route loader/action  (runs on Cloudflare Pages Functions / Workers runtime)
   ├─ requireAuth(request)            → signed cookie session
   ├─ D1 binding  context.cloudflare.env.DB
   │     examples · translations · translation_sentences
   └─ Gemini API  (GEMINI_API_KEY secret, server-only)
```

All data access and the Gemini call happen inside Remix `loader`/`action` functions on the server. The browser only calls the app's own routes.

## 6. Data model (D1 / SQLite)

```sql
-- migrations/0001_init.sql
CREATE TABLE examples (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  cantonese          TEXT NOT NULL,
  traditional_chinese TEXT NOT NULL,
  source             TEXT NOT NULL DEFAULT 'manual',  -- 'seed' | 'manual' | 'promoted'
  created_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE translations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  input_text  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE translation_sentences (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  translation_id     INTEGER NOT NULL REFERENCES translations(id) ON DELETE CASCADE,
  seq                INTEGER NOT NULL,           -- the [S:N] order
  original_cantonese TEXT NOT NULL,
  ai_translated      TEXT NOT NULL,              -- original AI output (kept for reference)
  translated         TEXT NOT NULL,              -- current value; user edits land here
  flagged            INTEGER NOT NULL DEFAULT 0, -- 1 = marked incorrect
  edited             INTEGER NOT NULL DEFAULT 0, -- 1 = user rectified
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sentences_translation ON translation_sentences(translation_id);
CREATE INDEX idx_sentences_flagged ON translation_sentences(flagged);
```

`migrations/0002_seed_examples.sql` — generated from `translation_examples.csv`, inserting each row with `source='seed'`.

## 7. Remix structure

```
app/
  root.tsx                      # layout, nav, error boundary
  routes/
    _index.tsx                  # translator. loader: examples + recent runs. action: translate + auto-save
    manage.tsx                  # examples CRUD (add/edit/delete). loader+action
    history.tsx                 # past runs; filter flagged. loader (PHASE 5)
    login.tsx                   # GET form; POST checks APP_PASSWORD → session
    logout.tsx                  # POST clears session
    api.sentences.$id.tsx       # action: toggle flag / save edit  (useFetcher)
    api.examples.tsx            # action: create (promote) / delete example (useFetcher)
  lib/
    gemini.server.ts            # translateTextWithExamples(), server-only; reads env.GEMINI_API_KEY
    db.server.ts                # D1 helpers: listExamples, insertTranslation, updateSentence, ...
    auth.server.ts              # createSessionStorage, requireAuth(request), login/logout
    sentences.ts                # splitSentences(), parseMarkers() — pure, shared client/server
  components/                   # OutputDisplayTable, ExampleForm, Modal, icons (reused, light edits)
migrations/                     # 0001_init.sql, 0002_seed_examples.sql
wrangler.toml                   # D1 binding + vars
```

### Module responsibilities
- `sentences.ts` — pure functions extracted from current `App.tsx` (`splitSentences`, `splitNonQuotedTextByTerminators`, marker-parse regex). Unit-tested.
- `gemini.server.ts` — the current `geminiService.ts` logic, server-only, key from `context.cloudflare.env`.
- `db.server.ts` — thin raw-SQL helpers over the D1 binding (no ORM in v1).
- `auth.server.ts` — `@remix-run/cloudflare` `createCookieSessionStorage` with `SESSION_SECRET`; `requireAuth` redirects to `/login`.

## 8. Key flows

**Translate (auto-save)** — `_index` `action`:
1. `requireAuth`.
2. `splitSentences(input)` → build `[S:N]`-marked text.
3. `listExamples()` from D1.
4. `gemini.server.translate(marked, examples)`.
5. `parseMarkers(output)` → sentence pairs.
6. Insert one `translations` row + N `translation_sentences` rows (`ai_translated = translated`, `flagged=0`).
7. Return the saved run; UI renders the editable table.

**Flag + rectify** — each row: flag toggle + editable field. `useFetcher` POST → `api.sentences.$id`:
- toggle → set `flagged`.
- save edit → set `translated`, `edited=1`, `updated_at`.
No full navigation; optimistic UI.

**Promote to example** — "add to examples" on a row → `api.examples` action inserts `{cantonese: original_cantonese, traditional_chinese: translated, source:'promoted'}`.

**Auth** — `/login` POST compares to `APP_PASSWORD`; on success set signed session cookie; all loaders/actions call `requireAuth`. `/logout` clears it.

**Seed** — `0002_seed_examples.sql` applied via `wrangler d1 migrations apply` (local + remote).

## 9. Config & secrets

`wrangler.toml`:
- `[[d1_databases]]` binding `DB`.
- Pages build output config for Remix.

Secrets (via `wrangler pages secret put` / GitHub Actions secrets):
- `GEMINI_API_KEY`
- `APP_PASSWORD`
- `SESSION_SECRET`

`vite.config.ts`: add Remix + Cloudflare dev plugins; **remove** the `process.env.API_KEY` `define`.

## 10. Deploy changes

- **Update `.github/workflows/deploy.yml`**: build Remix, `wrangler pages deploy ./build/client` (or Remix's CF output dir), with the D1 binding configured in `wrangler.toml`. Migrations applied as a deploy step (`wrangler d1 migrations apply --remote`).
- **Retire `Dockerfile` + `nginx.conf`** — obsolete static-serve path.
- **Remove `public/_redirects`** — Remix owns routing.
- Update `docs/workflow/project.md` to Remix + D1 + `wrangler dev` (local D1 via `--local`).

## 11. Testing

- **Vitest** unit tests for `sentences.ts` (split + marker parse) — port the existing edge cases (quoted `「…」` blocks, terminators, multi-part markers).
- Smoke-level loader/action tests deferred; manual verification via `wrangler dev` for v1.

## 12. Reused / new / removed

- **Reused:** `OutputDisplayTable`, `ExampleForm`, `Modal`, icons, Gemini prompt, sentence logic.
- **New:** Remix shell + routes, D1 + migrations, `wrangler.toml`, auth, server libs.
- **Removed:** `Dockerfile`, `nginx.conf`, `public/_redirects`, localStorage persistence, client-side key, in-bundle `process.env.API_KEY`.

## 13. Build phases (each independently shippable)

0. **Scaffold** Remix-on-CF Pages + D1 binding; empty app deploys green; `wrangler dev` works with local D1.
1. **Auth** password gate (login/logout/session/requireAuth).
2. **Examples**: schema migration + CSV seed + `manage.tsx` CRUD.
3. **Translate + auto-save**: server Gemini + persistence + editable table.
4. **Flag + rectify + promote**: sentence fetchers + example promotion.
5. **History** page: list runs, filter flagged.

## 14. Risks / considerations

- **Remix on Cloudflare Pages vs Workers**: design targets Pages for deploy continuity; if CF docs steer toward Workers Static Assets for new apps, switching is a deploy-config change, not an app rewrite.
- **Gemini model id** `gemini-2.5-flash-preview-04-17` may need bumping to a current stable id at implementation time.
- **D1 local/remote drift**: always apply the same migrations to both; `--local` for dev, `--remote` for prod.
- **Cloudflare secrets must exist before first real deploy** (`GEMINI_API_KEY`, `APP_PASSWORD`, `SESSION_SECRET`) — otherwise translate + login fail.
- The repo's bgIsolation guard requires writes via worktree or temp-copy during agent work — operational note for implementation.

## 15. Verification criteria

- `wrangler dev` serves the app locally with local D1 seeded.
- Login required; wrong password rejected; correct password sets session.
- Translating saves a `translations` row + N `translation_sentences`; reload shows it persisted.
- Flagging + editing a sentence persists; promoting creates an `examples` row.
- `vitest run` green on `sentences.ts`.
- Production deploy on Cloudflare Pages reachable; Gemini key not present in client bundle (grep build output).
