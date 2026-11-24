// Builds the directory/ variant of the plugin: the root's markdown procedures with no hooks or scripts, rewritten to stand without them.
// Usage: node scripts/build-directory.js [outDir=directory] [srcRoot=repo root]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const srcRoot = path.resolve(process.argv[3] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), ".."));
const outDir = path.resolve(process.argv[2] ?? path.join(srcRoot, "directory"));

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const TASK_RUN_SIZE_FIND = `\`\`\`bash
node "\${CLAUDE_PLUGIN_ROOT}/scripts/pr-size.js" <base>
\`\`\`

\`<base>\` is the merge base with the branch the pull request targets. Code is
held to \`pullRequests.maxLines\` (400 when unset); the total, which adds the
\`codeExcludes\` paths - tests by default, plus any docs listed - is held to
\`maxTotalLines\` (600 when unset) once either key is set. \`excludeFromCount\`
counts toward neither. Exit 2 is a usage error or an unparsable config: fix it
and measure again.

Exit 1 is over a budget: **stop before committing.**`;

const TASK_RUN_SIZE_REPLACE = `\`<base>\` is the merge base with the branch the pull request targets. Read
\`pullRequests\` from \`.claude/workflow.json\` and count two numbers:

\`\`\`bash
# code
git diff --cached --numstat <base> -- . ':(glob,exclude)<each excludeFromCount>' ':(glob,exclude)<each codeExcludes>'
# total
git diff --cached --numstat <base> -- . ':(glob,exclude)<each excludeFromCount>'
\`\`\`

Give one \`':(glob,exclude)<pattern>'\` per entry - the glob form of
the \`:(exclude)\` pathspec, so \`**\` spans directories. Sum the added and deleted
columns of every row; a \`-\` row is a binary file and counts 0. \`codeExcludes\`
defaults to \`**/*.test.*\` and \`**/*.spec.*\`, so tests count toward the total
only. Code is held to \`pullRequests.maxLines\` (400 when unset); the total is
held to \`maxTotalLines\` (600 when unset) once either it or \`codeExcludes\` is
set. \`excludeFromCount\` counts toward neither.

Over a budget: **stop before committing.**`;

const EXCALIDRAW_REPLACE =
  "read the `.excalidraw` JSON of each file in <diagrams.glob> and collect the `text` of every element whose `type` is `text`";

const REWRITES = {
  "skills/task-run/SKILL.md": [
    [TASK_RUN_SIZE_FIND, TASK_RUN_SIZE_REPLACE],
    [
      "Either way, report the script's line with both counts",
      "Either way, report both counts",
    ],
    [
      " The `guard-signature` hook denies a commit\n  that carries one.",
      " Re-read the message and the pull request body before committing and remove\n  any AI trailer, anthropic.com address or generated-with line.",
    ],
    [
      "- In a repo that ships `.claude-plugin/plugin.json`, the `version-bump` hook\n  raises the patch version and stages it on the branch's first commit.",
      "- In a repo that ships `.claude-plugin/plugin.json`, bump the patch version of\n  `.claude-plugin/plugin.json` by hand on the branch's first commit and stage it.",
    ],
  ],
  "skills/docs-sync/SKILL.md": [
    [
      'JSON, so labels are greppable: `python3 "${CLAUDE_PLUGIN_ROOT}/skills/docs-sync/scripts/diagram-text.py" <diagrams.glob>`',
      `JSON, so labels are greppable: ${EXCALIDRAW_REPLACE}`,
    ],
  ],
  "agents/docs-diagram-auditor.md": [
    [
      '`python3 "${CLAUDE_PLUGIN_ROOT}/skills/docs-sync/scripts/diagram-text.py" <diagrams.glob>`',
      EXCALIDRAW_REPLACE,
    ],
  ],
  "skills/init-workflow/SKILL.md": [
    [
      `- **Commit and command discipline** - the plugin's hooks stop and ask the owner
  before \`--no-verify\`, \`git add -A\`, bare \`npx\`-style invocations of the gate
  binaries, branch deletes/renames, force pushes and any other git force flag.
  A git force flag is refused outright unless the call's description says why
  force is needed. Confirm they are active with \`/hooks\`.`,
      `- **Commit and command discipline** - rules Claude follows, since this variant
  ships no hooks: ask the owner before \`--no-verify\`, \`git add -A\`, bare
  \`npx\`-style invocations of the gate binaries, branch deletes/renames, force
  pushes and any other git force flag, and never use a git force flag without
  the call's description saying why force is needed.`,
    ],
  ],
  "skills/init-workflow/templates/CLAUDE-workflow-section.md": [
    ["the guard\nhook refuses a force flag without one.", "a force flag without that reason is a deviation."],
  ],
  "commands/review-feedback.md": [
    [
      "allowed-tools: Read, Glob, Grep, Bash(gh repo view:*), Bash(gh api:*)",
      "allowed-tools: Read, Glob, Grep",
    ],
  ],
};

