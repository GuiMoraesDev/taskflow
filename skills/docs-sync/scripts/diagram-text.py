#!/usr/bin/env python3
"""Dump every text label in one or more .excalidraw files, grouped by file.

Labels are the greppable surface of a diagram: enough to find a stale claim,
never enough to fix one - a JSON edit changes no layout.
"""

import json
import sys


def labels(path):
    with open(path) as fh:
        doc = json.load(fh)
    return [
        e["text"].strip()
        for e in doc.get("elements", [])
        if e.get("type") == "text" and e.get("text", "").strip()
    ]


def main(paths):
    if not paths:
        print("usage: diagram-text.py <file.excalidraw> [...]", file=sys.stderr)
        return 2
    for path in paths:
        print(f"=== {path}")
        try:
            for text in labels(path):
                print(text)
        except (OSError, json.JSONDecodeError) as err:
            print(f"  unreadable: {err}", file=sys.stderr)
        print()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
