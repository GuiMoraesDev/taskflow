#!/usr/bin/env python3
"""After a commit lands, remind the model to close out the task row.

The marker and the session-log entry are the two steps most often skipped,
because the interesting part - the code - is already done.
"""

import glob
import json
import os
import re
import sys

DEFAULT_PROJECTS_DIRS = ("docs/projects", "src/docs/projects", ".planning")


def projects_dirs(cwd):
    config = os.path.join(cwd, ".claude", "workflow.json")
    try:
        with open(config) as fh:
            configured = json.load(fh).get("projectsDir")
        if configured:
            return (configured,)
    except (OSError, json.JSONDecodeError):
        pass
    return DEFAULT_PROJECTS_DIRS


def in_progress_files(cwd):
    found = []
    for base in projects_dirs(cwd):
        pattern = os.path.join(cwd, base, "*", "PROGRESS.md")
        for path in glob.glob(pattern):
            try:
                with open(path) as fh:
                    if "🔄" in fh.read():
                        found.append(os.path.relpath(path, cwd))
            except OSError:
                continue
    return found


def main():
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    command = payload.get("tool_input", {}).get("command", "")
    if not re.search(r"git\s+commit\b", command):
        return 0

    cwd = payload.get("cwd") or os.getcwd()
    pending = in_progress_files(cwd)
    if not pending:
        return 0

    context = (
        "A commit just landed and " + ", ".join(pending) + " still has a 🔄 row. "
        "Flip it to ✅ (or ⚠️ / ❌ with a reason) and append a session-log entry "
        "naming the commit hash, what actually changed, and any deviation."
    )
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "additionalContext": context,
                }
            }
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
