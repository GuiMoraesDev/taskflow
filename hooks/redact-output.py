#!/usr/bin/env python3
"""Redact secrets and PII from what Read, Bash and MCP tools return to Claude.

A PostToolUse hook. When the output holds a sensitive value, it answers with
updatedToolOutput - the same shape as the tool's own output, with each value
swapped for a placeholder - plus guidance for Claude not to ask for the values.
Clean output prints nothing. A Read of a path in sensitiveData.allowPaths is
left alone.

The hook fails closed: when it cannot parse an output's shape but finds a hit,
or hits an internal error, the readable fields are replaced by a notice. A
crashing PostToolUse hook does not hide the output, so errors are caught here.
"""

import fnmatch
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sensitive_data import GUIDANCE, load_config, redact  # noqa: E402

NOTICE = "[redacted: unparseable output]"


def emit(output, context=None):
    hook = {"hookEventName": "PostToolUse", "updatedToolOutput": output}
    if context:
        hook["additionalContext"] = context
    json.dump({"hookSpecificOutput": hook}, sys.stdout, ensure_ascii=False)


def allowed(path, project_dir, config):
    if not isinstance(path, str) or not path:
        return False
    full = os.path.normpath(os.path.join(project_dir or os.getcwd(), path))
    for pattern in config["allowPaths"]:
        if fnmatch.fnmatchcase(full, pattern):
            return True
        if pattern.startswith("**/") and fnmatch.fnmatchcase(
            os.path.basename(full), pattern[3:]
        ):
            return True
    return False


class Redactor:
    def __init__(self, config):
        self.config = config
        self.hits = 0

    def text(self, value):
        out, counts = redact(value, self.config)
        self.hits += sum(counts.values())
        return out

    def walk(self, value):
        if isinstance(value, str):
            return self.text(value)
        if isinstance(value, list):
            return [self.walk(v) for v in value]
        if isinstance(value, dict):
            return {self.walk(k): self.walk(v) for k, v in value.items()}
        return value


def is_text_dict(d, keys):
    return isinstance(d, dict) and all(isinstance(d.get(k), str) for k in keys)


def process(tool, response, config, args=None):
    """The replacement output, or None when nothing was redacted."""
    r = Redactor(config)
    if tool == "Read":
        file = response.get("file") if isinstance(response, dict) else None
        if is_text_dict(file, ("content",)):
            out = dict(response)
            out["file"] = dict(file, content=r.text(file["content"]))
        else:
            r.walk(response)
            out = fallback("Read", response, args)
    elif tool == "Bash":
        if is_text_dict(response, ("stdout", "stderr")):
            out = dict(
                response, stdout=r.text(response["stdout"]), stderr=r.text(response["stderr"])
            )
        else:
            r.walk(response)
            out = fallback("Bash", response, args)
    else:
        out = r.walk(response)
    return out if r.hits else None


def fallback(tool, response, args=None):
    if tool == "Read":
        path = args.get("file_path") if isinstance(args, dict) else None
        return {
            "type": "text",
            "file": {
                "filePath": path if isinstance(path, str) else "",
                "content": NOTICE,
                "numLines": 1,
                "startLine": 1,
                "totalLines": 1,
            },
        }
    if tool == "Bash":
        return {
            "stdout": NOTICE,
            "stderr": "",
            "interrupted": False,
            "isImage": False,
            "noOutputExpected": False,
        }
    if isinstance(response, str):
        return NOTICE
    return [{"type": "text", "text": NOTICE}]


def main():
    tool = None
    try:
        payload = json.load(sys.stdin)
        tool = payload.get("tool_name")
        response = payload.get("tool_response")
    except Exception:
        if isinstance(tool, str) and (tool in ("Read", "Bash") or tool.startswith("mcp__")):
            emit(fallback(tool, None, None), GUIDANCE)
        return
    if not isinstance(tool, str) or not (
        tool in ("Read", "Bash") or tool.startswith("mcp__")
    ):
        return
    try:
        cwd = payload.get("cwd")
        project_dir = os.environ.get("CLAUDE_PROJECT_DIR") or (
            cwd if isinstance(cwd, str) else ""
        )
        config = load_config(project_dir)
        if not config["enabled"]:
            return
        args = payload.get("tool_input")
        if tool == "Read":
            path = args.get("file_path") if isinstance(args, dict) else None
            if allowed(path, project_dir, config):
                return
        out = process(tool, response, config, args)
        if out is not None:
            emit(out, GUIDANCE)
    except Exception:
        emit(fallback(tool, response, payload.get("tool_input")), GUIDANCE)


if __name__ == "__main__":
    main()
