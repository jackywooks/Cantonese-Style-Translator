# 品質閘 / Shipping / Skills

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
| Tiny mechanical fix(typo、comment、樣式微調) | 直接改 + 品質閘。Single PR。 |
| 1-file feature change | 直接改 + `/ship-pr` |
| Multi-file feature | 先寫 plan 拆細,逐個 1-PR-scope ship。 |
| Docs / skill / config 檔 | 直接改 + fast-path PR。 |

## Skills(routine chores)

Routine ops 包成 `/`-invocable skills。**Chain 佢哋** — 如果有 skill 就唔好手動跑底層命令:

| Skill | What | When |
|-------|------|------|
| `/ship-pr <title>` | Commit → push → PR → squash-merge → sync main | 每次 code change 準備 land 時 |

Deploy 喺 merge 到 `main` 之後由 `.github/workflows/deploy.yml` 自動觸發(Cloudflare Pages),唔使手動 deploy。

For docs-only PRs(`CLAUDE.md`、`.claude/skills/*.md`、`docs/**`):merge 完就算。
