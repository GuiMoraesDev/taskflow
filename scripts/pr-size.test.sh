#!/usr/bin/env bash
# Runs scripts/pr-size.js against throwaway git repos, one per acceptance criterion.

SCRIPT="$(cd "$(dirname "$0")" && pwd)/pr-size.js"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

DEFAULTS='{"pullRequests":{"excludeFromCount":["package-lock.json"],"codeExcludes":["**/*.test.*","README.md","docs/**","examples/**"]}}'
NEW_SHAPE='{"pullRequests":{"maxLines":400,"maxTotalLines":600,"excludeFromCount":["package-lock.json"],"codeExcludes":["**/*.test.*","README.md","docs/**","examples/**"]}}'
OLD_SHAPE='{"pullRequests":{"maxLines":400,"excludeFromCount":["package-lock.json"]}}'

failures=0

# repo <config>: fresh repo whose base commit holds the config, cwd left inside it
repo() {
  local dir="$WORK/$RANDOM$RANDOM"
  mkdir -p "$dir/.claude" && cd "$dir" || exit 1
  git init -q
  echo "$1" > .claude/workflow.json
  git add . && git -c user.name=t -c user.email=t@t commit -qm base
}

# lines <count> <path>: write a file of exactly <count> lines and stage it
lines() {
  mkdir -p "$(dirname "$2")"
  seq "$1" > "$2"
  git add "$2"
}

# check <id> <expected exit: fail or an exact code> <substring>... (a leading ! means must be absent)
check() {
  local id="$1" want="$2"; shift 2
  local out code ok=1
  out="$(node "$SCRIPT" HEAD 2>&1)"; code=$?
  if [ "$want" != fail ] && [ "$code" -ne "$want" ]; then ok=0; fi
  if [ "$want" = fail ] && [ "$code" -eq 0 ]; then ok=0; fi
  for needle in "$@"; do
    case "$needle" in
      !*) case "$out" in *"${needle#!}"*) ok=0 ;; esac ;;
      *) case "$out" in *"$needle"*) ;; *) ok=0 ;; esac ;;
    esac
  done
  if [ "$ok" = 1 ]; then
    echo "PASS $id"
  else
    echo "FAIL $id (exit $code, wanted $want, needles: $*)"
    echo "$out" | sed 's/^/    /'
    failures=$((failures + 1))
  fi
}

repo "$NEW_SHAPE"; lines 350 skills/a.md; lines 300 docs/b.md
check AC-1 fail "350/400 code · 650/600 total" "total budget"

repo "$DEFAULTS"; lines 350 skills/a.md; lines 300 docs/b.md
check AC-1-defaults fail "350/400 code · 650/600 total" "total budget"

repo "$NEW_SHAPE"; lines 410 skills/a.md; lines 40 scripts/a.test.js
check AC-2 fail "410/400 code" "code budget"

repo "$NEW_SHAPE"; lines 390 skills/a.md; lines 200 README.md
check AC-3 0 "390/400 code · 590/600 total"

repo "$NEW_SHAPE"; lines 390 skills/a.md; lines 5000 package-lock.json
check AC-4 0 "390/400 code · 390/600 total"

repo "$OLD_SHAPE"; lines 380 skills/a.md; lines 900 scripts/foo.test.js
check AC-5-pass 0 "380/400 code" "!total"

repo "$OLD_SHAPE"; lines 410 skills/a.md
check AC-5-fail fail "410/400 code" "code budget"

repo '{ "pullRequests": '; lines 10 skills/a.md
check bad-config 2 "cannot parse .claude/workflow.json"

repo '{"pullRequests":{"maxLines":400,"maxTotalLines":600}}'; lines 380 skills/a.md; lines 300 scripts/foo.test.js
check total-only fail "380/400 code · 680/600 total" "total budget"

[ "$failures" -eq 0 ] || { echo "$failures case(s) failed"; exit 1; }
