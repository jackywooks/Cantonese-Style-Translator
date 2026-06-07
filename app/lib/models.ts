/** Allow-listed Gemini models selectable from Settings. */
export const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (fast, default)" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (higher quality)" },
] as const;

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export function isAllowedModel(id: string): boolean {
  return GEMINI_MODELS.some((m) => m.id === id);
}
