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

# AC-3: plugin.json's icon names a square PNG inside the plugin, 512-2048 px per side, under 2 MB
icon="$(node -e 'const i = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).icon; if (typeof i === "string") process.stdout.write(i)' "$ROOT/.claude-plugin/plugin.json" 2>/dev/null)"
ac3="$(node -e '
const fs = require("fs"), path = require("path");
const root = process.argv[1], icon = process.argv[2];
if (!icon) { console.log("plugin.json has no icon"); process.exit(0); }
const file = path.resolve(root, icon);
if (path.relative(root, file).startsWith("..") || path.isAbsolute(path.relative(root, file))) { console.log("icon " + icon + " is outside the plugin"); process.exit(0); }
if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { console.log("icon " + icon + " does not exist"); process.exit(0); }
const buf = fs.readFileSync(file);
const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (buf.length < 24 || !buf.subarray(0, 8).equals(sig)) { console.log("icon " + icon + " is not a PNG"); process.exit(0); }
const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
if (w !== h) { console.log("icon is " + w + "x" + h + ", not square"); process.exit(0); }
if (w < 512 || w > 2048) { console.log("icon is " + w + " px per side, outside 512-2048"); process.exit(0); }
if (buf.length >= 2097152) { console.log("icon is " + buf.length + " bytes, not under 2097152"); process.exit(0); }
' "$ROOT" "$icon")"
if [ -z "$ac3" ]; then
  echo "ok AC-3 icon is a square PNG, 512-2048 px per side, under 2 MB"
else
  echo "FAIL AC-3 $ac3"
  failures=$((failures + 1))
fi

[ "$failures" -eq 0 ]
