# Cantonese-Style-Translator — 項目指引

一句定位:Vite + React + TypeScript web app,deploy 落 Cloudflare Pages(free tier)。

## 最高優先級原則(每次都適用)

- **治本不治標**:定位到 bug 後唔好淨係加防御代碼(null check、catch 兜底)。先追溯異常輸入嘅來源,從源頭消除問題。改之前講「異常來源喺邊」+「喺邊一層解決」,確認後再改。
- **完成前必須 verification**:話「done」之前要有實證 — 跑 build / 測試、check output、對 spec 確認。冇辦法驗證就明講「未驗證」。
- **Plan→Confirm→Execute**:任何多步任務先寫 plan 到 `docs/active/{feature}/plan.md`,對齊確認後先動手。
- **Secrets 唔入 git**:API keys / tokens 用 `.env`(已 gitignore)。⚠️ Vite 會將 key 打包入 client bundle 嘅 caveat 見 `docs/workflow/project.md`。
- **Destructive 操作先確認**:任何不可逆操作(刪檔、覆蓋、`git reset --hard`、force push、清 remote 歷史)先講清楚影響範圍,確認後先做。
- **開放式問題先問清楚**:當被問「做乜好 / 下一步 / 今日 focus」,先問係想要 strategic 框架、tactical punch list、定 status review,唔好假設。擴展 scope 之前先複述邊界確認。

## 需要時先讀(just-in-time;唔好背,用到先 Read)

| 情境 | 檔案 |
|------|------|
| session 開始 · 搵進行中 feature · docs 導航 | `docs/INDEX.md` |
| build · dev · deploy · 環境 · API key caveat | `docs/workflow/project.md` |
| ship · PR · 品質閘 · skills | `docs/workflow/qa-gates.md` |
| git 規範 · branch · worktree | `docs/workflow/git.md` |
| hook 被 block · 危險操作 bypass | `docs/workflow/hooks.md` |
