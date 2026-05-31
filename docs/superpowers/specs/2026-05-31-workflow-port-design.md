# Workflow Port — money-manager → Cantonese-Style-Translator

**Date:** 2026-05-31
**Goal:** Copy the money-manager Claude Code development workflow into this project, **stripped of all business context** (finance/Django/Firefly/Sheets/NAS), adapted only where deployment is concerned (→ Cloudflare Pages free tier).

## Decisions (from brainstorm)

- **Scope:** whole workflow copied; CI/CD reworked for Cloudflare Pages.
- **Adaptation:** keep quality-gate commands generic (placeholders) — project will be reworked later. Only the deploy pipeline is concretely adapted.
- **Overnight / multi-agent team harness:** dropped.
- **Doc language:** keep Cantonese (粵文) style to match existing docs + this project.
- **daily-progress workflow:** included.

## Dropped entirely (business / team / overnight)

- `.claude/agents/*` (director, coders, verifier, shared-patterns)
- Skills: `start-team`, `safe-batch-ship`, `log-feature`, `overnight-start/stop/tick`, `deploy`, `verify-prod`, `run-prod`
- Hooks: `check-team-up.py`, `session-start-team-check.py`
- Scripts: `overnight-heartbeat.ps1`, `test-heartbeat-timeout.ps1`
- CLAUDE.md finance sections: soft-delete ban, accounting restatement, external-system writes, sync markers, Firefly/Sheet DELETE, backup discipline, bulk-op prod gates, Docker-first prod rules

## Files produced

### 1. `CLAUDE.md` (genericized, 粵文)
Retained, business-stripped sections:
- 項目定位 — generic header: Vite + React + TS web app, deploy → Cloudflare Pages
- 最高優先級原則 — generic only: 治本不治標 · 完成前 verification · Plan→Confirm→Execute · secrets 唔入 git · destructive op 先確認
- Git Worktree Lifecycle — paths repointed to this repo
- 品質閘 (quality gates) — generic checklist with **placeholders** (lint / typecheck / build / test), not wired to commands
- Shipping mode by task size table
- Git 規範
- Hooks 說明 (check-bash, generic)
- Planning vs Tactical Responses
- Windows / Git Bash 兼容性 note
- Skills table (only `/ship-pr`)

### 2. `.claude/settings.json`
Only the `check-bash` PreToolUse(Bash) hook + `worktree.bgIsolation`. SessionStart + team-check hooks removed.

### 3. `.claude/hooks/check-bash.py`
Kept, stripped to **generic** dangerous-op blocking:
- `rm -rf` (direct / xargs / exec-wrapped)
- `git reset --hard`
- force-push / `--all` / push-to-main / bare push on protected branch
- `gh issue|pr` write subcommands

Dropped finance patterns: SQL `DROP/TRUNCATE/DELETE`, `curl -X DELETE`, gspread destructive methods.
Bypass token renamed `PM_CONFIRMED=1` → `CONFIRMED=1`. Reason strings genericized (粵文, no PM/finance refs).

### 4. `.claude/skills/ship-pr/SKILL.md`
Genericized: pre-flight gates as placeholders; commit (named files) → push → PR (`--body-file`) → squash-merge → sync main. Deploy now automatic via CI on merge to main (no `/deploy` chain). Bypass token `CONFIRMED=1`.

### 5. `.githooks/pre-commit`
Skeleton + `git config core.hooksPath .githooks` install note. Body is a commented placeholder (e.g. `npm run lint` / `tsc --noEmit`).

### 6. `.github/workflows/ci.yml`
Generic Node CI: checkout → setup-node (20) → `npm ci` → `npm run build`. Lint/test steps commented placeholders. Triggers: push to main/feature/**, PR to main, workflow_dispatch.

### 7. `.github/workflows/deploy.yml`
Cloudflare Pages deploy on push to main:
- checkout → setup-node → `npm ci` → `npm run build` (with `GEMINI_API_KEY` from secrets)
- `cloudflare/wrangler-action` → `pages deploy dist --project-name=<name>`
- Secrets required: `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `GEMINI_API_KEY`
- `concurrency: deploy-main`, `cancel-in-progress: false`

### 8. `.github/workflows/daily-progress.yml` + `scripts/write_daily_progress.py`
Ported near-verbatim (generic already). Nightly cron logs merged PRs to `docs/review/daily-progress.md`, skips silently when nothing shipped. Timezone kept `America/Toronto`.

### 9. `public/_redirects`
`/* /index.html 200` — SPA fallback for Cloudflare Pages.

### 10. `docs/` skeleton
`INDEX.md`, `active/.gitkeep`, `archive/.gitkeep`, `review/lessons.md`, `review/feedback.md`, `knowledge/.gitkeep` — generic, establishing the doc discipline. Onboarding flow documented in INDEX.

## Caveats (flagged, not fixed — per "rework later")

- `GEMINI_API_KEY` is baked into the **client bundle** at build (Vite `define`) → public once deployed. CF build needs it as an env var; security rework deferred.
- Quality-gate commands are placeholders; the project has no lint/test tooling yet (only `vite build`).

## Verification

- `python .claude/hooks/check-bash.py` against sample dangerous + safe commands → blocks/approves correctly.
- `python scripts/write_daily_progress.py --print-only --date 2026-05-31` runs without error (skips if no gh/PRs).
- YAML workflows parse (no `${{` syntax errors); JSON settings parse.
