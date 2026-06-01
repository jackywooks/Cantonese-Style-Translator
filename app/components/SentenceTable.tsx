import { useFetcher } from "react-router";
import type { SentenceRow } from "~/types";

export function SentenceTable({ sentences }: { sentences: SentenceRow[] }) {
  return (
    <div className="space-y-3">
      {sentences.map((s) => (
        <SentenceRowItem key={s.id} s={s} />
      ))}
    </div>
  );
}

function SentenceRowItem({ s }: { s: SentenceRow }) {
  const editFetcher = useFetcher();
  const flagFetcher = useFetcher();
  const promoteFetcher = useFetcher();

  const flagged = flagFetcher.formData
    ? flagFetcher.formData.get("flagged") === "1"
    : s.flagged === 1;

  const promoted = promoteFetcher.state !== "idle" || promoteFetcher.data;

  return (
    <div
      className={`p-3 rounded-md border ${
        flagged
          ? "border-red-600 bg-red-950/30"
          : "border-slate-700 bg-slate-700/40"
      }`}
    >
      <p className="text-xs text-slate-400 mb-1">{s.original_cantonese}</p>

      <editFetcher.Form
        method="post"
        action={`/api/sentences/${s.id}`}
        className="flex gap-2"
      >
        <input type="hidden" name="intent" value="edit" />
        <input
          name="translated"
          defaultValue={s.translated}
          className="flex-1 p-2 bg-slate-800 rounded-md text-emerald-200 text-sm"
        />
        <button className="px-3 py-1 text-xs bg-slate-600 hover:bg-slate-500 rounded-md text-slate-100">
          {editFetcher.state !== "idle" ? "Saving…" : "Save"}
        </button>
      </editFetcher.Form>

      <div className="flex gap-4 mt-2 text-xs items-center">
        <flagFetcher.Form method="post" action={`/api/sentences/${s.id}`}>
          <input type="hidden" name="intent" value="flag" />
          <input type="hidden" name="flagged" value={flagged ? "0" : "1"} />
          <button
            className={
              flagged ? "text-red-300" : "text-slate-400 hover:text-red-300"
            }
          >
            {flagged ? "✓ Flagged incorrect" : "Flag incorrect"}
          </button>
        </flagFetcher.Form>

        <promoteFetcher.Form method="post" action="/api/examples">
          <input type="hidden" name="intent" value="promote" />
          <input type="hidden" name="cantonese" value={s.original_cantonese} />
          <input type="hidden" name="traditional" value={s.translated} />
          <button
            disabled={Boolean(promoted)}
            className="text-sky-300 hover:text-sky-200 disabled:text-slate-500"
          >
            {promoted ? "✓ Added to examples" : "Add to examples"}
          </button>
        </promoteFetcher.Form>

        {s.edited === 1 && <span className="text-slate-500">edited</span>}
      </div>
    </div>
  );
}
