#!/usr/bin/env python3
"""Stop the shell commands the workflow treats as sensitive, and ask first.

Prose invariants rot; a hook does not. A match does not deny the call - it
returns an "ask" decision, so the owner sees the reason and chooses whether the
command runs.
"""

import json
import re
import sys

RULES = [
    (
        r"git\s+commit\b[^|;&]*(--no-verify|(?<!\S)-n(?!\S))",
        "git commit --no-verify skips the pre-commit hook. The usual fix is to "
        "make the hook pass rather than bypass it.",
    ),
    (
        r"git\s+add\s+(-A\b|--all\b|\.(?:\s|$))",
        "git add -A / git add . stages the whole working tree, which usually "
        "holds unrelated local files. An explicit pathspec is safer.",
    ),
    (
        r"(?:npx|pnpm\s+dlx|bunx|yarn\s+dlx)\s+(eslint|tsc|vitest|playwright|jest)\b",
        "This runs a gate binary directly instead of the repo's gate script from "
        ".claude/workflow.json - the script carries the flags the gates depend on.",
    ),
    (
        r"git\s+branch\s+(-[dDM]\b|--delete\b|--move\b)",
        "This deletes or renames a branch, which is the repo owner's call.",
    ),
    (
        r"git\s+push\b[^|;&]*(--force(?!-with-lease)|(?<!\S)-f(?!\S))",
        "git push --force can overwrite others' work on the remote. "
        "--force-with-lease is the safer form.",
    ),
]


def ask(reason):
    json.dump(
        {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "ask",
                "permissionDecisionReason": f"taskflow guard: {reason}",
            }
        },
        sys.stdout,
    )


def main():
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    command = payload.get("tool_input", {}).get("command", "")
    if not command:
        return 0

    for pattern, message in RULES:
        if re.search(pattern, command):
            ask(message)
            return 0

    return 0


if __name__ == "__main__":
    sys.exit(main())
