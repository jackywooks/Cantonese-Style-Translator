function splitNonQuotedTextByTerminators(text: string): string[] {
  const trimmed = text?.trim();
  if (!trimmed) return [];
  const sentences = trimmed.match(/[^。！？.!?]+[。！？.!?]?/g);
  if (sentences) return sentences.map((s) => s.trim()).filter((s) => s.length > 0);
  return [trimmed];
}

export function splitSentences(text: string): string[] {
  const trimmed = text?.trim();
  if (!trimmed) return [];
  const final: string[] = [];
  const parts = trimmed.split(/(「[^」]*」)/g);
  for (const part of parts) {
    if (!part || !part.trim()) continue;
    if (part.startsWith("「") && part.endsWith("」")) final.push(part.trim());
    else final.push(...splitNonQuotedTextByTerminators(part));
  }
  return final.filter((s) => s.length > 0);
}

export function buildMarkedText(sentences: string[]): string {
  return sentences.map((s, i) => `[S:${i + 1}] ${s}`).join(" ");
}

export function parseMarkers(output: string): Record<string, string> {
  const byMarker: Record<string, string[]> = {};
  const re = /\[S:(\d+)\]\s*([\s\S]*?)(?=\s*\[S:\d+\]|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(output)) !== null) {
    const marker = `[S:${m[1]}]`;
    const seg = m[2].trim();
    if (!byMarker[marker]) byMarker[marker] = [];
    if (seg) byMarker[marker].push(seg);
  }
  const out: Record<string, string> = {};
  for (const k of Object.keys(byMarker)) out[k] = byMarker[k].join(" ");
  return out;
}
