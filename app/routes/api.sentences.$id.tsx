import type { Route } from "./+types/api.sentences.$id";
import { requireAuth } from "../lib/auth.server";
import { updateSentence } from "../lib/db.server";

export async function action({ request, params }: Route.ActionArgs) {
  await requireAuth(request);
  const id = Number(params.id);
  const form = await request.formData();
  const intent = String(form.get("intent"));
  if (intent === "flag") {
    await updateSentence(id, { flagged: Number(form.get("flagged")) });
  } else if (intent === "edit") {
    await updateSentence(id, { translated: String(form.get("translated")) });
  }
  return { ok: true };
}
