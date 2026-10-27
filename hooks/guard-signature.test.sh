#!/usr/bin/env bash
# Feeds hooks/guard-signature.py PreToolUse payloads from a throwaway repo whose
# .claude/workflow.json sets aiSignature false, one case per acceptance criterion.

GUARD="$(cd "$(dirname "$0")" && pwd)/guard-signature.py"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

mkdir -p "$WORK/.claude" && cd "$WORK" || exit 1
echo '{"aiSignature":false}' > .claude/workflow.json
printf 'Short body.\n\nCo-Authored-By: Claude <noreply@anthropic.com>\n' > body.md

failures=0

# check <id> <deny|allow> <command>: the guard denies by printing permissionDecision "deny"
check() {
  local id="$1" want="$2" command="$3" payload out got
  payload="$(python3 -c 'import json,sys; print(json.dumps({"tool_name":"Bash","tool_input":{"command":sys.argv[1]},"cwd":sys.argv[2]}))' "$command" "$WORK")"
  out="$(printf '%s' "$payload" | python3 "$GUARD" 2>&1)"
  case "$out" in *'"permissionDecision": "deny"'*) got=deny ;; *) got=allow ;; esac
  if [ "$got" = "$want" ]; then
    echo "PASS $id"
  else
    echo "FAIL $id: wanted $want, got $got"
    failures=$((failures + 1))
  fi
}

check "AC-12 gh api comment with a Co-Authored-By trailer" deny \
  'gh api repos/o/r/pulls/1/comments -f body="Look here. Co-Authored-By: Claude <noreply@anthropic.com>"'
check "regression gh pr edit --body with a Generated line" deny \
  'gh pr edit 1 --body "Short body. 🤖 Generated with [Claude Code](https://claude.com/claude-code)"'
check "regression gh pr edit --body-file with a Co-Authored-By trailer" deny \
  'gh pr edit 1 --body-file body.md'
check "AC-12 gh api -F body=@file with a Co-Authored-By trailer" deny \
  'gh api repos/o/r/pulls/1/comments -F body=@body.md'
check "AC-12 gh api --input file with a Co-Authored-By trailer" deny \
  'gh api repos/o/r/pulls/1/comments --input body.md'
check "AC-12 clean gh api comment" allow \
  'gh api repos/o/r/pulls/1/comments -f body="Look here: the threshold is the business rule."'
check "regression gh pr create with a Generated line" deny \
  'gh pr create --title "feat: x" --body "Body. Generated with Claude Code"'
check "regression clean git commit" allow \
  'git commit -m "feat: x"'

[ "$failures" -eq 0 ] || { echo "$failures failed"; exit 1; }
