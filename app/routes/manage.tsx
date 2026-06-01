import { Form, useLoaderData } from "react-router";
import type { Route } from "./+types/manage";
import { requireAuth } from "../lib/auth.server";
import {
  addExample,
  deleteExample,
  listExamples,
  updateExample,
} from "../lib/db.server";

export function meta() {
  return [{ title: "Examples · Cantonese Style Translator" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return { examples: await listExamples() };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));
  if (intent === "add") {
    await addExample(
      String(form.get("cantonese")),
      String(form.get("traditional")),
    );
  } else if (intent === "edit") {
    await updateExample(
      Number(form.get("id")),
      String(form.get("cantonese")),
      String(form.get("traditional")),
    );
  } else if (intent === "delete") {
    await deleteExample(Number(form.get("id")));
  }
  return { ok: true };
}

export default function Manage() {
  const { examples } = useLoaderData<typeof loader>();
  return (
    <section className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-slate-800 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold text-sky-300 mb-4">
          Manage Examples ({examples.length})
        </h2>

        <Form
          method="post"
          className="flex flex-col sm:flex-row gap-2 mb-6"
        >
          <input type="hidden" name="intent" value="add" />
          <input
            name="cantonese"
            required
            placeholder="Verbal Cantonese"
            className="flex-1 p-2 bg-slate-700 rounded-md text-slate-100"
          />
          <input
            name="traditional"
            required
            placeholder="Formal Traditional Chinese"
            className="flex-1 p-2 bg-slate-700 rounded-md text-slate-100"
          />
          <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md">
            Add
          </button>
        </Form>

        {examples.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No examples yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead>
                <tr>
                  <th className="text-left text-xs text-sky-300 px-2 py-2">
                    Cantonese
                  </th>
                  <th className="text-left text-xs text-sky-300 px-2 py-2">
                    Traditional
                  </th>
                  <th className="text-left text-xs text-sky-300 px-2 py-2 w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {examples.map((ex) => (
                  <tr key={ex.id}>
                    <td className="px-2 py-2 text-sm text-slate-200 break-words">
                      {ex.cantonese}
                    </td>
                    <td className="px-2 py-2 text-sm text-emerald-300 break-words">
                      {ex.traditional_chinese}
                    </td>
                    <td className="px-2 py-2">
                      <Form method="post">
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="id" value={ex.id} />
                        <button className="text-red-400 hover:text-red-300 text-sm">
                          Delete
                        </button>
                      </Form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
