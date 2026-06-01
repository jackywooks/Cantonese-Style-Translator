import type { Route } from "./+types/api.sentences.$id";
import { requireAuth } from "../lib/auth.server";
import { updateSentence } from "../lib/db.server";

export async function action({ request, params }: Route.ActionArgs) {
  await requireAuth(request);
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Response("Invalid sentence id", { status: 400 });
  }
  const form = await request.formData();
  const intent = String(form.get("intent"));
  if (intent === "flag") {
    await updateSentence(id, { flagged: form.get("flagged") === "1" ? 1 : 0 });
  } else if (intent === "edit") {
    await updateSentence(id, { translated: String(form.get("translated")) });
  } else {
    throw new Response("Unknown intent", { status: 400 });
  }
  return { ok: true };
}
