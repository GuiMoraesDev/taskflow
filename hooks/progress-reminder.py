#!/usr/bin/env python3
"""After a commit lands, remind the model to close out the task row.

The marker and the session-log entry are the two steps most often skipped,
because the interesting part - the code - is already done.
"""

import glob
import json
import os
import re
import sys

# A ledger row whose status cell is in progress - not the legend line that also shows the symbol.
IN_PROGRESS_ROW = re.compile(r"^\|\s*🔄")

DEFAULT_PROJECTS_DIR = "docs/projects"
ENV_KEYS = (
    "TASKFLOW_PLANS_SOURCE",
    "TASKFLOW_OBSIDIAN_VAULT",
    "TASKFLOW_OBSIDIAN_VAULT_PATH",
    "TASKFLOW_OBSIDIAN_PATH",
)


def basename(path):
    return path.rstrip("/").split("/")[-1]


def read_projects_dir(cwd):
    config = os.path.join(cwd, ".claude", "workflow.json")
    try:
        with open(config) as fh:
            return json.load(fh).get("projectsDir") or None
    except (OSError, json.JSONDecodeError, AttributeError):
        return None


# workflow.env is untracked, so only the keys that pick the plan source are read.
def parse_workflow_env(text):
    env = {}
    for line in text.split("\n"):
        line = line.strip()
        separator = line.find("=")
        if line.startswith("#") or separator < 1:
            continue
        key = line[:separator].strip()
        if key in ENV_KEYS:
            env[key] = line[separator + 1 :].strip()
    return env


def read_workflow_env(cwd):
    try:
        with open(os.path.join(cwd, ".claude", "workflow.env")) as fh:
            return parse_workflow_env(fh.read())
    except OSError:
        return {}


# None when obsidian.json is missing or unreadable.
def read_obsidian_vaults():
    config = os.path.expanduser("~/Library/Application Support/obsidian/obsidian.json")
    try:
        with open(config) as fh:
            vaults = json.load(fh).get("vaults") or {}
        return [
            v["path"]
            for v in vaults.values()
            if isinstance(v, dict) and isinstance(v.get("path"), str)
        ]
    except (OSError, json.JSONDecodeError, AttributeError):
        return None


def vault_path(env, vaults):
    explicit = env.get("TASKFLOW_OBSIDIAN_VAULT_PATH")
    if explicit:
        return explicit if explicit.startswith("/") else None

    name = env.get("TASKFLOW_OBSIDIAN_VAULT")
    if not name or vaults is None:
        return None

    matches = [path for path in vaults if basename(path) == name]
    return matches[0] if len(matches) == 1 else None


# With Obsidian as the source a problem yields None (the hook stays silent),
# never a repo fallback.
def resolve_plan_dir(cwd):
    env = read_workflow_env(cwd)
    if env.get("TASKFLOW_PLANS_SOURCE") != "obsidian":
        projects_dir = read_projects_dir(cwd) or DEFAULT_PROJECTS_DIR
        return os.path.join(cwd, projects_dir), projects_dir

    inner = env.get("TASKFLOW_OBSIDIAN_PATH", "").rstrip("/")
    if inner.startswith("/") or ".." in inner.split("/"):
        return None

    explicit = env.get("TASKFLOW_OBSIDIAN_VAULT_PATH")
    root = vault_path(env, None if explicit else read_obsidian_vaults())
    if root is None:
        return None

    root = root.rstrip("/")
    shown = basename(root) + "/" + inner if inner else basename(root)
    return (root + "/" + inner if inner else root), "Obsidian · " + shown


def in_progress_files(cwd):
    resolved = resolve_plan_dir(cwd)
    if resolved is None:
        return []

    base, label = resolved
    found = []
    for path in glob.glob(os.path.join(base, "*", "PROGRESS.md")):
        try:
            with open(path) as fh:
                if any(IN_PROGRESS_ROW.match(line) for line in fh):
                    found.append("%s/%s/PROGRESS.md" % (label, basename(os.path.dirname(path))))
        except OSError:
            continue
    return found


def main():
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    command = payload.get("tool_input", {}).get("command", "")
    if not re.search(r"git\s+commit\b", command):
        return 0

    cwd = payload.get("cwd") or os.getcwd()
    pending = in_progress_files(cwd)
    if not pending:
        return 0

    context = (
        "A commit just landed and " + ", ".join(pending) + " still has a 🔄 row. "
        "Flip it to ✅ (or ⚠️ / ❌ with a reason) and append a session-log entry "
        "naming the commit hash, what actually changed, and any deviation."
    )
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "additionalContext": context,
                }
            }
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
