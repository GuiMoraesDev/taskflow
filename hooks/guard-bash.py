#!/usr/bin/env python3
"""Block the shell commands the workflow forbids, before they run.

Prose invariants rot; a hook does not. Exit 2 denies the call and hands the
message back to the model.
"""

import json
import re
import sys

RULES = [
    (
        r"git\s+commit\b[^|;&]*(--no-verify|(?<!\S)-n(?!\S))",
        "git commit --no-verify is forbidden. Let the pre-commit hook run. "
        "If it fails, fix the failure - do not bypass it.",
    ),
    (
        r"git\s+add\s+(-A\b|--all\b|\.(?:\s|$))",
        "git add -A / git add . is forbidden. Stage an explicit pathspec - the "
        "working tree usually holds unrelated local files.",
    ),
    (
        r"(?:npx|pnpm\s+dlx|bunx|yarn\s+dlx)\s+(eslint|tsc|vitest|playwright|jest)\b",
        "Run the repo's own gate script from .claude/workflow.json, not the "
        "binary directly - the script carries the flags the gates depend on.",
    ),
    (
        r"git\s+(checkout|switch)\s+-[bB]\b|git\s+branch\s+(?!-[avl])",
        "Branch creation is the repo owner's call. Commit to the current branch, "
        "or ask.",
    ),
    (
        r"git\s+push\b[^|;&]*(--force(?!-with-lease)|(?<!\S)-f(?!\S))",
        "git push --force is forbidden. Use --force-with-lease, and only when "
        "the owner asked for it.",
    ),
]


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
            print(message, file=sys.stderr)
            return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
