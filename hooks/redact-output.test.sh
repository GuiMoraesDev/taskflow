#!/usr/bin/env bash
# Feeds redact-output.py one PostToolUse payload at a time and checks the replaced output.

HERE="$(cd "$(dirname "$0")" && pwd)"
HOOK="$HERE/redact-output.py"
failures=0
# Built from pieces so the file itself holds no scannable token.
RAW="sk""_live_""abcdefghijklmnopqrstuv1234"
SECRET="API_KEY=$RAW"

# run <python expr building the payload dict>: prints the hook's stdout into $out
run() {
  out=$(python3 -c "
import json
payload = $1
print(json.dumps(payload))" | CLAUDE_PROJECT_DIR="${PROJ:-}" python3 "$HOOK")
  rc=$?
}

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

READ='{"tool_name":"Read","tool_input":{"file_path":"/x/.env"},"cwd":"/nonexistent","tool_response":{"type":"text","file":{"filePath":"/x/.env","content":"'"$SECRET"'\nPORT=80\n","numLines":2,"startLine":1,"totalLines":2}}}'

run "$READ"
check "AC-10 Read content redacted, other fields unchanged" '
h = d["hookSpecificOutput"]
assert h["hookEventName"] == "PostToolUse"
u = h["updatedToolOutput"]
assert "'"$RAW"'" not in out
assert "[env_secret_1]" in u["file"]["content"] or "[api_token_1]" in u["file"]["content"], u
assert u["type"] == "text"
f = u["file"]
assert (f["filePath"], f["numLines"], f["startLine"], f["totalLines"]) == ("/x/.env", 2, 1, 2), f
assert set(f) == {"filePath","content","numLines","startLine","totalLines"}
assert "PORT=80" in f["content"]'

run '{"tool_name":"Bash","tool_input":{},"cwd":"/n","tool_response":{"stdout":"'"$SECRET"'","stderr":"err '"$SECRET"'","interrupted":False,"isImage":False,"noOutputExpected":False}}'
check "AC-11 Bash stdout and stderr redacted" '
u = d["hookSpecificOutput"]["updatedToolOutput"]
assert "'"$RAW"'" not in out
assert "[api_token_1]" in u["stdout"] or "[env_secret_1]" in u["stdout"], u
assert "[" in u["stderr"] and u["interrupted"] is False and u["isImage"] is False and u["noOutputExpected"] is False, u'

run '{"tool_name":"mcp__x__get","tool_input":{},"cwd":"/n","tool_response":[{"type":"text","text":"'"$SECRET"'"},{"type":"image","n":3}]}'
check "AC-12 MCP list of blocks redacted, structure kept" '
u = d["hookSpecificOutput"]["updatedToolOutput"]
assert "'"$RAW"'" not in out
assert isinstance(u, list) and u[0]["type"] == "text" and u[1] == {"type":"image","n":3}, u'

run '{"tool_name":"mcp__x__get","tool_input":{},"cwd":"/n","tool_response":"token '"$RAW"'"}'
check "AC-12 MCP string redacted" '
assert "'"$RAW"'" not in out and "[api_token_1]" in d["hookSpecificOutput"]["updatedToolOutput"]'

run '{"tool_name":"mcp__x__get","tool_input":{},"cwd":"/n","tool_response":{"a":{"b":["'"$SECRET"'",1]}}}'
check "AC-12 MCP dict nested redacted" '
u = d["hookSpecificOutput"]["updatedToolOutput"]
assert "'"$RAW"'" not in out and u["a"]["b"][1] == 1, u'

run '{"tool_name":"Bash","tool_input":{},"cwd":"/n","tool_response":{"stdout":"hello","stderr":"","interrupted":False}}'
check "AC-13 clean output prints nothing" 'assert out == "", out'

run '{"tool_name":"Read","tool_input":{"file_path":"/x/.env.example"},"cwd":"/n","tool_response":{"type":"text","file":{"filePath":"/x/.env.example","content":"'"$SECRET"'","numLines":1,"startLine":1,"totalLines":1}}}'
check "AC-14 default allowPaths .env.example untouched" 'assert out == "", out'

run '{"tool_name":"Read","tool_input":{"file_path":"/x/a.sample"},"cwd":"/n","tool_response":{"type":"text","file":{"filePath":"/x/a.sample","content":"'"$SECRET"'","numLines":1,"startLine":1,"totalLines":1}}}'
check "AC-14 default allowPaths *.sample untouched" 'assert out == "", out'

PROJ=$(mktemp -d); mkdir -p "$PROJ/.claude"
echo '{"sensitiveData":{"allowPaths":["/x/ok/*"]}}' > "$PROJ/.claude/workflow.json"
run '{"tool_name":"Read","tool_input":{"file_path":"/x/ok/a.txt"},"cwd":"/n","tool_response":{"type":"text","file":{"filePath":"/x/ok/a.txt","content":"'"$SECRET"'","numLines":1,"startLine":1,"totalLines":1}}}'
check "AC-14 configured allowPaths match skips" 'assert out == "", out'
run '{"tool_name":"Read","tool_input":{"file_path":"/x/.env.example"},"cwd":"/n","tool_response":{"type":"text","file":{"filePath":"/x/.env.example","content":"'"$SECRET"'","numLines":1,"startLine":1,"totalLines":1}}}'
check "AC-14 configured list replaces the default" 'assert "'"$RAW"'" not in out and d, out'

echo '{"sensitiveData":{"enabled":false}}' > "$PROJ/.claude/workflow.json"
run "$READ"
check "AC-21 disabled prints nothing" 'assert out == "", out'
rm -rf "$PROJ"; PROJ=

run "$READ"
check "AC-15 additionalContext carries the guidance" '
c = d["hookSpecificOutput"]["additionalContext"]
sys.path.insert(0, "'"$HERE"'")
from sensitive_data import GUIDANCE
assert c == GUIDANCE or GUIDANCE in c, c
assert "Never ask the user" in c'

run '{"tool_name":"Read","tool_input":{"file_path":"/x/.env"},"cwd":"/n","tool_response":{"weird":"'"$SECRET"'"}}'
check "AC-21 unknown Read shape gets notice" '
u = d["hookSpecificOutput"]["updatedToolOutput"]
assert u == {"type": "text", "file": {"filePath": "/x/.env", "content": "[redacted: unparseable output]", "numLines": 1, "startLine": 1, "totalLines": 1}}, u
assert type(u["file"]["numLines"]) is int and type(u["file"]["startLine"]) is int and type(u["file"]["totalLines"]) is int
assert "'"$RAW"'" not in out'

run '{"tool_name":"Bash","tool_input":{},"cwd":"/n","tool_response":"'"$SECRET"'"}'
check "AC-21 unknown Bash shape gets notice" '
u = d["hookSpecificOutput"]["updatedToolOutput"]
assert u == {"stdout": "[redacted: unparseable output]", "stderr": "", "interrupted": False, "isImage": False, "noOutputExpected": False}, u
assert "'"$RAW"'" not in out'

run '{"tool_name":"Bash","tool_input":{},"cwd":"/n","tool_response":"hello"}'
check "AC-21 unknown shape without a hit prints nothing" 'assert out == "", out'

T=$(mktemp -d)
cp "$HOOK" "$T/redact-output.py"
printf 'GUIDANCE = "g"\ndef load_config(p):\n    return {"enabled": True, "allowPaths": []}\ndef redact(t, c=None):\n    raise RuntimeError("boom")\n' > "$T/sensitive_data.py"
for shape in Read Bash mcp; do
  case $shape in
    Read) P='{"tool_name":"Read","tool_input":{"file_path":"/x"},"tool_response":{"type":"text","file":{"filePath":"/x","content":"'"$SECRET"'"}}}'; X='assert d["hookSpecificOutput"]["updatedToolOutput"] == {"type": "text", "file": {"filePath": "/x", "content": "[redacted: unparseable output]", "numLines": 1, "startLine": 1, "totalLines": 1}}' ;;
    Bash) P='{"tool_name":"Bash","tool_input":{},"tool_response":{"stdout":"'"$SECRET"'","stderr":"e"}}'; X='assert d["hookSpecificOutput"]["updatedToolOutput"] == {"stdout": "[redacted: unparseable output]", "stderr": "", "interrupted": False, "isImage": False, "noOutputExpected": False}' ;;
    mcp) P='{"tool_name":"mcp__a__b","tool_input":{},"tool_response":[{"type":"text","text":"'"$SECRET"'"}]}'; X='assert d["hookSpecificOutput"]["updatedToolOutput"] == [{"type":"text","text":"[redacted: unparseable output]"}]' ;;
  esac
  out=$(printf '%s' "$P" | python3 "$T/redact-output.py"); rc=$?
  check "AC-21 internal error fails closed ($shape)" "$X"'
assert "'"$RAW"'" not in out'
done
rm -rf "$T"

check_hooks() {
  python3 - "$HERE/hooks.json" <<'PY'
import json, sys
h = json.load(open(sys.argv[1]))["hooks"]["PostToolUse"]
hit = [e for e in h if e.get("matcher") == "Read|Bash|mcp__.*"]
assert len(hit) == 1, h
c = hit[0]["hooks"]
assert len(c) == 1 and c[0]["command"] == 'python3 "${CLAUDE_PLUGIN_ROOT}/hooks/redact-output.py"' and c[0]["onFailure"] == "block", c
assert any(e.get("matcher") == "Bash" and "progress-reminder" in json.dumps(e) for e in h)
PY
}
msg=$(check_hooks 2>&1) && echo "PASS hooks.json registers redact-output" || { echo "FAIL hooks.json registers redact-output: $(echo "$msg" | tail -1)"; failures=$((failures + 1)); }

[ "$failures" -eq 0 ] || { echo "$failures failed"; exit 1; }
