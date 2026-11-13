#!/usr/bin/env bash
# Checks the plugin's command manifests against the directory's rules, one check per acceptance criterion.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
failures=0

# tools_of <file>: the allowed-tools entries of a command, one per line, split on top-level commas
tools_of() {
  awk '/^allowed-tools:/ { sub(/^allowed-tools:[ \t]*/, ""); print; exit }' "$1" \
    | awk '{ depth = 0; cur = ""
             for (i = 1; i <= length($0); i++) { c = substr($0, i, 1)
               if (c == "(") depth++
               if (c == ")") depth--
               if (c == "," && depth == 0) { print cur; cur = "" } else cur = cur c }
             print cur }' \
    | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' | grep -v '^$'
}

# AC-1: no command lists a bare Bash, Edit or Write
bare=0
for f in "$ROOT"/commands/*.md; do
  for tool in $(tools_of "$f"); do
    case "$tool" in
      Bash|Edit|Write) echo "FAIL AC-1 $(basename "$f") lists bare $tool"; bare=1 ;;
    esac
  done
done
if [ "$bare" = 0 ]; then echo "ok AC-1 no bare Bash, Edit or Write in commands/"; else failures=$((failures + 1)); fi

# AC-2: review-feedback's only shell entries are gh repo view and gh api
got="$(tools_of "$ROOT/commands/review-feedback.md" | grep '^Bash' | sort)"
want="$(printf '%s\n' 'Bash(gh api:*)' 'Bash(gh repo view:*)')"
if [ "$got" = "$want" ]; then
  echo "ok AC-2 review-feedback shell entries are exactly gh repo view and gh api"
else
  echo "FAIL AC-2 review-feedback shell entries were: ${got:-none} (wanted: Bash(gh api:*), Bash(gh repo view:*))"
  failures=$((failures + 1))
fi

[ "$failures" -eq 0 ]
