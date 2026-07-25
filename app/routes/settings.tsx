import { Form, useFetcher, useLoaderData } from "react-router";
import type { Route } from "./+types/settings";
import { requireAuth } from "../lib/auth.server";
import {
  clearGeminiApiKey,
  getApiKeyStatus,
  getGeminiModel,
  setGeminiApiKey,
  setGeminiModel,
} from "../lib/settings.server";
import { translateTextWithExamples } from "../lib/gemini.server";
import { getGeminiApiKey } from "../lib/settings.server";
import { GEMINI_MODELS, isAllowedModel } from "../lib/models";

export function meta() {
  return [{ title: "Settings · Cantonese Style Translator" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const [status, model] = await Promise.all([
    getApiKeyStatus(),
    getGeminiModel(),
  ]);
  return { status, model, models: GEMINI_MODELS };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));

  if (intent === "save_key") {
    const key = String(form.get("apiKey") ?? "").trim();
    if (!key) return { ok: false, error: "Enter a key to save." };
    await setGeminiApiKey(key);
    return { ok: true, message: "API key saved." };
  }

  if (intent === "clear_key") {
    await clearGeminiApiKey();
    return { ok: true, message: "Saved key cleared." };
  }

  if (intent === "save_model") {
    const model = String(form.get("model") ?? "");
    if (!isAllowedModel(model)) return { ok: false, error: "Unknown model." };
    await setGeminiModel(model);
    return { ok: true, message: "Model updated." };
  }

  if (intent === "test_key") {
    let key: string;
    try {
      key = await getGeminiApiKey();
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "No key." };
    }
    const model = await getGeminiModel();
    try {
      const out = await translateTextWithExamples(key, "[S:1] 你好", [], "c2f", model);
      return { ok: Boolean(out), message: "Key works ✓" };
    } catch (e) {
      // Sanitize: never echo the key back, even if an SDK error embedded it.
      let msg = e instanceof Error ? e.message : "Test failed.";
      if (key) msg = msg.split(key).join("••••");
      return { ok: false, error: msg };
    }
  }

  return { ok: false, error: "Unknown action." };
}

export default function Settings() {
  const { status, model, models } = useLoaderData<typeof loader>();
  const testFetcher = useFetcher<{ ok: boolean; message?: string; error?: string }>();

  const statusText =
    status.source === "settings"
      ? `Using saved key (${status.hint})`
      : status.source === "secret"
        ? `Using Worker secret (${status.hint})`
        : "Not configured";

  return (
    <section className="w-full max-w-2xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-semibold text-sky-300">Settings</h2>

      <div className="bg-slate-800 p-6 rounded-lg space-y-4">
        <h3 className="text-sky-300 font-medium">Gemini API key</h3>
        <p className="text-sm text-slate-400">
          Status: <span className="text-slate-200">{statusText}</span>
        </p>

        <Form method="post" className="flex flex-col sm:flex-row gap-2">
          <input type="hidden" name="intent" value="save_key" />
          <input
            type="password"
            name="apiKey"
            placeholder="Paste a new Gemini API key"
            autoComplete="off"
            className="flex-1 p-2 bg-slate-700 rounded-md text-slate-100"
          />
          <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md">
            Save key
          </button>
        </Form>

        <div className="flex gap-3">
          <Form method="post">
            <input type="hidden" name="intent" value="clear_key" />
            <button className="text-sm text-red-400 hover:text-red-300">
              Clear saved key (fall back to secret)
            </button>
          </Form>

          <testFetcher.Form method="post">
            <input type="hidden" name="intent" value="test_key" />
            <button className="text-sm text-sky-300 hover:text-sky-200">
              {testFetcher.state !== "idle" ? "Testing…" : "Test key"}
            </button>
          </testFetcher.Form>
        </div>

        {testFetcher.data?.ok && (
          <p className="text-emerald-400 text-sm">{testFetcher.data.message}</p>
        )}
        {testFetcher.data && !testFetcher.data.ok && (
          <p className="text-red-400 text-sm">{testFetcher.data.error}</p>
        )}
      </div>

      <div className="bg-slate-800 p-6 rounded-lg space-y-4">
        <h3 className="text-sky-300 font-medium">Model</h3>
        <Form method="post" className="flex gap-2 items-center">
          <input type="hidden" name="intent" value="save_model" />
          <select
            name="model"
            defaultValue={model}
            className="flex-1 p-2 bg-slate-700 rounded-md text-slate-100"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md">
            Save model
          </button>
        </Form>
      </div>
    </section>
  );
}
