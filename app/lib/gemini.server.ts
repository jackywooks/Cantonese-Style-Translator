import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import type { ExampleRow } from "~/types";
import type { Direction } from "./direction";
import { DEFAULT_GEMINI_MODEL } from "./models";

interface DirectionPrompt {
  sourceName: string;
  targetName: string;
  role: string;
  exampleSource: (ex: ExampleRow) => string;
  exampleTarget: (ex: ExampleRow) => string;
}

const PROMPTS: Record<Direction, DirectionPrompt> = {
  c2f: {
    sourceName: "Verbal Cantonese",
    targetName: "Formal Traditional Chinese",
    role: "translating colloquial/verbal Cantonese into formal, written Traditional Chinese",
    exampleSource: (ex) => ex.cantonese,
    exampleTarget: (ex) => ex.traditional_chinese,
  },
  f2c: {
    sourceName: "Formal Traditional Chinese",
    targetName: "Verbal Cantonese",
    role: "translating formal, written Traditional Chinese into natural colloquial/verbal Cantonese",
    exampleSource: (ex) => ex.traditional_chinese,
    exampleTarget: (ex) => ex.cantonese,
  },
};

export async function translateTextWithExamples(
  apiKey: string,
  textWithMarkers: string,
  examples: ExampleRow[],
  direction: Direction = "c2f",
  model: string = DEFAULT_GEMINI_MODEL,
): Promise<string> {
  if (!apiKey) throw new Error("Gemini API key is not configured.");
  if (!textWithMarkers.trim()) return "";

  const ai = new GoogleGenAI({ apiKey });
  const p = PROMPTS[direction];

  const exampleSection =
    examples.length > 0
      ? `Here are some examples of how to translate from ${p.sourceName} to ${p.targetName}. Please follow this style accurately:
--- EXAMPLES START ---
${examples
          .map(
            (ex) =>
              `${p.sourceName}: "${p.exampleSource(ex)}"\n${p.targetName}: "${p.exampleTarget(ex)}"`,
          )
          .join("\n\n")}
--- EXAMPLES END ---`
      : `No examples provided. Please translate from ${p.sourceName} to ${p.targetName} accurately and natural-soundingly.`;

  const prompt = `
You are an expert linguist specializing in ${p.role}.
Your translations must be highly accurate, natural-sounding, and meticulously maintain the original meaning.

IMPORTANT INSTRUCTION FOR SENTENCE MARKERS:
The ${p.sourceName} input text will be formatted with sentence markers like [S:1], [S:2], etc., at the beginning of each sentence.
You MUST preserve these markers in your output. Each translated segment MUST begin with the exact same marker.
If one original sentence is best translated into multiple parts, EACH part must start with the original marker.

${exampleSection}

Now, translate ONLY the following ${p.sourceName} text (which includes [S:N] markers) into ${p.targetName}.
Do not add commentary. Output only the translated text with the preserved [S:N] markers.

--- ${p.sourceName.toUpperCase()} TEXT TO TRANSLATE START ---
${textWithMarkers}
--- ${p.sourceName.toUpperCase()} TEXT TO TRANSLATE END ---

${p.targetName} Translation (with [S:N] markers):
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.3 },
    });
    return (response.text ?? "").trim();
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown error";
    if (/API key not valid|API_KEY_INVALID/.test(msg))
      throw new Error("The Gemini API key is invalid.");
    if (/quota/i.test(msg))
      throw new Error("Gemini API quota exceeded. Try again later.");
    throw new Error(`Failed to translate: ${msg}`);
  }
}
