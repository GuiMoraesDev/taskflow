#!/usr/bin/env bash
# Checks the generated directory/ variant against the directory's rules and the root plugin, one check per acceptance criterion.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/directory"
failures=0

# report <AC> <description> <problems>: ok when problems is empty, FAIL with each problem otherwise
report() {
  if [ -z "$3" ]; then
    echo "ok $1 $2"
  else
    printf '%s\n' "$3" | sed "s/^/FAIL $1 /"
    failures=$((failures + 1))
  fi
}

# need_dir: a problem line when directory/ is missing, so every check over it fails for that reason
need_dir() { [ -d "$DIR" ] || echo "directory/ does not exist"; }

# AC-1: allowed file types only, no shebang
ac1="$(need_dir)"
if [ -z "$ac1" ]; then
  ac1="$(cd "$DIR" && find . -type f | sed 's|^\./||' | while IFS= read -r f; do
    base="$(basename "$f")"
    case "$base" in
      (LICENSE|README*|.gitignore) ;;
      (*.md|*.txt|*.json|*.yml|*.yaml|*.png|*.jpg|*.jpeg|*.gif|*.webp|*.ico) ;;
      (*) echo "$f has a disallowed type" ;;
    esac
    [ "$(head -c 2 "$f")" = "#!" ] && echo "$f starts with #!"
  done)"
fi
report AC-1 "every file in directory/ is an allowed type with no shebang" "$ac1"

# AC-2: no hooks, package files, lockfiles, LSP or monitor config, CLAUDE.md or AGENTS.md at any depth
ac2="$(need_dir)"
if [ -z "$ac2" ]; then
  ac2="$(cd "$DIR" && find . \( -type d -name hooks \) -o \( -type f \( -name hooks.json -o -name package.json \
    -o -name package-lock.json -o -name yarn.lock -o -name pnpm-lock.yaml -o -name bun.lockb -o -name bun.lock \
    -o -name npm-shrinkwrap.json -o -name .lsp.json -o -name monitors.json -o -iname claude.md -o -iname agents.md \) \) \
    | sed 's|^\./||; s/$/ is forbidden/')"
fi
report AC-2 "no hooks, package files, lockfiles, .lsp.json, monitors.json, CLAUDE.md or AGENTS.md" "$ac2"

# AC-3: .claude-plugin/ holds only plugin.json and icon.png, with the root's keys and version
ac3="$(need_dir)"
if [ -z "$ac3" ]; then
  if [ ! -d "$DIR/.claude-plugin" ]; then
    ac3="directory/.claude-plugin/ does not exist"
  else
    got="$(ls -A "$DIR/.claude-plugin" | sort | tr '\n' ' ')"
    [ "$got" = "icon.png plugin.json " ] || ac3="directory/.claude-plugin/ holds: $got(wanted: icon.png plugin.json)"
    cmp="$(node -e '
const fs = require("fs");
const read = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { return null; } };
const root = read(process.argv[1]), dir = read(process.argv[2]);
if (!dir) { console.log("directory plugin.json is missing or unparsable"); process.exit(0); }
const rk = Object.keys(root).sort().join(","), dk = Object.keys(dir).sort().join(",");
if (rk !== dk) console.log("plugin.json keys " + dk + " differ from the root keys " + rk);
if (dir.version !== root.version) console.log("version " + dir.version + " differs from the root " + root.version);
' "$ROOT/.claude-plugin/plugin.json" "$DIR/.claude-plugin/plugin.json")"
    ac3="$(printf '%s\n%s' "$ac3" "$cmp" | grep -v '^$')"
  fi
fi
report AC-3 ".claude-plugin/ holds plugin.json and icon.png, keys and version match the root" "$ac3"

# AC-4: every command's allowed-tools entry is Read, Grep, Glob or LS
ac4="$(need_dir)"
if [ -z "$ac4" ]; then
  if ! ls "$DIR"/commands/*.md >/dev/null 2>&1; then
    ac4="directory/commands/ has no commands"
  else
    ac4="$(for f in "$DIR"/commands/*.md; do
      awk '/^allowed-tools:/ { sub(/^allowed-tools:[ \t]*/, ""); print; exit }' "$f" | tr ',' '\n' \
        | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' | grep -v '^$' | while IFS= read -r tool; do
          case "$tool" in (Read|Grep|Glob|LS) ;; (*) echo "$(basename "$f") lists $tool" ;; esac
        done
    done)"
  fi
fi
report AC-4 "every command's allowed-tools are Read, Grep, Glob or LS" "$ac4"

