import type { Route } from "./+types/api.examples";
import { requireAuth } from "../lib/auth.server";
import { addExample, deleteExample } from "../lib/db.server";

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));
  if (intent === "promote") {
    await addExample(
      String(form.get("cantonese")),
      String(form.get("traditional")),
      "promoted",
    );
  } else if (intent === "delete") {
    await deleteExample(Number(form.get("id")));
  }
  return { ok: true };
}
