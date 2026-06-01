import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import type { ExampleRow } from "~/types";

const MODEL_NAME = "gemini-2.5-flash";

export async function translateTextWithExamples(
  apiKey: string,
  cantoneseTextWithMarkers: string,
  examples: ExampleRow[],
): Promise<string> {
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
  if (!cantoneseTextWithMarkers.trim()) return "";

  const ai = new GoogleGenAI({ apiKey });

  const exampleSection =
    examples.length > 0
      ? `Here are some examples of how to translate from Verbal Cantonese to Formal Traditional Chinese. Please follow this style accurately:
--- EXAMPLES START ---
${examples
          .map(
            (ex) =>
              `Verbal Cantonese: "${ex.cantonese}"\nFormal Traditional Chinese: "${ex.traditional_chinese}"`,
          )
          .join("\n\n")}
--- EXAMPLES END ---`
      : "No examples provided. Please translate from Verbal Cantonese to Formal Traditional Chinese with a formal, accurate, and natural-sounding style.";

  const prompt = `
You are an expert linguist specializing in translating colloquial/verbal Cantonese into formal, written Traditional Chinese.
Your translations must be highly accurate, natural-sounding in a formal context, and meticulously maintain the original meaning.

IMPORTANT INSTRUCTION FOR SENTENCE MARKERS:
The Verbal Cantonese input text will be formatted with sentence markers like [S:1], [S:2], etc., at the beginning of each sentence.
You MUST preserve these markers in your output. Each translated segment MUST begin with the exact same marker.
If one original sentence is best translated into multiple parts, EACH part must start with the original marker.

${exampleSection}

Now, translate ONLY the following Verbal Cantonese text (which includes [S:N] markers) into Formal Traditional Chinese.
Do not add commentary. Output only the translated text with the preserved [S:N] markers.

--- VERBAL CANTONESE TEXT TO TRANSLATE START ---
${cantoneseTextWithMarkers}
--- VERBAL CANTONESE TEXT TO TRANSLATE END ---

Formal Traditional Chinese Translation (with [S:N] markers):
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
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
