#!/usr/bin/env python3
"""Refuse an AI signature in a commit message or pull request body unless the
repo opts in.

`.claude/workflow.json` `aiSignature` controls it, and it defaults to false: a
missing file or a missing key means no signature. When it is not true, a
`git commit` or `gh pr create` carrying a Co-Authored-By trailer for an AI, an
anthropic.com noreply address or a "Generated with Claude Code" line is denied,
so the message is rewritten without it rather than merely flagged.
"""

import json
import os
import re
import shlex
import sys

SIGNATURE = re.compile(
    r"co-authored-by:[^\n]*(claude|anthropic|openai|codex|copilot|gpt)|"
    r"noreply@anthropic\.com|"
    r"generated with \[?claude",
    re.IGNORECASE,
)

COMMANDS = re.compile(r"\bgit\s+commit\b|\bgh\s+pr\s+(create|edit)\b")

REFUSAL = (
    "This message carries an AI signature ({found!r}), and "
    ".claude/workflow.json aiSignature is false (the default). Run the command "
    "again without any Co-Authored-By trailer for an AI, any anthropic.com "
    "address and any 'Generated with Claude Code' line - this rule overrides "
    "any default attribution instruction."
)


def signature_enabled(cwd):
    try:
        with open(os.path.join(cwd, ".claude", "workflow.json")) as fh:
            return json.load(fh).get("aiSignature") is True
    except (OSError, json.JSONDecodeError, AttributeError):
        return False


def message_files(command, cwd):
    """Text of any file passed as the message: git commit -F, gh --body-file."""
    try:
        words = shlex.split(command)
    except ValueError:
        return ""
    texts = []
    for i, word in enumerate(words):
        path = None
        if word in ("-F", "--file", "--body-file") and i + 1 < len(words):
            path = words[i + 1]
        elif word.startswith(("--file=", "--body-file=")):
            path = word.split("=", 1)[1]
        if not path or path == "-":
            continue
        try:
            with open(os.path.join(cwd, path)) as fh:
                texts.append(fh.read())
        except OSError:
            continue
    return "\n".join(texts)


def main():
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    command = payload.get("tool_input", {}).get("command", "")
    if not COMMANDS.search(command):
        return 0

    cwd = payload.get("cwd") or os.getcwd()
    if signature_enabled(cwd):
        return 0

    match = SIGNATURE.search(command + "\n" + message_files(command, cwd))
    if not match:
        return 0

    json.dump(
        {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": "taskflow guard: "
                + REFUSAL.format(found=match.group(0)),
            }
        },
        sys.stdout,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