const README = `# taskflow

A plan-and-task workflow for Claude Code: scope, tasks, questions and progress
scaffolding split into pull requests under a line budget, acceptance criteria
agreed up front, tests red before green, one task per commit, questions answered
at the task that needs them, red-first bug fixes, docs-and-diagram sync and a
standards review.

## Commands

- \`/deviation\` - record a departure from the plan in the session log
- \`/init-workflow\` - set up or reconcile \`.claude/workflow.json\`
- \`/next-task\` - pick up the next pending task and run the one-task cycle
- \`/plan-status\` - show the task table, open questions and the latest log entries
- \`/review-feedback\` - judge a pull request's review comments and suggest a process change

## Skills

- \`plan-start\` - scaffold SCOPE.md, TASKS.md, QUESTIONS.md and PROGRESS.md
- \`task-run\` - apply one task through the full cycle
- \`bug-red-test\` - prove a regression test fails against the old behaviour
- \`docs-sync\` - check the docs and diagrams still describe the code
- \`standards-review\` - audit a diff against the repo's CLAUDE.md standards
- \`init-workflow\` - write the workflow config and CLAUDE.md section

## Agents

- \`plan-architect\` - surveys the code a piece of work touches and drafts the plan
- \`gate-runner\` - runs the quality gates and reports only failures
- \`pr-reviewer\` - reviews a pull request against its acceptance criteria
- \`standards-reviewer\` - audits a diff against the documented standards
- \`docs-diagram-auditor\` - sweeps the docs and diagrams for stale claims

## This variant

This is the directory build of taskflow. It ships no hooks and no scripts: the
commit, signature, size and version rules are procedures Claude follows rather
than checks a hook enforces. For the guards, install the full plugin:

\`\`\`
/plugin marketplace add GuiMoraesDev/taskflow
/plugin install taskflow@taskflow-tools
\`\`\`
`;

const rel = (p) => path.relative(srcRoot, p) || ".";

const readSource = (relPath) => {
  const full = path.join(srcRoot, relPath);
  if (!fs.existsSync(full)) fail(`${relPath}: missing source`);
  return full;
};

const copyTree = (relDir, skip) => {
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, name);
      const r = rel(full);
      if (skip.includes(r)) continue;
      if (fs.statSync(full).isDirectory()) walk(full);
      else copyFile(r);
    }
  };
  walk(readSource(relDir));
};

const copyFile = (relPath) => {
  const dest = path.join(outDir, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(readSource(relPath), dest);
};

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

copyTree("agents", []);
copyTree("commands", []);
copyTree("skills", ["skills/docs-sync/scripts"]);
copyFile("LICENSE");
copyFile("examples/workflow.example.json");
copyFile(".claude-plugin/icon.png");

const manifest = JSON.parse(fs.readFileSync(readSource(".claude-plugin/plugin.json"), "utf8"));
fs.writeFileSync(path.join(outDir, ".claude-plugin/plugin.json"), JSON.stringify(manifest, null, 2) + "\n");
fs.writeFileSync(path.join(outDir, "README.md"), README);

for (const [relPath, pairs] of Object.entries(REWRITES)) {
  const dest = path.join(outDir, relPath);
  let text = fs.readFileSync(dest, "utf8");
  for (const [find, replace] of pairs) {
    if (text.split(find).length !== 2) {
      fail(`${relPath}: pattern did not match exactly once: ${find.split("\n")[0].slice(0, 80)}`);
    }
    text = text.replace(find, () => replace);
  }
  fs.writeFileSync(dest, text);
}
