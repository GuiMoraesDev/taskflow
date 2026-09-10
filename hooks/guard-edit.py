#!/usr/bin/env python3
"""Ask before edits to files the workflow treats as sensitive.

Two cases, both of which look reasonable in the moment and are wrong later:
a test-runner config edited to silence flakiness, and a dependency vulnerability
papered over with a resolution override. A match does not deny the edit - it
returns an "ask" decision, so the owner sees the reason and chooses. Both checks
always run, and every match is listed in one prompt.
"""

import json
import os
import re
import sys

SENSITIVE_FILES = (
    (
        re.compile(
            r"(playwright|cypress|jest|vitest|karma)\.config\.[a-z]+$|"
            r"(pytest\.ini|tox\.ini)$"
        ),
        "This edits the test-runner config. Tuning the runner to work around "
        "flakiness usually hides a broken test - fixing the test is the "
        "safer route.",
    ),
)

OVERRIDE_KEYS = ("overrides", "resolutions")


def written_text(tool_input):
    parts = [tool_input.get("content", ""), tool_input.get("new_string", "")]
    parts += [e.get("new_string", "") for e in tool_input.get("edits", [])]
    return "\n".join(p for p in parts if p)


def listed(reasons):
    if len(reasons) == 1:
        return reasons[0]
    return " ".join(f"({i}) {r}" for i, r in enumerate(reasons, 1))


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

    tool_input = payload.get("tool_input", {})
    path = tool_input.get("file_path", "")
    if not path:
        return 0

    reasons = [
        message
        for pattern, message in SENSITIVE_FILES
        if pattern.search(path) and os.path.exists(path)
    ]

    if os.path.basename(path) == "package.json":
        text = written_text(tool_input)
        if any(f'"{key}"' in text for key in OVERRIDE_KEYS):
            reasons.append(
                'This adds "overrides"/"resolutions" to package.json. An '
                "override hides the vulnerable version rather than removing it - "
                "upgrading the real dependency is the safer fix."
            )

    if reasons:
        ask(listed(reasons))
    return 0


if __name__ == "__main__":
    sys.exit(main())