# AC-5: no plugin-root variable, no script names, no hook named as the enforcer
ac5="$(need_dir)"
if [ -z "$ac5" ]; then
  ac5="$( (cd "$DIR" && grep -rIlF '${CLAUDE_PLUGIN_ROOT}' . | sed 's|^\./||; s/$/ names ${CLAUDE_PLUGIN_ROOT}/'
    cd "$DIR" && grep -rIlF 'pr-size.js' . | sed 's|^\./||; s/$/ names pr-size.js/'
    cd "$DIR" && grep -rIlF 'diagram-text.py' . | sed 's|^\./||; s/$/ names diagram-text.py/'
    cd "$DIR" && grep -rIliE '`guard-signature` hook|`version-bump` hook|guard hook|hooks? (deny|denies|refuse|refuses|bump|bumps|stop|stops)' . \
      | sed 's|^\./||; s/$/ names a hook as enforcing/') )"
fi
report AC-5 "no \${CLAUDE_PLUGIN_ROOT}, pr-size.js, diagram-text.py or enforcing hook in directory/" "$ac5"

# AC-6: a fresh build from the sources is byte-identical to the committed directory/
ac6="$(need_dir)"
if [ -z "$ac6" ]; then
  tmp="$(mktemp -d)"
  if ! out="$(node "$ROOT/scripts/build-directory.js" "$tmp/out" 2>&1)"; then
    ac6="the generator failed: $out"
  else
    ac6="$(diff -r "$tmp/out" "$DIR" 2>&1 | head -20)"
  fi
  rm -rf "$tmp"
fi
report AC-6 "a fresh build equals the committed directory/" "$ac6"

# AC-7: a rewrite whose source no longer matches exactly once exits non-zero naming the file and the pattern
ac7=""
if [ ! -f "$ROOT/scripts/build-directory.js" ]; then
  ac7="scripts/build-directory.js does not exist"
else
  src="$(mktemp -d)"
  (cd "$ROOT" && tar cf - --exclude ./node_modules --exclude ./.git --exclude ./directory .) | (cd "$src" && tar xf -)
  grep -vF 'pr-size.js' "$ROOT/skills/task-run/SKILL.md" > "$src/skills/task-run/SKILL.md"
  out="$(node "$ROOT/scripts/build-directory.js" "$src/out" "$src" 2>&1)"
  code=$?
  if [ "$code" -eq 0 ]; then
    ac7="the generator exited 0 against a stale task-run source"
  elif ! printf '%s' "$out" | grep -qF 'skills/task-run/SKILL.md'; then
    ac7="the generator exited $code without naming skills/task-run/SKILL.md: $out"
  elif ! printf '%s' "$out" | grep -qiE 'pattern|match'; then
    ac7="the generator exited $code without naming the pattern: $out"
  fi
  rm -rf "$src"
fi
report AC-7 "a stale rewrite exits non-zero naming the file and the pattern" "$ac7"

# AC-8: task-run's size step measures with git diff --cached --numstat and pathspec excludes, same budgets, no script
ac8="$(need_dir)"
if [ -z "$ac8" ]; then
  f="$DIR/skills/task-run/SKILL.md"
  if [ ! -f "$f" ]; then
    ac8="directory/skills/task-run/SKILL.md does not exist"
  else
    step="$(awk '/^## Step 7/ { on = 1; print; next } on && /^## / { exit } on { print }' "$f")"
    ac8="$( [ -z "$step" ] && echo "no Step 7 section"
      for want in 'git diff --cached --numstat' codeExcludes excludeFromCount maxLines maxTotalLines 400 600; do
        printf '%s' "$step" | grep -qF -- "$want" || echo "size step lacks $want"
      done
      printf '%s' "$step" | grep -qE ':\(exclude\)|:!' || echo "size step uses no pathspec exclude"
      printf '%s' "$step" | grep -qE '\bnode |\.js\b|\.py\b|python' && echo "size step runs a script" )"
  fi
fi
report AC-8 "task-run's size step uses git diff --cached --numstat with pathspec excludes and the same budgets" "$ac8"

# AC-9: the root plugin's hooks, size script, review-feedback and marketplace are unchanged, and its suites pass
base="$(git -C "$ROOT" merge-base HEAD main 2>/dev/null)"
ac9="$( if [ -z "$base" ]; then echo "no merge base with main"
  elif ! git -C "$ROOT" diff --quiet "$base" -- hooks scripts/pr-size.js commands/review-feedback.md .claude-plugin/marketplace.json; then
    echo "changed since main: $(git -C "$ROOT" diff --name-only "$base" -- hooks scripts/pr-size.js commands/review-feedback.md .claude-plugin/marketplace.json | tr '\n' ' ')"
  fi
  for t in scripts/plugin-manifest.test.sh scripts/pr-size.test.sh hooks/guard-signature.test.sh hooks/guard-bash.test.sh; do
    bash "$ROOT/$t" >/dev/null 2>&1 || echo "$t fails"
  done )"
report AC-9 "root hooks, pr-size.js, review-feedback and marketplace unchanged; manifest, size and guard suites pass" "$ac9"

exit "$failures"
