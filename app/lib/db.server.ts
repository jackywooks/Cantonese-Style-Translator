import type { ExampleRow, SentenceRow, TranslationRow } from "~/types";
import { appEnv } from "./env.server";

function db(): D1Database {
  return appEnv.DB;
}

export async function listExamples(): Promise<ExampleRow[]> {
  const { results } = await db()
    .prepare("SELECT * FROM examples ORDER BY id DESC")
    .all<ExampleRow>();
  return results ?? [];
}

/** True if an example with this exact cantonese→traditional pair already exists. */
export async function exampleExists(
  cantonese: string,
  traditional: string,
): Promise<boolean> {
  const row = await db()
    .prepare(
      "SELECT 1 FROM examples WHERE cantonese = ? AND traditional_chinese = ? LIMIT 1",
    )
    .bind(cantonese, traditional)
    .first<{ 1: number }>();
  return row !== null;
}

export async function addExample(
  cantonese: string,
  traditional: string,
  source = "manual",
): Promise<void> {
  await db()
    .prepare(
      "INSERT INTO examples (cantonese, traditional_chinese, source) VALUES (?, ?, ?)",
    )
    .bind(cantonese, traditional, source)
    .run();
}

export async function updateExample(
  id: number,
  cantonese: string,
  traditional: string,
): Promise<void> {
  await db()
    .prepare(
      "UPDATE examples SET cantonese = ?, traditional_chinese = ? WHERE id = ?",
    )
    .bind(cantonese, traditional, id)
    .run();
}

export async function deleteExample(id: number): Promise<void> {
  await db().prepare("DELETE FROM examples WHERE id = ?").bind(id).run();
}

export interface SavedPair {
  seq: number;
  original: string;
  ai: string;
}

/**
 * Persist a translation run and its sentences, returning the new sentence rows.
 * The parent insert and all child inserts run in a single `db.batch()`, which
 * D1 executes as one implicit transaction — so a failure can't leave an orphan
 * `translations` row with no sentences.
 */
export async function saveTranslation(
  inputText: string,
  pairs: SavedPair[],
  direction: string = "c2f",
): Promise<{ translationId: number; sentences: SentenceRow[] }> {
  const insertParent = db()
    .prepare("INSERT INTO translations (input_text, direction) VALUES (?, ?)")
    .bind(inputText, direction);
  const sentenceStmt = db().prepare(
    "INSERT INTO translation_sentences (translation_id, seq, original_cantonese, ai_translated, translated) " +
      "VALUES ((SELECT id FROM translations ORDER BY id DESC LIMIT 1), ?, ?, ?, ?)",
  );

  const statements = [
    insertParent,
    ...pairs.map((p) => sentenceStmt.bind(p.seq, p.original, p.ai, p.ai)),
  ];
  const results = await db().batch(statements);

  const translationId = Number(results[0].meta.last_row_id);
  if (!Number.isInteger(translationId) || translationId <= 0) {
    throw new Error("saveTranslation: D1 did not return a valid last_row_id.");
  }
  const sentences = await getSentences(translationId);
  return { translationId, sentences };
}

export async function getSentences(
  translationId: number,
): Promise<SentenceRow[]> {
  const { results } = await db()
    .prepare(
      "SELECT * FROM translation_sentences WHERE translation_id = ? ORDER BY seq",
    )
    .bind(translationId)
    .all<SentenceRow>();
  return results ?? [];
}

export async function updateSentence(
  id: number,
  fields: { translated?: string; flagged?: number },
): Promise<void> {
  if (fields.translated !== undefined) {
    await db()
      .prepare(
        "UPDATE translation_sentences SET translated = ?, edited = 1, updated_at = datetime('now') WHERE id = ?",
      )
      .bind(fields.translated, id)
      .run();
  }
  if (fields.flagged !== undefined) {
    await db()
      .prepare(
        "UPDATE translation_sentences SET flagged = ?, updated_at = datetime('now') WHERE id = ?",
      )
      .bind(fields.flagged, id)
      .run();
  }
}

export async function getTranslation(
  id: number,
): Promise<TranslationRow | null> {
  return await db()
    .prepare("SELECT * FROM translations WHERE id = ?")
    .bind(id)
    .first<TranslationRow>();
}

export async function listRecentTranslations(
  limit = 50,
): Promise<TranslationRow[]> {
  const { results } = await db()
    .prepare("SELECT * FROM translations ORDER BY id DESC LIMIT ?")
    .bind(limit)
    .all<TranslationRow>();
  return results ?? [];
}
