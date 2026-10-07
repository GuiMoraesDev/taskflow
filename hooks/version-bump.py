#!/usr/bin/env python3
"""Keep a plugin's version moving with every change that leaves the machine.

Only repos that ship `.claude-plugin/plugin.json` are touched. The base is the
version on the remote default branch.

- `git commit`: when plugin.json still carries the base version, bump the patch
  number and stage the file, so the bump lands in the commit being made. A
  branch that already bumped is left alone - one bump per branch.
- `git push`: when the version at HEAD is not above the base, deny the push.
  This catches a commit made with a pathspec that left the staged bump behind.
"""

import json
import os
import re
import subprocess
import sys

MANIFEST = ".claude-plugin/plugin.json"
VERSION = re.compile(r'("version"\s*:\s*")(\d+)\.(\d+)\.(\d+)(")')


def git(cwd, *args):
    result = subprocess.run(
        ["git", *args], cwd=cwd, capture_output=True, text=True, check=False
    )
    return result.stdout.strip() if result.returncode == 0 else None


def parse(text):
    match = VERSION.search(text or "")
    return tuple(int(n) for n in match.group(2, 3, 4)) if match else None


def base_version(cwd):
    head = git(cwd, "symbolic-ref", "--short", "refs/remotes/origin/HEAD")
    for ref in (head, "origin/main", "origin/master"):
        if ref:
            version = parse(git(cwd, "show", f"{ref}:{MANIFEST}"))
            if version:
                return version
    return None


def respond(decision=None, reason=None, context=None):
    output = {"hookEventName": "PreToolUse"}
    if decision:
        output["permissionDecision"] = decision
        output["permissionDecisionReason"] = f"taskflow version: {reason}"
    if context:
        output["additionalContext"] = context
    json.dump({"hookSpecificOutput": output}, sys.stdout)


def on_commit(cwd, base):
    path = os.path.join(cwd, MANIFEST)
    with open(path) as fh:
        text = fh.read()
    current = parse(text)
    if not current or current > base:
        return

    bumped = f"{base[0]}.{base[1]}.{base[2] + 1}"
    with open(path, "w") as fh:
        fh.write(VERSION.sub(rf"\g<1>{bumped}\g<5>", text, count=1))
    git(cwd, "add", "--", MANIFEST)
    respond(
        context=f"taskflow version: bumped {MANIFEST} to {bumped} and staged it, "
        "so it lands in this commit. Raise the minor or major number by hand "
        "instead when the change warrants it."
    )


def on_push(cwd, base):
    head = parse(git(cwd, "show", f"HEAD:{MANIFEST}"))
    if head and head > base:
        return
    respond(
        "deny",
        f"{MANIFEST} at HEAD is not above the remote's "
        f"{'.'.join(map(str, base))}. Bump the version, commit it, then push.",
    )


def main():
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    command = payload.get("tool_input", {}).get("command", "")
    committing = re.search(r"\bgit\s+commit\b", command)
    pushing = re.search(r"\bgit\s+push\b", command)
    if not (committing or pushing):
        return 0

    cwd = payload.get("cwd") or os.getcwd()
    root = git(cwd, "rev-parse", "--show-toplevel")
    if not root or not os.path.isfile(os.path.join(root, MANIFEST)):
        return 0

    base = base_version(root)
    if not base:
        return 0

    if committing:
        on_commit(root, base)
    else:
        on_push(root, base)
    return 0


if __name__ == "__main__":
    sys.exit(main())
