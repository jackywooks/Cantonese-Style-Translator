import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/history.$id";
import { requireAuth } from "../lib/auth.server";
import { getSentences, getTranslation } from "../lib/db.server";
import { SentenceTable } from "../components/SentenceTable";
import { DIRECTION_META, parseDirection } from "../lib/direction";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAuth(request);
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Response("Not found", { status: 404 });
  }
  const translation = await getTranslation(id);
  if (!translation) {
    throw new Response("Not found", { status: 404 });
  }
  const sentences = await getSentences(id);
  return { translation, sentences };
}

export default function HistoryDetail() {
  const { translation, sentences } = useLoaderData<typeof loader>();
  const direction = parseDirection(translation.direction);
  return (
    <section className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <Link to="/history" className="text-sky-300 hover:text-sky-200 text-sm">
        ← Back to history
      </Link>
      <div className="bg-slate-800 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold text-sky-300 mb-2">
          Run #{translation.id}
          <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-700 text-sm text-slate-300 align-middle">
            {DIRECTION_META[direction].badge}
          </span>
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          <span className="text-slate-500">Input:</span> {translation.input_text}
        </p>
        {sentences.length === 0 ? (
          <p className="text-slate-400">No sentences found for this run.</p>
        ) : (
          <SentenceTable sentences={sentences} direction={direction} />
        )}
      </div>
    </section>
  );
}
