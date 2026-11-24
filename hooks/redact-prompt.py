#!/usr/bin/env python3
"""Block a prompt that carries a secret or PII, and offer a redacted copy.

A match blocks the prompt before Claude sees it and shows the owner a suggested
prompt with placeholders to copy, paste and send. The original is never echoed.
A typed #allow-sensitive as the very first characters lets the prompt through;
anywhere else - mid-prompt, or inside pasted text - it is ignored and stripped
from the suggestion, so pasted content cannot switch the guard off.

A prompt that carries only placeholders passes, with a note for Claude not to
ask for the values. Unreadable input blocks: the guard fails closed.
"""

import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sensitive_data import load_config, redact  # noqa: E402

NAME = "taskflow sensitive data guard"
FLAG = "#allow-sensitive"
RULE = "────────"
PLACEHOLDER = re.compile(r"\[[a-z][a-z0-9_]*_\d+\]")

CONTEXT = (
    "Values in this prompt were redacted by the " + NAME + " and appear as "
    "placeholders such as [cpf_1]. Never ask the user for them. When a redacted "
    "value is needed to continue, say so, offer a step-by-step guide for the "
    "user to do it themselves, and ask whether they prefer UI or CLI guidance, "
    "defaulting to CLI if they do not say."
)


def emit(output):
    json.dump(output, sys.stdout, ensure_ascii=False)


def block(reason):
    emit(
        {
            "decision": "block",
            "reason": reason,
            "hookSpecificOutput": {
                "hookEventName": "UserPromptSubmit",
                "suppressOriginalPrompt": True,
            },
        }
    )


def check(prompt, config=None):
    if prompt.startswith(FLAG):
        return
    suggested, counts = redact(prompt, config)
    if counts:
        found = " · ".join("%d × [%s]" % (n, kind) for kind, n in counts.items())
        block(
            "%s: sensitive data found - this prompt was NOT sent.\n"
            "Found: %s\n"
            "Suggested prompt (copy, paste and send):\n%s\n%s\n%s\n"
            "To send the original instead, start the prompt with %s "
            "(typed, not pasted)."
            % (NAME, found, RULE, suggested.replace(FLAG, ""), RULE, FLAG)
        )
    elif PLACEHOLDER.search(prompt):
        emit(
            {
                "hookSpecificOutput": {
                    "hookEventName": "UserPromptSubmit",
                    "additionalContext": CONTEXT,
                }
            }
        )


def main():
    try:
        payload = json.load(sys.stdin)
        prompt = payload["prompt"]
        if not isinstance(prompt, str):
            raise TypeError("prompt is not text")
    except (ValueError, KeyError, TypeError):
        block(
            NAME + ": could not read this prompt, so it was NOT sent. "
            "Nothing was checked; try again."
        )
        return
    cwd = payload.get("cwd")
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR") or (
        cwd if isinstance(cwd, str) else ""
    )
    config = load_config(project_dir)
    if not config["enabled"]:
        return
    check(prompt, config)


if __name__ == "__main__":
    main()
