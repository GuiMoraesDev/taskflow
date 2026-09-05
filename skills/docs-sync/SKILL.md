---
name: docs-sync
description: Verify the docs still describe the code - and the diagrams too, when the repo keeps any. Use before calling a behaviour-changing task done, when the user asks to check or update docs, or when a diagram may have gone stale.
---

# docs-sync

## 1. The checklist

`.claude/workflow.json` `docsChecklist` lists each doc and what it owns. Walk
every row, and verify it against the change - not against your memory of it.

Report per row: **still true** / **updated** / **outstanding**. No row is skipped
silently.

## 1a. The glossary, if there is one

`.claude/workflow.json` `decisions.glossary` names the doc that owns the repo's
vocabulary. When the key is set, check it in the same pass: a change that
introduces a domain term, renames one, or splits one concept into two has changed
the language, and the glossary owns that.

Report a term the code now uses that the glossary does not define, and a
definition the code has drifted away from. Where the two disagree, say which is
which and let the owner settle it - the glossary is a decision record, not a
description you may overwrite to match the code.

When the key is absent, skip this. A repo without a glossary made that choice;
do not propose one as a gap.

## 2. The diagrams, if there are any

Read `.claude/workflow.json` `diagrams`.

**`maintain: false`, or the key is absent** - this repo does not keep diagrams.
Skip this section entirely. Do not suggest adding one, and do not treat its
absence as a gap: prose-only is a decision the repo owner already made. If a
change genuinely needs a picture to be understandable, say so once as a finding
and let them decide.

**`maintain: true`** - the prose and the drawings describe the same runtime, so
whenever you check or change one, check the other in the same pass. A diagram is
documentation, not an appendix to it.

A stale diagram is worse than a missing one: nothing type-checks it, and a box
carrying a renamed state still shows the old name to every reader while turning
up in no search for the new one.

How you check depends on `diagrams.format`:

| Format | How |
| ------ | --- |
| `excalidraw` | JSON, so labels are greppable: `python3 "${CLAUDE_PLUGIN_ROOT}/skills/docs-sync/scripts/diagram-text.py" <diagrams.glob>` |
| `drawio` | Compressed XML - grep only helps if the file was saved uncompressed. Otherwise report it as needing a human to look |
| `mermaid`, `d2`, `plantuml` | Plain text. Read the file directly |

## 3. Who edits a diagram

`diagrams.editedBy` settles it, and the format decides the default.

**`human`** (canvas formats - excalidraw, drawio, figma) - you may read a diagram
and report a stale label, never rewrite it. Editing the file changes no layout,
so a label that grows overflows its box. Give the current text, the correct text
and the file, then leave it listed as **outstanding** with a 🙋 row in the plan.
Never report such a diagram as fixed.

**`agent`** (text formats - mermaid, d2, plantuml) - edit it like any other
source file, and treat the rendered output as the thing that must be right.

## 4. Register

Committed text states the current design - not the conversation that produced it,
and not the history it replaced.

- No "as requested", "as we discussed", "here's what I did". Every file is read
  by someone who was not in the room.
- No "previously X, now Y", "no longer used", "kept for older records". Describe
  what is true now. A removed approach that must stay warned off is a decision
  and belongs in the architecture doc with an ID, not as an aside in the source.
- Say it once. One statement per point, tables over prose, no recap paragraph,
  no "this document describes".

## 5. Delegating the sweep

For a checklist of more than two docs, hand it to the `docs-diagram-auditor`
agent, spawned with `model` set to `models.surface` from `.claude/workflow.json`.
The agent's frontmatter model is the fallback for a repo with no config.

## 6. Commit shape

A diagram-only change is its own `docs:` commit, with nothing else in it.
