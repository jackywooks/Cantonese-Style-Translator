import type { Route } from "./+types/api.examples";
import { requireAuth } from "../lib/auth.server";
import { addExample, deleteExample, exampleExists } from "../lib/db.server";
import { NO_TRANSLATION_PLACEHOLDER } from "../lib/constants";

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));

  if (intent === "promote") {
    const cantonese = String(form.get("cantonese") ?? "").trim();
    const traditional = String(form.get("traditional") ?? "").trim();
    // Don't pollute the example set (which feeds the AI prompt) with empty
    // text, the "no translation" placeholder, or exact duplicates.
    if (!cantonese || !traditional || traditional === NO_TRANSLATION_PLACEHOLDER) {
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
