#!/usr/bin/env python3
"""Block edits to files the workflow keeps off-limits.

Two cases, both of which look reasonable in the moment and are wrong later:
a test-runner config edited to silence flakiness, and a dependency vulnerability
papered over with a resolution override.
"""

import json
import os
import re
import sys

BLOCKED_FILES = (
    (
        re.compile(
            r"(playwright|cypress|jest|vitest|karma)\.config\.[a-z]+$|"
            r"(pytest\.ini|tox\.ini)$"
        ),
        "The test-runner config is off-limits. Do not tune the runner to work "
        "around flakiness - fix the test, or hand the config change to the repo "
        "owner.",
    ),
)

OVERRIDE_KEYS = ("overrides", "resolutions")


def written_text(tool_input):
    parts = [tool_input.get("content", ""), tool_input.get("new_string", "")]
    parts += [e.get("new_string", "") for e in tool_input.get("edits", [])]
    return "\n".join(p for p in parts if p)


def main():
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    tool_input = payload.get("tool_input", {})
    path = tool_input.get("file_path", "")
    if not path:
        return 0

    for pattern, message in BLOCKED_FILES:
        if pattern.search(path) and os.path.exists(path):
            print(message, file=sys.stderr)
            return 2

    if os.path.basename(path) == "package.json":
        text = written_text(tool_input)
        if any(f'"{key}"' in text for key in OVERRIDE_KEYS):
            print(
                'Adding "overrides"/"resolutions" to package.json is forbidden. '
                "Upgrade the real dependency instead - an override hides the "
                "vulnerable version rather than removing it.",
                file=sys.stderr,
            )
            return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
