"""Append a daily progress entry to docs/review/daily-progress.md.

Run by GitHub Actions every night. Skips silently when nothing shipped that day.

Detects "what shipped today" by listing PRs merged into main on the target date
(default: today in America/Toronto). Each PR title + number becomes a bullet
under the day's heading.

Exit code 0 = wrote an entry (or skipped because nothing shipped).
Exit code 1 only on hard error (gh missing, repo unreadable).
"""

from __future__ import annotations

import argparse
import datetime
import json
import subprocess
import sys
from pathlib import Path
from zoneinfo import ZoneInfo

REPO_ROOT = Path(__file__).resolve().parent.parent
PROGRESS_FILE = REPO_ROOT / "docs" / "review" / "daily-progress.md"
TZ = ZoneInfo("America/Toronto")


def _run(cmd: list[str]) -> str:
    """Run a command, return stdout. Exit on non-zero. Force UTF-8 — gh on
    Windows defaults to cp1252 and mangles em-dash/arrows."""
    res = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        check=False,
        encoding="utf-8",
        errors="replace",
    )
    if res.returncode != 0:
        sys.stderr.write(f"FAIL: {' '.join(cmd)}\n{res.stderr}\n")
        sys.exit(1)
    return res.stdout


def merged_prs_for(day: datetime.date) -> list[dict]:
    """Return [{number, title, mergedAt}] for PRs merged into main on `day`."""
    next_day = day + datetime.timedelta(days=1)
    raw = _run(
        [
            "gh",
            "pr",
            "list",
            "--state",
            "merged",
            "--base",
            "main",
            "--limit",
            "100",
            "--search",
            f"merged:{day.isoformat()}..{next_day.isoformat()}",
            "--json",
            "number,title,mergedAt",
        ]
    )
    items = json.loads(raw or "[]")
    out = []
    for it in items:
        merged_at = datetime.datetime.fromisoformat(it["mergedAt"].replace("Z", "+00:00"))
        local = merged_at.astimezone(TZ).date()
        if local == day:
            out.append(it)
    return out


def render_entry(day: datetime.date, prs: list[dict]) -> str:
    lines = [f"## {day.isoformat()} ({day.strftime('%A')})", ""]
    for p in sorted(prs, key=lambda x: x["number"]):
        lines.append(f"- #{p['number']} {p['title']}")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--date",
        default="",
        help="YYYY-MM-DD (default: today in America/Toronto).",
    )
    parser.add_argument(
        "--print-only",
        action="store_true",
        help="Render to stdout instead of appending to the file.",
    )
    args = parser.parse_args()

    if args.date:
        day = datetime.date.fromisoformat(args.date)
    else:
        day = datetime.datetime.now(TZ).date()

    prs = merged_prs_for(day)
    if not prs:
        print(f"{day.isoformat()}: no PRs merged — skipping.")
        return 0

    entry = render_entry(day, prs)
    if args.print_only:
        print(entry)
        return 0

    PROGRESS_FILE.parent.mkdir(parents=True, exist_ok=True)
    header = "# Daily progress\n\n"
    if PROGRESS_FILE.exists():
        existing = PROGRESS_FILE.read_text(encoding="utf-8")
        if f"## {day.isoformat()}" in existing:
            print(f"{day.isoformat()}: entry already present — skipping.")
            return 0
        if not existing.startswith(header):
            existing = header + existing
        body = existing[len(header):]
        new = header + entry + "\n" + body
    else:
        new = header + entry + "\n"
    PROGRESS_FILE.write_text(new, encoding="utf-8")
    print(f"{day.isoformat()}: appended {len(prs)} PR(s) to {PROGRESS_FILE.relative_to(REPO_ROOT)}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
