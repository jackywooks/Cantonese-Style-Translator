import { useFetcher } from "react-router";
import { NO_TRANSLATION_PLACEHOLDER } from "../lib/constants";
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
  const promoteFetcher = useFetcher<{ ok: boolean; reason?: string }>();

  // Optimistic flag state: reflect the in-flight submission, otherwise the
  // (revalidated) server value.
  const flagged = flagFetcher.formData
    ? flagFetcher.formData.get("flagged") === "1"
    : s.flagged === 1;

  const promoting = promoteFetcher.state !== "idle";
  const promoteResult = promoteFetcher.data;
  const promoteDone = Boolean(promoteResult?.ok);
  const promoteRejected = promoteResult?.ok === false;
  const canPromote =
    s.translated.trim() !== "" &&
    s.translated !== NO_TRANSLATION_PLACEHOLDER;

  let promoteLabel = "Add to examples";
  if (promoting) promoteLabel = "Adding…";
  else if (promoteResult?.reason === "duplicate") promoteLabel = "✓ Already in examples";
  else if (promoteDone) promoteLabel = "✓ Added to examples";
  else if (promoteRejected) promoteLabel = "Can't add (placeholder)";

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

        {canPromote && (
          <promoteFetcher.Form method="post" action="/api/examples">
            <input type="hidden" name="intent" value="promote" />
            <input type="hidden" name="cantonese" value={s.original_cantonese} />
            <input type="hidden" name="traditional" value={s.translated} />
            <button
              disabled={promoting || promoteDone}
              className="text-sky-300 hover:text-sky-200 disabled:text-slate-500"
            >
              {promoteLabel}
            </button>
          </promoteFetcher.Form>
        )}

        {s.edited === 1 && <span className="text-slate-500">edited</span>}
      </div>
    </div>
  );
}
