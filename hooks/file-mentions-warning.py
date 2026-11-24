#!/usr/bin/env python3
"""Warn at session start that @file mentions bypass the sensitive data guard.

An @file mention sends the file to the model without passing the Read tool, so
the output redaction never sees it. The warning shows once, on a fresh startup,
and only while the guard is enabled and the mentions are not switched off.
Unreadable input prints nothing: this hook never breaks session start.
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sensitive_data import load_config  # noqa: E402

NAME = "taskflow sensitive data guard"
VAR = "CLAUDE_CODE_DISABLE_FILE_MENTIONS"


def main():
    try:
        payload = json.load(sys.stdin)
        if payload.get("source") != "startup":
            return
    except (ValueError, AttributeError):
        return
    if os.environ.get(VAR) == "1":
        return
    cwd = payload.get("cwd")
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR") or (
        cwd if isinstance(cwd, str) else os.getcwd()
    )
    if not load_config(project_dir)["enabled"]:
        return
    json.dump(
        {
            "systemMessage": NAME + ": @file mentions skip the guard and send "
            "files to the model unredacted. Set %s=1 in your shell or settings "
            "env so they go through the Read tool and get redacted." % VAR
        },
        sys.stdout,
        ensure_ascii=False,
    )


if __name__ == "__main__":
    main()
