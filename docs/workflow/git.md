# Git 規範 / Worktree Lifecycle

## Git 規範

- **禁止直接 commit 到 main**:所有改動用 feature branch(`feature/xxx`)
- 不同 feature 唔混喺同一 branch
- Commit 前確認只包含相關文件(用 named files,唔好 blanket `git add .`)
- PR base = main;merge 後刪 branch
- Release tag 格式:`v{YYYY-MM-DD}`

## Git Worktree Lifecycle (rule)

Claude sessions sometimes run inside a worktree under `.claude/worktrees/<name>/` for isolation. **The worktree owns whatever branch it's on** — git won't let two checkouts of the same branch coexist.

### Rule

- A worktree on `main` is a **temporary tool**, not long-lived state. **Remove or move it off `main` the moment the session's work is shipped.**
- While a worktree holds `main`, the main repo can't `git checkout main`; every `git pull` in the main repo silently keeps you on a stale branch.

### Workflow

**Session start (if a worktree is needed):**

```bash
cd C:\Users\jacky\Documents\CMPG\GitHub\Personal\Cantonese-Style-Translator
git worktree add .claude/worktrees/<name> -b worktree/<name> origin/main
cd .claude/worktrees/<name>
```

The branch `worktree/<name>` is a per-session throwaway. **Never check out `main` inside a worktree** — it strands the main repo.

**Session end (after last PR is merged):**

```bash
# From main repo root:
git worktree remove --force .claude/worktrees/<name>
git checkout main && git pull
```

**Stale-worktree cleanup:**

```bash
git worktree list                 # see what's holding what
git worktree prune                # drop refs to deleted dirs
git worktree remove --force <path>
```

### When to skip the worktree entirely

For most sessions — single feature, no concurrent agents, no destructive experiments — **just work in the main repo directly**. Reach for a worktree only when running concurrent agents in different directories or experimenting with something you might roll back.

Worktree paths under `.claude/worktrees/` are gitignored. Cleanup: `git worktree remove --force <path>` from main repo root.
