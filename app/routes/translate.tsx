import { Form, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import type { Route } from "./+types/translate";
import { requireAuth } from "../lib/auth.server";
import { appEnv } from "../lib/env.server";
import {
  getSentences,
  getTranslation,
  listExamples,
  saveTranslation,
} from "../lib/db.server";
import { translateTextWithExamples } from "../lib/gemini.server";
import { buildMarkedText, parseMarkers, splitSentences } from "../lib/sentences";
import { SentenceTable } from "../components/SentenceTable";
import { NO_TRANSLATION_PLACEHOLDER } from "../lib/constants";
import type { SentenceRow } from "~/types";

export function meta() {
  return [{ title: "Translate · Cantonese Style Translator" }];
}

// The result is loaded (not returned from the action) so that per-sentence
// edit/flag fetchers trigger a loader revalidation and the table reflects the
// saved DB state instead of reverting to the original action payload.
export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const url = new URL(request.url);
  const idParam = url.searchParams.get("id");
  const id = Number(idParam);
  if (idParam && Number.isInteger(id) && id > 0) {
    const translation = await getTranslation(id);
    if (translation) {
      return { sentences: await getSentences(id), input: translation.input_text };
    }
  }
  return { sentences: [] as SentenceRow[], input: "" };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const form = await request.formData();
  const input = String(form.get("input") ?? "").trim();
  if (!input) return { error: "Please enter Cantonese text." };

  let sentences = splitSentences(input);
  if (sentences.length === 0) sentences = [input];
  const marked = buildMarkedText(sentences);

  const examples = await listExamples();
  let output: string;
  try {
    output = await translateTextWithExamples(appEnv.GEMINI_API_KEY, marked, examples);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Translation failed." };
  }

  const byMarker = parseMarkers(output);
  const pairs = sentences.map((orig, i) => ({
    seq: i + 1,
    original: orig,
    ai: byMarker[`[S:${i + 1}]`] || NO_TRANSLATION_PLACEHOLDER,
  }));

  const { translationId } = await saveTranslation(input, pairs);
  // Redirect to the loader-backed view so subsequent row edits revalidate.
  return redirect(`/?id=${translationId}`);
}

export default function Translate() {
  const { sentences, input } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const nav = useNavigation();
  const busy = nav.state !== "idle";
  const error = actionData && "error" in actionData ? actionData.error : null;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Form method="post" className="bg-slate-800 p-6 rounded-lg space-y-4">
        <label htmlFor="input" className="block text-sm text-sky-300">
          Enter Verbal Cantonese:
        </label>
        <textarea
          id="input"
          name="input"
          rows={8}
          required
          defaultValue={input}
          placeholder="例如: 你食咗飯未呀？"
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-slate-100 resize-y"
        />
        <button
          disabled={busy}
          className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-md disabled:opacity-50"
        >
          {busy ? "Translating…" : "Translate to Formal Traditional Chinese"}
        </button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </Form>

      {sentences.length > 0 && (
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-sky-300 mb-3">Result — edit or flag each line</h2>
          <SentenceTable sentences={sentences} />
        </div>
      )}
    </div>
  );
}
