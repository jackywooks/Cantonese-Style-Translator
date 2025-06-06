
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { TranslationExample } from '../types';

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.error("API_KEY environment variable not set. Gemini API functionality will be disabled.");
}

const MODEL_NAME = "gemini-2.5-flash-preview-04-17";

export const translateTextWithExamples = async (
  cantoneseTextWithMarkers: string, // Input text will now contain [S:N] markers
  examples: TranslationExample[]
): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini API client is not initialized. Please ensure API_KEY is set.");
  }
  if (!cantoneseTextWithMarkers.trim()) {
    return ""; 
  }

  const exampleSection = examples.length > 0
    ? `Here are some examples of how to translate from Verbal Cantonese to Formal Traditional Chinese. Please follow this style accurately:
--- EXAMPLES START ---
${examples.map(ex => `Verbal Cantonese: "${ex.cantonese}"\nFormal Traditional Chinese: "${ex.traditionalChinese}"`).join('\n\n')}
--- EXAMPLES END ---`
    : "No examples provided. Please translate from Verbal Cantonese to Formal Traditional Chinese with a formal, accurate, and natural-sounding style.";

  const prompt = `
You are an expert linguist specializing in translating colloquial/verbal Cantonese into formal, written Traditional Chinese.
Your translations must be highly accurate, natural-sounding in a formal context, and meticulously maintain the original meaning.

IMPORTANT INSTRUCTION FOR SENTENCE MARKERS:
The Verbal Cantonese input text will be formatted with sentence markers like [S:1], [S:2], etc., at the beginning of each sentence. For example: "[S:1] First Cantonese sentence. [S:2] Second Cantonese sentence."
You MUST preserve these markers in your output. Each segment of your Traditional Chinese translation that corresponds to an original marked sentence MUST begin with the exact same marker.
For instance, if the input is "[S:1] Original sentence.", your translation should be "[S:1] Translated sentence."
If an original sentence (e.g., "[S:1] Long original sentence.") is best translated into multiple parts or sentences in Traditional Chinese, EACH of those translated parts must start with the original marker. For example: "[S:1] Translated part one. [S:1] Translated part two."
Ensure that the markers are at the very beginning of the corresponding translated segment, followed by a space, then the translated text.

${exampleSection}

Now, please translate ONLY the following Verbal Cantonese text (which includes [S:N] markers) into Formal Traditional Chinese, following all instructions above.
Do not add any extra commentary, explanations, or conversational remarks. Output only the translated text with the preserved [S:N] markers.

--- VERBAL CANTONESE TEXT TO TRANSLATE START ---
${cantoneseTextWithMarkers}
--- VERBAL CANTONESE TEXT TO TRANSLATE END ---

Formal Traditional Chinese Translation (with [S:N] markers):
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { temperature: 0.3 } // Set temperature for potentially more consistent output
    });
    const translatedText = response.text;
    return translatedText.trim();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID')) {
            throw new Error("The Gemini API Key is invalid or not authorized. Please check your API_KEY environment variable.");
        }
         if (error.message.includes('quota')) {
            throw new Error("Gemini API quota exceeded. Please try again later or check your quota limits.");
        }
        throw new Error(`Failed to translate due to an API error: ${error.message}`);
    }
    throw new Error("An unknown error occurred during translation with the Gemini API.");
  }
};