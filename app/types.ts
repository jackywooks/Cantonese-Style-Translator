export interface ExampleRow {
  id: number;
  cantonese: string;
  traditional_chinese: string;
  source: string;
  created_at: string;
}

export interface SentenceRow {
  id: number;
  translation_id: number;
  seq: number;
  original_cantonese: string;
  ai_translated: string;
  translated: string;
  flagged: number;
  edited: number;
  updated_at: string;
}

export interface TranslationRow {
  id: number;
  input_text: string;
  created_at: string;
}
