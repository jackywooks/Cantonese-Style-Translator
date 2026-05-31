# Docs INDEX — Cantonese-Style-Translator

docs/ 內容導航。工作流程紀律喺 repo root `CLAUDE.md`,細節喺 `docs/workflow/`(由 CLAUDE.md 路由)。

## 項目內容

- `active/` — 進行中嘅 features(每個一個資料夾,內有 `plan.md` + `tasks.md`)
- `archive/` — 已完成 features
- `review/lessons.md` — Lessons learnt(開新 feature 前 grep 呢度)
- `review/feedback.md` — PM 偏好 / working style
- `review/daily-progress.md` — 每日自動記錄(GitHub Action,有 merge PR 先有)
- `knowledge/` — 項目知識

## 新 session 流程

1. 讀呢個 INDEX
2. 讀 `review/lessons.md`
3. 讀 `active/` 進行中嘅 features

## 新 feature 流程

1. PM 描述需求
2. grep `review/lessons.md` 同 `archive/` 睇有冇類似
3. 寫 plan 到 `active/{feature}/plan.md`(scope、why、how、驗收標準、風險)
4. 拆 tasks 到 `active/{feature}/tasks.md`
5. PM 確認後動手
