#!/usr/bin/env bash
# Feeds file-mentions-warning.py one SessionStart payload at a time and checks the warning and the silence.

HOOK="$(cd "$(dirname "$0")" && pwd)/file-mentions-warning.py"
failures=0

# run <source> [VAR=value ...]: prints the hook's stdout, leaves its exit code in $rc
run() {
  local payload src="$1"
  shift
  payload=$(python3 -c 'import json,sys; print(json.dumps({"source":sys.argv[1]}))' "$src")
  out=$(printf '%s' "$payload" | env -u CLAUDE_CODE_DISABLE_FILE_MENTIONS "$@" python3 "$HOOK")
  rc=$?
}

# check <label> <python body over `out`, a string, and `d`, the parsed JSON or None>
check() {
  local msg
  msg=$(printf '%s' "$out" | python3 -c '
import json, sys
out = sys.stdin.read()
d = json.loads(out) if out.strip() else None
'"$2"'
' 2>&1)
  if [ $? -eq 0 ] && [ "$rc" -eq 0 ]; then echo "PASS $1"; else echo "FAIL $1: rc=$rc $(printf '%s' "$msg" | tail -1)"; failures=$((failures + 1)); fi
}

run startup
check "AC-17 startup without the variable warns" '
assert d and set(d) == {"systemMessage"}, out
assert d["systemMessage"].startswith("taskflow sensitive data guard"), d
assert "CLAUDE_CODE_DISABLE_FILE_MENTIONS" in d["systemMessage"], d'

run startup CLAUDE_CODE_DISABLE_FILE_MENTIONS=1
check "AC-17 variable set to 1 prints nothing" 'assert out == "", out'

for source in resume clear compact; do
  run "$source"
  check "AC-22 source $source prints nothing" 'assert out == "", out'
done

tmp=$(mktemp -d); mkdir -p "$tmp/.claude"
printf '%s' '{"sensitiveData":{"enabled":false}}' > "$tmp/.claude/workflow.json"
run startup CLAUDE_PROJECT_DIR="$tmp"
rm -rf "$tmp"
check "AC-17 guard disabled by config prints nothing" 'assert out == "", out'

out=$(printf '%s' 'not json {' | python3 "$HOOK"); rc=$?
check "AC-17 malformed stdin prints nothing and exits 0" 'assert out == "", out'

out=$(python3 -c '
import json
h = json.load(open("'"$(dirname "$HOOK")"'/hooks.json"))["hooks"]["SessionStart"][0]["hooks"][0]
print(json.dumps(h))'); rc=$?
check "AC-17 hooks.json registers the hook under SessionStart" '
assert d["type"] == "command", d
assert d["command"] == "python3 \"${CLAUDE_PLUGIN_ROOT}/hooks/file-mentions-warning.py\"", d'

exit $failures
