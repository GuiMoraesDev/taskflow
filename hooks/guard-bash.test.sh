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
expect ask  "pbpaste asks" "pbpaste"
expect ask  "pbpaste piped asks" "pbpaste | head"
expect ask  "xclip -o asks" "xclip -o"
expect ask  "xclip clipboard -o asks" "xclip -selection clipboard -o"
expect ask  "xsel -o asks" "xsel -o"
expect ask  "xsel --output asks" "xsel --output"
expect ask  "wl-paste asks" "wl-paste"
expect ask  "security find-generic-password asks" "security find-generic-password -s x -w"
expect ask  "security find-internet-password asks" "security find-internet-password -s x"
expect ask  "security dump-keychain asks" "security dump-keychain"
expect ask  "pass show asks" "pass show foo"
expect ask  "pass entry asks" "pass foo/bar"
expect ask  "op read asks" "op read op://v/i/f"
expect ask  "op item get asks" "op item get x"
expect ask  "bw get asks" "bw get password x"
expect ask  "gpg -d asks" "gpg -d file.gpg"
expect ask  "gpg --decrypt asks" "gpg --decrypt file.gpg"
expect ask  "osascript clipboard asks" "osascript -e 'the clipboard'"
expect ask  "chained clipboard read asks" "cd x && pbpaste"
expect none "pbcopy runs" "pbcopy < f"
expect none "xclip write runs" "echo x | xclip -selection clipboard"
expect none "pass ls runs" "pass ls"
expect none "bare pass runs" "pass"
expect none "op signin runs" "op signin"
expect none "bw login runs" "bw login"
expect none "gpg --list-keys runs" "gpg --list-keys"
expect none "security list-keychains runs" "security list-keychains"
expect none "grep password runs" "grep password file"

exit $failures
