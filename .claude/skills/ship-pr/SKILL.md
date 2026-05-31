---
name: ship-pr
description: Full PR-shipping chain — commit + push + open PR + squash-merge + sync main. Standard for every code change ready to land. Deploy happens automatically via CI on merge to main.
user_invocable: true
---

# /ship-pr

End-to-end PR pipeline. Replaces the manual commit→push→PR→merge chain.

## Invocation

```
/ship-pr <commit-title>
```

## Pre-flight (must pass before starting)

> Quality-gate commands are placeholders until tooling is configured (see
> CLAUDE.md §品質閘). Run whatever exists today; `npm run build` is the minimum.

- `npm run build` → 0 error
- `npm run lint` → 0 error (TODO: once eslint is configured)
- `tsc --noEmit` → 0 error (TODO: once typecheck is wired)
- Not on `main` branch
- `git status` shows a diff to commit

## Protocol

1. **Commit** (named files only — never blanket `git add .`):
   ```
   git add <files>
   git commit -m "<title>"
   ```
2. **Push**: `git push -u origin <branch>`
3. **Open PR** — use `--body-file <tempfile.md>` for long bodies (NEVER heredoc EOF inside `gh pr create` — past failure mode):
   ```
   CONFIRMED=1 gh pr create --title "<title>" --body-file <tempfile.md>
   ```
4. **Merge** (squash + delete branch):
   ```
   CONFIRMED=1 gh pr merge <N> --squash --delete-branch
   ```
5. **Sync main**: `git checkout main && git pull origin main`

Deploy to Cloudflare Pages fires automatically from `.github/workflows/deploy.yml`
on the merge to `main` — no manual deploy step.

## Output

```
✅ Shipped PR #<N> — <title>
   → <URL>
   Cloudflare deploy triggered (watch the Actions tab).
```

## Stop conditions

- Pre-flight fails → stop. Show failures.
- PR creation fails → stop, surface gh error.
- Merge fails (conflicts) → stop, leave branch open.
