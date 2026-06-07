import type { Route } from "./+types/api.examples";
import { requireAuth } from "../lib/auth.server";
import { addExample, deleteExample, exampleExists } from "../lib/db.server";
import { NO_TRANSLATION_PLACEHOLDER } from "../lib/constants";
import { parseDirection, toCanonicalExample } from "../lib/direction";

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));

  if (intent === "promote") {
    const direction = parseDirection(form.get("direction"));
    const original = String(form.get("original") ?? "").trim();
    const translated = String(form.get("translated") ?? "").trim();
    // The sentence's "translated" side is the target; reject the placeholder
    // before normalizing to canonical example columns.
    if (!original || !translated || translated === NO_TRANSLATION_PLACEHOLDER) {
      return { ok: false, reason: "invalid" };
    }
    // Normalize to canonical (cantonese, traditional_chinese) regardless of
    // which direction produced the sentence, so one example set serves both.
    const { cantonese, traditional } = toCanonicalExample(
      direction,
      original,
      translated,
    );
    if (!cantonese || !traditional) {
      return { ok: false, reason: "invalid" };
    }
    if (await exampleExists(cantonese, traditional)) {
      return { ok: true, reason: "duplicate" };
    }
    await addExample(cantonese, traditional, "promoted");
    return { ok: true };
  }

  if (intent === "delete") {
    const id = Number(form.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      throw new Response("Invalid example id", { status: 400 });
    }
    await deleteExample(id);
    return { ok: true };
  }

  throw new Response("Unknown intent", { status: 400 });
}
