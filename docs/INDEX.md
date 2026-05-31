# Docs INDEX — Cantonese-Style-Translator

每次 session 開始必讀呢個檔。

## 結構

- `active/` — 進行中嘅 features(每個 feature 一個資料夾,內有 `plan.md` + `tasks.md`)
- `archive/` — 已完成 features
- `review/lessons.md` — Lessons learnt(grep 呢度睇有冇踩過同類嘅坑)
- `review/feedback.md` — PM 偏好 / working style
- `review/daily-progress.md` — 每日自動記錄(GitHub Action,merge PR 先有)
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

完整工作流程紀律喺 repo root 嘅 `CLAUDE.md`。
