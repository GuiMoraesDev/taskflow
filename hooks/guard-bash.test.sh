#!/usr/bin/env bash
# Feeds guard-bash.py one command at a time and checks the decision it returns.

HOOK="$(cd "$(dirname "$0")" && pwd)/guard-bash.py"
failures=0

# expect <decision|none> <label> <command> [description]
expect() {
  local payload out got
  payload=$(python3 -c 'import json,sys; print(json.dumps({"tool_input":{"command":sys.argv[1],"description":sys.argv[2]}}))' "$3" "${4:-}")
  out=$(printf '%s' "$payload" | python3 "$HOOK")
  got=$(printf '%s' "$out" | python3 -c 'import json,sys; t=sys.stdin.read(); print(json.loads(t)["hookSpecificOutput"]["permissionDecision"] if t else "none")')
  if [ "$got" = "$1" ]; then echo "PASS $2"; else echo "FAIL $2: expected $1, got $got"; failures=$((failures + 1)); fi
}

expect none "git add -A runs" "git add -A"
expect none "git add . runs" "git add ."
expect none "npx eslint runs" "npx eslint src"
expect none "git branch -d runs" "git branch -d old"
expect none "git branch -m runs" "git branch -m old new"
expect ask  "git branch -D asks" "git branch -D old"
expect ask  "commit --no-verify asks" "git commit --no-verify -m x"
expect deny "force without a reason is denied" "git push -f"
expect ask  "force with a reason asks" "git push -f" "remote holds a broken rebase only I pushed"
expect none "force-with-lease runs" "git push --force-with-lease"

exit $failures
