# 項目 / 運行環境

## 項目定位

- **App type**: Web app(mobile-first responsive)
- **Tech stack**: Vite + React + TypeScript
- **Build**: `npm run build` → static `dist/`
- **Deployment**: Cloudflare Pages(free tier),`push to main` 自動 deploy
- **Dev**: `npm run dev`(Vite dev server)

## Build / dev 命令

```bash
npm install        # 第一次 / 改咗 dependencies
npm run dev        # 本地 dev server
npm run build      # production build → dist/
npm run preview    # 預覽 build 出嚟嘅 dist/
```

## Windows / Git Bash 兼容性

本機 dev 環境係 **Windows + Git Bash / PowerShell**。寫 shell 指令時:
- 避免 GNU-only 寫法(`sort -V`、`awk -F/`)
- 避免依賴 dynamic path resolution
- 路徑顯式測試,唔好假設 POSIX 行為
- 優先用 portable 指令(node、npm、git 原生 subcommand)

## Deployment Target — Cloudflare Pages

最終 deploy 落 Cloudflare Pages(free tier)。`.github/workflows/deploy.yml` 喺 `push to main` 時 build `dist/` 再用 `wrangler pages deploy` 推上去。

需要嘅 GitHub repo secrets:
- `CF_API_TOKEN` — Cloudflare API token(Pages edit 權限)
- `CF_ACCOUNT_ID` — Cloudflare account id
- `GEMINI_API_KEY` — build 時注入

SPA routing 靠 `public/_redirects`(`/* /index.html 200`)。

## ⚠️ API key caveat

Vite `define` 會將 `GEMINI_API_KEY` 打包入 client bundle,deploy 之後係 public 嘅 — 真正敏感嘅 key 唔應該咁樣 expose,日後 rework 要處理。
