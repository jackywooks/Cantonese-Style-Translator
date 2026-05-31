#!/usr/bin/env python
"""PreToolUse Bash hook — block dangerous / destructive operations.

Reads tool_input JSON from stdin, matches command against deny patterns, outputs
{"decision":"block","reason":"..."} to block or {"decision":"approve"} to allow.

Bypass: prefix command with `CONFIRMED=1` after the action has been explicitly
confirmed (draft + ask first; prefix is the escape hatch).
"""
import json
import os
import re
import subprocess
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

PROTECTED = ("main", "master")


def current_git_branch():
    """Return current git branch, or None if detection fails (fail-open).

    Test override: set CHECK_BASH_BRANCH_OVERRIDE env var to simulate a branch.
    """
    override = os.environ.get("CHECK_BASH_BRANCH_OVERRIDE")
    if override is not None:
        return override or None
    try:
        result = subprocess.run(
            ["git", "branch", "--show-current"],
            capture_output=True,
            text=True,
            timeout=3,
        )
        if result.returncode == 0:
            return result.stdout.strip() or None
    except Exception:
        pass
    return None


_SHELL_OP = re.compile(r"\|\||&&|[|;&<>\n]")


def strip_heredocs(cmd):
    """Replace heredoc bodies with a blank line — prevents false-positive matches
    against user-authored content (e.g. commit messages containing `rm -rf`)."""
    while True:
        m = re.search(r'<<-?\s*([\'"]?)(\w+)\1', cmd)
        if not m:
            return cmd
        marker = m.group(2)
        body_start = m.end()
        end = re.search(r"^[ \t]*" + re.escape(marker) + r"[ \t]*$", cmd[body_start:], re.MULTILINE)
        if end:
            cmd = cmd[: m.start()] + "\n" + cmd[body_start + end.end() :]
        else:
            cmd = cmd[: m.start()]


def _iter_push_segments(cmd):
    """Yield the argument-segment for each `git push` invocation."""
    for m in re.finditer(r"(?:^|[;&|\n]|\$\()\s*git\s+push\b", cmd):
        start = m.end()
        rest = cmd[start:]
        op = _SHELL_OP.search(rest)
        yield rest[: op.start()] if op else rest


def check_git_push(cmd):
    """Return a block reason if the git push is dangerous, else None."""
    for args in _iter_push_segments(cmd):
        if re.search(r"(^|\s)--dry-run\b", args):
            continue
        if re.search(r"(^|\s)(--force|--force-with-lease|-f)\b", args):
            return "Force push 會覆蓋遠端歷史,必須先確認。"
        if re.search(r"(^|\s)--all\b", args):
            return "`git push --all` 會 push 所有 branch(可能包括 main),先確認要 push 邊幾個。"
        if re.search(r"(\s|:)(main|master)(\s|$)", args):
            return "禁止直接 push 到 main/master。用 feature branch + PR。"
        if re.search(r"(^|\s)--tags\b", args):
            continue
        tokens = args.split()
        non_flags = [t for t in tokens if not t.startswith("-") and t != "HEAD"]
        if len(non_flags) <= 1:
            branch = current_git_branch()
            if branch in PROTECTED:
                return (
                    f"當前 branch 係 `{branch}`,bare `git push` 會 push 上 remote {branch}。"
                    "禁止直接 push 到 main/master。"
                )
    return None


PATTERNS = [
    (
        r"(^|[;&|\n]|\$\()\s*(sudo\s+)?rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)",
        "rm -rf 係 destructive 操作,先確認過路徑同範圍再執行。",
    ),
    (
        r"\bxargs\s+(?:\S+\s+){0,5}(?:sudo\s+)?rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)",
        "rm -rf 經由 xargs 執行,destructive 操作需要先確認。",
    ),
    (
        r'(-exec|\b(sh|bash)\s+-c|\bexec)\s+["\']?(?:sudo\s+)?rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)',
        "rm -rf 經由 exec/sh -c/bash -c 執行,destructive 操作需要先確認。",
    ),
    (
        r"git\s+reset\s+.*--hard\b",
        "git reset --hard 會丟失未提交嘅改動,先確認過再執行。",
    ),
    (
        r"\bgh\s+(issue|pr)\s+(create|edit|close|reopen|comment|delete|merge)\b",
        "GitHub 寫入操作需要先確認。請先把內容睇一次,確認後再執行。",
    ),
]


def main():
    try:
        payload = json.load(sys.stdin)
        command = payload.get("tool_input", {}).get("command", "")
    except Exception:
        command = ""

    # Strip heredoc bodies so commit messages / here-docs don't trigger patterns
    command = strip_heredocs(command)

    # Bypass: explicit CONFIRMED=1 prefix attests the action was confirmed
    # after seeing the content.
    if re.search(r"\bCONFIRMED\s*=\s*1\b", command):
        print('{"decision":"approve"}')
        return

    reason = check_git_push(command)
    if reason:
        print(json.dumps({"decision": "block", "reason": reason}, ensure_ascii=False))
        return

    for pattern, msg in PATTERNS:
        if re.search(pattern, command):
            print(json.dumps({"decision": "block", "reason": msg}, ensure_ascii=False))
            return

    print('{"decision":"approve"}')


if __name__ == "__main__":
    main()
