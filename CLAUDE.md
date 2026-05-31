# Cantonese-Style-Translator — 項目指引

## 項目定位

- **App type**: Web app(mobile-first responsive)
- **Tech stack**: Vite + React + TypeScript
- **Build**: `npm run build` → static `dist/`
- **Deployment**: Cloudflare Pages(free tier),`push to main` 自動 deploy
- **Dev**: `npm run dev`(Vite dev server)

> 此檔只放開發工作流程紀律,唔放 business logic 細節。新 feature 嘅 scope / 設計喺 `docs/active/` 逐個鎖定。

## 最高優先級原則

- **修復問題必須治本**:定位到 bug 後唔好淨係加防御代碼(null check、catch 兜底)。先追溯異常輸入嘅來源,從源頭消除問題。動手寫修復前先講「異常嘅來源係邊」同「打算喺邊一層解決」,確認後再改。
- **匯報完成前必須 verification**:話「done」之前要有實證 — 跑 build / 測試、check output、對 spec 確認。冇辦法驗證就明講「未驗證」。
- **Plan→Confirm→Execute**:任何多步任務先寫 plan 到 `docs/active/{feature}/plan.md`,對齊確認後先動手。
- **Secrets 唔入 git**:所有 API keys、tokens 用 `.env`(已喺 `.gitignore`),`.env.example`(如有)係模板。⚠️ 注意:Vite `define` 會將 `GEMINI_API_KEY` 打包入 client bundle,deploy 之後係 public 嘅 — 真正敏感嘅 key 唔應該咁樣 expose,日後 rework 要處理。
- **Destructive 操作先確認**:任何不可逆操作(刪檔、覆蓋、`git reset --hard`、force push、清 remote 歷史等)先講清楚會影響乜,確認後先做。

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

## 品質閘(Quality gates)

> ⚠️ 目前項目只有 `npm run build`。下面係 workflow 嘅 placeholder checklist —
> 日後 rework 時補上 lint / typecheck / test 工具,再將命令填返入去。

動手 ship 之前,逐項過:

1. **Lint** → `npm run lint`(TODO:未配置,日後加 eslint)
2. **Typecheck** → `tsc --noEmit`(TODO:可加入 build script)
3. **Build** → `npm run build` → 0 error
4. **Tests** → `npm test`(TODO:未配置,日後加 vitest)
5. **Self-check on diff**:只改咗應該改嘅檔、冇手民之誤、冇 leftover console.log / debug code

任何閘 fail → 修好先再 ship,唔好夾硬 push。

## Shipping mode by task size

| Scope | How |
|-------|-------|
| Tiny mechanical fix (typo、comment、樣式微調) | 直接改 + 品質閘。Single PR。 |
| 1-file feature change | 直接改 + `/ship-pr` |
| Multi-file feature | 先寫 plan 拆細,逐個 1-PR-scope ship。 |
| Docs / skill / config 檔 | 直接改 + fast-path PR。 |

## Skills(routine chores)

Routine ops 包成 `/`-invocable skills。**Chain 佢哋** — 如果有 skill 就唔好手動跑底層命令:

| Skill | What | When |
|-------|------|------|
| `/ship-pr <title>` | Commit → push → PR → squash-merge → sync main | 每次 code change 準備 land 時 |

Deploy 喺 merge 到 `main` 之後由 `.github/workflows/deploy.yml` 自動觸發(Cloudflare Pages),唔使手動 deploy。

For docs-only PRs(`CLAUDE.md`、`.claude/skills/*.md`、`docs/**`):merge 完就算,deploy 唔影響 static 內容以外嘅嘢。

## 運行環境

### Build / dev

```bash
npm install        # 第一次 / 改咗 dependencies
npm run dev        # 本地 dev server
npm run build      # production build → dist/
npm run preview    # 預覽 build 出嚟嘅 dist/
```

### Windows / Git Bash 兼容性

本機 dev 環境係 **Windows + Git Bash / PowerShell**。寫 shell 指令時:
- 避免 GNU-only 寫法(`sort -V`、`awk -F/`)
- 避免依賴 dynamic path resolution
- 路徑顯式測試,唔好假設 POSIX 行為
- 優先用 portable 指令(node、npm、git 原生 subcommand)

### Deployment Target — Cloudflare Pages

最終 deploy 落 Cloudflare Pages(free tier)。`.github/workflows/deploy.yml` 喺 `push to main` 時 build `dist/` 再用 `wrangler pages deploy` 推上去。

需要嘅 GitHub repo secrets:
- `CF_API_TOKEN` — Cloudflare API token(Pages edit 權限)
- `CF_ACCOUNT_ID` — Cloudflare account id
- `GEMINI_API_KEY` — build 時注入(注意上面 secrets 原則嘅 caveat)

SPA routing 靠 `public/_redirects`(`/* /index.html 200`)。

## Git 規範

- **禁止直接 commit 到 main**:所有改動用 feature branch(`feature/xxx`)
- 不同 feature 唔混喺同一 branch
- Commit 前確認只包含相關文件(用 named files,唔好 blanket `git add .`)
- PR base = main;merge 後刪 branch
- Release tag 格式:`v{YYYY-MM-DD}`

## Hooks

`.claude/hooks/check-bash.py`(PreToolUse Bash hook)會 block 一啲危險操作:
- `rm -rf` / `xargs rm -rf` / `exec rm -rf`
- `git reset --hard`
- `git push --force` / `--all` / push 到 main/master / bare push 喺 protected branch
- `gh issue / pr` 寫入操作(create / edit / close / reopen / comment / delete / merge)

確認過之後可以加 `CONFIRMED=1` 前綴 bypass:

```bash
CONFIRMED=1 gh pr create ...
```

### Hook Bypass Awareness

- Bash hook 預設 block `git push`、`gh pr create`、`gh issue create` — 確認係 intentional 之後加 `CONFIRMED=1` 前綴。
- PR body:**避免喺同一條 `gh pr create` 命令入面用 heredoc `EOF`**(試過 unclosed EOF 出事)。改用:
  - `gh pr create --body-file /tmp/pr-body.md`(先寫去 temp file)
  - 或 inline single-quoted string 用 `\\n` 換行(短 body)
- `gh issue create` / `gh issue comment` 同理。

## Planning vs Tactical Responses

- 當被問開放式「做乜好」/「下一步」/「今日 focus 乜」,**先問清楚** — 唔好假設係(a)策略框架、(b)tactical punch list、定(c)status review。一句就得:「想要策略框架、tactical punch list、定 status review?」
- **擴展範圍之前先確認 scope。** 唔好喺 PM 冇講嘅情況下擴大改動範圍。用自己嘅話複述邊界,確認後先郁隔籬嘅 surface。

## 文檔結構

**每次 session 開始先讀 `docs/INDEX.md`** — 佢係 docs/ 嘅總入口,放住目錄地圖、
新 session 流程、新 feature 流程,同 route 去進行中嘅 features / lessons / feedback。

呢個檔(CLAUDE.md)只負責工作流程紀律;docs/ 嘅結構同流程以 `docs/INDEX.md` 為準,
唔喺度重覆,避免兩邊 drift。
