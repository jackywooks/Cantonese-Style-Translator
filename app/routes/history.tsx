import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/history";
import { requireAuth } from "../lib/auth.server";
import { listRecentTranslations } from "../lib/db.server";
import { DIRECTION_META, parseDirection } from "../lib/direction";

export function meta() {
  return [{ title: "History · Cantonese Style Translator" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return { runs: await listRecentTranslations(50) };
}

export default function History() {
  const { runs } = useLoaderData<typeof loader>();
  return (
    <section className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-slate-800 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold text-sky-300 mb-4">History</h2>
        {runs.length === 0 ? (
          <p className="text-slate-400">No translations yet.</p>
        ) : (
          <ul className="divide-y divide-slate-700">
            {runs.map((r) => (
              <li key={r.id} className="py-3">
                <Link
                  to={`/history/${r.id}`}
                  className="text-sky-300 hover:text-sky-200 text-sm"
                >
                  #{r.id} · {r.created_at}
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-700 text-xs text-slate-300">
                    {DIRECTION_META[parseDirection(r.direction)].badge}
                  </span>
                </Link>
                <p className="text-slate-400 text-sm truncate">
                  {r.input_text}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
