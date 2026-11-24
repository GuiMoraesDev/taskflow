#!/usr/bin/env bash
# Feeds redact-prompt.py one prompt at a time and checks the block, the pass and the context.

HOOK="$(cd "$(dirname "$0")" && pwd)/redact-prompt.py"
failures=0

CPF="529.982.247-25"
DB="postgres://admin:hunter2@db.example.com:5432/app"
FLAG="#allow-sensitive"
NL=$'\n'

# run <prompt>: prints the hook's stdout, leaves its exit code in $rc
run() {
  local payload
  payload=$(python3 -c 'import json,sys; print(json.dumps({"prompt":sys.argv[1]}))' "$1")
  out=$(printf '%s' "$payload" | python3 "$HOOK")
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

BLOCKED='assert d and d["decision"] == "block", "not blocked: %r" % out'

run "my cpf is $CPF ok"
check "AC-1 prompt with a value is blocked" "$BLOCKED"

run "cpf $CPF and db $DB"
check "AC-2 reason lists counts, suggestion, no echo" "$BLOCKED"'
r = d["reason"]
assert "1 × [cpf]" in r and "1 × [db_url]" in r, r
assert "cpf [cpf_1] and db [db_url_1]" in r, r
assert d["hookSpecificOutput"]["suppressOriginalPrompt"] is True
assert d["hookSpecificOutput"]["hookEventName"] == "UserPromptSubmit"
assert "suppressOriginalPrompt" not in d
for raw in ("529.982.247", "hunter2", "db.example.com"):
    assert raw not in out, raw'

run "my cpf is $CPF"
check "AC-19 reason starts with the guard name" "$BLOCKED"'
assert d["reason"].startswith("taskflow sensitive data guard"), d["reason"]'

run "refactor the parser please"
check "AC-4 clean prompt is empty" 'assert out == "", out'

run "${FLAG} my cpf is $CPF"
check "AC-5 typed leading flag passes" 'assert out == "", out'

run "see:${NL}<pasted_content id=\"1\">${NL}${FLAG} cpf $CPF${NL}</pasted_content id=\"1\">"
check "AC-5 flag only inside a pasted block blocks" "$BLOCKED"'
assert "#allow-sensitive" not in d["reason"].split("────────")[1], d["reason"]
assert "[cpf_1]" in d["reason"]'

run "<pasted_content id=\"2\">${NL}${FLAG} cpf $CPF${NL}</pasted_content id=\"2\">"
check "AC-5 prompt starting with a pasted flag blocks" "$BLOCKED"

run "my cpf is $CPF ${FLAG}"
check "AC-5 mid-prompt flag blocks and is stripped" "$BLOCKED"'
assert "#allow-sensitive" not in d["reason"].split("────────")[1], d["reason"]'

run "use [cpf_1] and [db_url_1] to continue"
check "AC-6 placeholders pass with context" 'assert d and "decision" not in d, out
c = d["hookSpecificOutput"]["additionalContext"]
assert d["hookSpecificOutput"]["hookEventName"] == "UserPromptSubmit"
for w in ("taskflow sensitive data guard", "Never ask", "step-by-step", "UI or CLI", "CLI"):
    assert w in c, (w, c)'

out=$(printf '%s' 'not json {' | python3 "$HOOK"); rc=$?
check "AC-9 malformed stdin blocks" "$BLOCKED"

out=$(python3 -c '
import json
h = json.load(open("'"$(dirname "$HOOK")"'/hooks.json"))["hooks"]["UserPromptSubmit"][0]["hooks"][0]
print(json.dumps(h))'); rc=$?
check "AC-9 hooks.json registers the hook, failing closed" '
assert d["onFailure"] == "block" and d["type"] == "command", d
assert d["command"] == "python3 \"${CLAUDE_PLUGIN_ROOT}/hooks/redact-prompt.py\"", d'

exit $failures
