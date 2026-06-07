# Bidirectional translation — Design

**Date:** 2026-06-01
**Status:** Approved design — ready for implementation plan
**Branch:** `feature/bidirectional-translation`
**Builds on:** the merged React Router v7 + Cloudflare Workers + D1 app (PRs #2, #3).
**Independent of** the Settings-key feature (separate branch/PR); no shared files beyond `gemini.server.ts` and `translate.tsx`, which both touch — sequence Settings first to minimize conflict, but either can land alone.

---

## 1. Goal

Add the reverse translation direction. Today the app is one-way:
- **c2f** — Verbal Cantonese → Formal Traditional Chinese (current behavior).

Add:
- **f2c** — Formal Traditional Chinese → Verbal Cantonese (the reverse).

User picks direction on the translate page; each saved run records which direction it used; history shows it.

## 2. Decisions (from brainstorm)

| Decision | Choice |
|---|---|
| Directions | Swap the existing pair: `c2f` (current) and `f2c` (reverse) |
| Examples | One example set, **reused flipped** — same `examples` rows, source/target swapped per direction |
| UI + storage | Direction **toggle / ⇄ swap** on translate page; **direction stored on each run** |
| Promote mapping | Promoted examples always normalize to canonical `(cantonese, traditional_chinese)` columns, regardless of direction |

## 3. Non-goals

- New language pairs (English, etc.) — only the existing Cantonese/Traditional pair, flipped.
- Direction-tagged example sets — examples stay direction-agnostic and are flipped at prompt time.
- Auto-detecting input language — the user chooses direction explicitly.

## 4. Core type

`app/lib/direction.ts` (pure, shared client/server):

```ts
export type Direction = "c2f" | "f2c";
export const DEFAULT_DIRECTION: Direction = "c2f";
export function isDirection(v: unknown): v is Direction {
  return v === "c2f" || v === "f2c";
}
export function parseDirection(v: unknown): Direction {
  return isDirection(v) ? v : DEFAULT_DIRECTION;
}
// UI copy per direction (label, placeholder, result heading, source/target names)
export const DIRECTION_META: Record<Direction, {
  sourceLabel: string; targetLabel: string;
  placeholder: string; buttonText: string;
}> = {
  c2f: {
    sourceLabel: "Verbal Cantonese",
    targetLabel: "Formal Traditional Chinese",
    placeholder: "例如: 你食咗飯未呀？",
    buttonText: "Translate to Formal Traditional Chinese",
  },
  f2c: {
    sourceLabel: "Formal Traditional Chinese",
    targetLabel: "Verbal Cantonese",
    placeholder: "例如：你吃過飯了嗎？",
    buttonText: "Translate to Verbal Cantonese",
  },
};
```

## 5. Data model

Migration `migrations/0003_translation_direction.sql`:

```sql
ALTER TABLE translations ADD COLUMN direction TEXT NOT NULL DEFAULT 'c2f';
```

> Note: if the Settings-key PR lands first it also adds an `0003_*`. Whichever merges second renames to `0004_*`. The plan will use the next free number at implementation time.

`TranslationRow` gains `direction: string`. Existing rows default to `'c2f'` (correct — all prior runs were Cantonese→Traditional).

## 6. Prompt — `app/lib/gemini.server.ts`

`translateTextWithExamples` gains a `direction: Direction` parameter. Two things vary by direction:

1. **Role/instruction text**: c2f = "translate colloquial Cantonese → formal written Traditional Chinese"; f2c = "translate formal written Traditional Chinese → colloquial/verbal Cantonese". A small per-direction string block.
2. **Example orientation**: each `ExampleRow` has `cantonese` + `traditional_chinese`. For c2f, source = `cantonese`, target = `traditional_chinese`. For f2c, source = `traditional_chinese`, target = `cantonese`. Build the few-shot lines from (source, target) per direction.

The `[S:N]` marker contract, `splitSentences`, `buildMarkedText`, `parseMarkers` are **direction-agnostic** — unchanged. Only the prompt framing + example column order flips.

## 7. Flow — `app/routes/translate.tsx`

- **Direction comes through the form** (`direction` field) and is also reflected in the loader-backed view via `?id=` (the saved run carries its direction).
- **action**: read + `parseDirection(form.get("direction"))`; split → mark (unchanged); `translateTextWithExamples(apiKey, marked, examples, direction)`; `saveTranslation(input, pairs, direction)`; redirect to `/?id=N` (existing pattern from PR #3).
- **loader**: when loading `?id=N`, also return the run's `direction` so the result heading + a future re-translate reflect it.
- **db**: `saveTranslation(inputText, pairs, direction)` writes `direction` on the `translations` row.

## 8. UI — translate page

- A **⇄ direction control** above the textarea: shows "`<source>` → `<target>`" with a swap button that flips `Direction`. Implemented as client state seeded from the loaded run's direction (or `DEFAULT_DIRECTION`), submitted as a hidden `direction` field.
- Label, placeholder, and submit button text come from `DIRECTION_META[direction]`.
- Result heading shows the direction (e.g. "Result: Traditional → Cantonese").

## 9. Promote mapping (the subtle part)

`translation_sentences` stores `original_cantonese` + `translated` literally — but those names assume c2f. To keep ONE consistent example set, **promote normalizes to canonical columns based on the run's direction**:

- For a **c2f** run: original = Cantonese, translated = Traditional → `addExample(cantonese = original, traditional = translated)`.
- For an **f2c** run: original = Traditional, translated = Cantonese → `addExample(cantonese = translated, traditional = original)`.

So no matter which direction produced a sentence, the `examples` row always means `(cantonese, traditional_chinese)`. Implementation: the promote form (in `SentenceTable`) must know the run's direction. The direction is passed into `SentenceTable` (from the translate loader / history loader) and included as a hidden field; `api.examples` promote swaps accordingly. The placeholder/dedup guards from PR #3 still apply.

> Column naming caveat: `translation_sentences.original_cantonese` is now a slight misnomer for f2c runs (it holds Traditional source text). We keep the column name (no rename — avoids a data migration) and document that it means "source text" generally. The plan notes this.

## 10. History — `history.tsx` + `history.$id.tsx`

- List: show a direction badge per run (`c2f` → "粵→繁", `f2c` → "繁→粵", or arrow chips).
- Detail: pass the run's `direction` into `SentenceTable` so promote maps correctly there too; show the direction in the heading.

## 11. Files

- New: `app/lib/direction.ts`, `app/lib/direction.test.ts`, `migrations/000N_translation_direction.sql`.
- Modified:
  - `app/types.ts` (`TranslationRow.direction`)
  - `app/lib/db.server.ts` (`saveTranslation` takes + stores direction; `getTranslation`/`listRecentTranslations` already select `*` so they return it)
  - `app/lib/gemini.server.ts` (direction param → prompt + example orientation)
  - `app/routes/translate.tsx` (direction control + pass-through)
  - `app/components/SentenceTable.tsx` (accept `direction`, include in promote form)
  - `app/routes/api.examples.tsx` (promote: map by direction to canonical columns)
  - `app/routes/history.tsx` + `history.$id.tsx` (badges + pass direction to SentenceTable)

## 12. Testing

- `direction.test.ts`: `parseDirection` (valid/invalid/missing → default), `isDirection`, `DIRECTION_META` has both keys.
- Pure promote-mapping helper (extract the canonical (cantonese, traditional) computation into a pure function taking `{direction, original, translated}` → unit-test both directions).
- Manual via `wrangler dev`: translate c2f (unchanged); swap to f2c, translate Traditional → get Cantonese; both runs saved with correct `direction`; history badges correct; promote from a c2f run and an f2c run → both produce a correct canonical `examples` row (check D1).

## 13. Risks / notes

- **Migration number collision** with the Settings PR — use next free `000N` at build time.
- **f2c example quality**: flipping c2f examples gives reasonable few-shot for the reverse, but the seed set was authored for c2f; acceptable per decision (reuse flipped).
- **`original_cantonese` misnomer** for f2c — documented, not renamed (avoids data migration).
- Existing rows default to `c2f` — historically accurate.

## 14. Verification criteria

- typecheck + vitest + build green.
- Migration applies; `translations.direction` present; old rows = `c2f`.
- c2f path byte-for-byte unchanged in behavior.
- f2c: Traditional input → Cantonese output; run stored with `direction='f2c'`.
- Promote from each direction writes a canonical `(cantonese, traditional_chinese)` row (verified in D1).
- History shows correct direction badges.
