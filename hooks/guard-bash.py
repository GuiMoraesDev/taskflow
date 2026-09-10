#!/usr/bin/env python3
"""Stop the shell commands the workflow treats as sensitive, and ask first.

Prose invariants rot; a hook does not. A match does not deny the call - it
returns an "ask" decision, so the owner sees the reason and chooses whether the
command runs. The one refusal is a git force flag with no reason attached: the
call's description must say why force is needed before the owner is asked.

Every rule is checked, not just the first to match, so a chained command shows
the owner each risk it carries - listed in priority order, force first.
"""

import json
import re
import sys

# Priority order, most important first; the force gate sits above all of these.
RULES = [
    (
        r"git\s+commit\b[^|;&]*(--no-verify|(?<!\S)-n(?!\S))",
        "git commit --no-verify skips the pre-commit hook. The usual fix is to "
        "make the hook pass rather than bypass it.",
    ),
    (
        r"git\s+branch\s+(-[dDM]\b|--delete\b|--move\b)",
        "This deletes or renames a branch, which is the repo owner's call.",
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
]

FORCE = re.compile(
    r"\bgit\b[^|;&]*?(?<!\S)(--force(?!-with-lease|-if-includes)|-[a-zA-Z]*f[a-zA-Z]*)(?!\S)"
)

FORCE_RISK = (
    "This runs a git command with a force flag, which skips git's own safety "
    "checks and can discard work (push -f overwrites the remote - "
    "--force-with-lease is the safer form; clean -f, checkout -f, branch -f, "
    "add -f past .gitignore)."
)

FORCE_UNEXPLAINED = (
    "A git force flag needs a reason. First look for a way without force - "
    "--force-with-lease, a stash, a new branch - and use it if it works. If "
    "force is really needed, run the command again with the Bash description "
    "saying why force is necessary here, not just what the command does."
)


def listed(reasons):
    if len(reasons) == 1:
        return reasons[0]
    return " ".join(f"({i}) {r}" for i, r in enumerate(reasons, 1))


def decide(decision, reason):
    json.dump(
        {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": decision,
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

    tool_input = payload.get("tool_input", {})
    command = tool_input.get("command", "")
    if not command:
        return 0

    reasons = []
    if FORCE.search(command):
        why = (tool_input.get("description") or "").strip()
        if not why:
            decide("deny", FORCE_UNEXPLAINED)
            return 0
        reasons.append(f"{FORCE_RISK} Reason given: {why}")

    reasons += [message for pattern, message in RULES if re.search(pattern, command)]
    if reasons:
        decide("ask", listed(reasons))
    return 0


if __name__ == "__main__":
    sys.exit(main())
