export type Direction = "c2f" | "f2c";

export const DEFAULT_DIRECTION: Direction = "c2f";

export function isDirection(v: unknown): v is Direction {
  return v === "c2f" || v === "f2c";
}

export function parseDirection(v: unknown): Direction {
  return isDirection(v) ? v : DEFAULT_DIRECTION;
}

export interface DirectionMeta {
  sourceLabel: string;
  targetLabel: string;
  placeholder: string;
  buttonText: string;
  badge: string;
}

export const DIRECTION_META: Record<Direction, DirectionMeta> = {
  c2f: {
    sourceLabel: "Verbal Cantonese",
    targetLabel: "Formal Traditional Chinese",
    placeholder: "例如: 你食咗飯未呀？",
    buttonText: "Translate to Formal Traditional Chinese",
    badge: "粵 → 繁",
  },
  f2c: {
    sourceLabel: "Formal Traditional Chinese",
    targetLabel: "Verbal Cantonese",
    placeholder: "例如：你吃過飯了嗎？",
    buttonText: "Translate to Verbal Cantonese",
    badge: "繁 → 粵",
  },
};

export function otherDirection(d: Direction): Direction {
  return d === "c2f" ? "f2c" : "c2f";
}

/**
 * Map a stored sentence (whose original/translated meaning depends on the run's
 * direction) to the canonical example columns so the example set always means
 * (cantonese, traditional_chinese) regardless of which direction produced it.
 *
 * - c2f run: original = Cantonese, translated = Traditional.
 * - f2c run: original = Traditional, translated = Cantonese.
 */
export function toCanonicalExample(
  direction: Direction,
  original: string,
  translated: string,
): { cantonese: string; traditional: string } {
  if (direction === "f2c") {
    return { cantonese: translated, traditional: original };
  }
  return { cantonese: original, traditional: translated };
}
