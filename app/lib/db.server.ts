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

export async function saveTranslation(
  inputText: string,
  pairs: SavedPair[],
): Promise<number> {
  const ins = await db()
    .prepare("INSERT INTO translations (input_text) VALUES (?)")
    .bind(inputText)
    .run();
  const translationId = Number(ins.meta.last_row_id);
  const stmt = db().prepare(
    "INSERT INTO translation_sentences (translation_id, seq, original_cantonese, ai_translated, translated) VALUES (?, ?, ?, ?, ?)",
  );
  await db().batch(
    pairs.map((p) =>
      stmt.bind(translationId, p.seq, p.original, p.ai, p.ai),
    ),
  );
  return translationId;
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
