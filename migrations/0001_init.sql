CREATE TABLE examples (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  cantonese           TEXT NOT NULL,
  traditional_chinese TEXT NOT NULL,
  source              TEXT NOT NULL DEFAULT 'manual',
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE translations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  input_text  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE translation_sentences (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  translation_id     INTEGER NOT NULL REFERENCES translations(id) ON DELETE CASCADE,
  seq                INTEGER NOT NULL,
  original_cantonese TEXT NOT NULL,
  ai_translated      TEXT NOT NULL,
  translated         TEXT NOT NULL,
  flagged            INTEGER NOT NULL DEFAULT 0,
  edited             INTEGER NOT NULL DEFAULT 0,
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sentences_translation ON translation_sentences(translation_id);
CREATE INDEX idx_sentences_flagged ON translation_sentences(flagged);
