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
expect ask  "clipboard read on a new line asks" $'echo a\npbpaste'
expect ask  "sudo pbpaste asks" "sudo pbpaste"
expect ask  "env pbpaste asks" "env pbpaste"
expect ask  "xargs pass show asks" "xargs pass show"
expect ask  "prefix with flags asks" "sudo -n env pbpaste"
expect none "sudo pbcopy runs" "sudo pbcopy"
expect none "xargs pass ls runs" "xargs pass ls"
expect ask  "sudo -u root pbpaste asks" "sudo -u root pbpaste"
expect ask  "env FOO=1 pbpaste asks" "env FOO=1 pbpaste"
expect ask  "bare assignment pbpaste asks" "FOO=1 pbpaste"
expect ask  "nice pbpaste asks" "nice pbpaste"
expect ask  "timeout 5 pbpaste asks" "timeout 5 pbpaste"
expect ask  "doas pbpaste asks" "doas pbpaste"
expect ask  "stdbuf -oL pbpaste asks" "stdbuf -oL pbpaste"
expect none "echo nice runs" "echo nice"
expect none "timeout 5 ls runs" "timeout 5 ls"
expect none "xclip write then echo -o runs" $'xclip -selection clipboard\necho -o'

# A long run of prefix tokens must not blow up the matcher.
slow() {
  if python3 - "$HOOK" "$2" <<'PY'
import json, subprocess, sys, time
hook, cmd = sys.argv[1], sys.argv[2]
payload = json.dumps({"tool_input": {"command": cmd}})
t = time.time()
subprocess.run(["python3", hook], input=payload, text=True, capture_output=True)
sys.exit(0 if time.time() - t < 0.5 else 1)
PY
  then echo "PASS $1"; else echo "FAIL $1: took over 0.5s"; failures=$((failures + 1)); fi
}
slow "20k sudo flags stay fast" "sudo$(printf ' -a%.0s' $(seq 20000)) x"
slow "20k assignments stay fast" "$(printf 'A=1 %.0s' $(seq 20000))x"

exit $failures
