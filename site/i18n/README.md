# i18n — changelog Chinese translations (build-time output)

**English** | [中文](README.zh-CN.md)

The bullets on the site's Changelog tab are a **verbatim English quote** of the official `anthropics/claude-code` release notes (see `../../corpus/changelog/`). The Chinese translations are generated at **build time** and reviewed by hand before commit; there is no runtime translation online, and an entry with no translation falls back quietly to the English original in the zh UI, with a note.

## Storage: content-addressed, naturally incremental

`changelog-zh.map.json` maps **each English original** to its reviewed Chinese:

- New release → only new keys are added; existing translations are never re-done;
- An upstream edit to some original → it orphans exactly that one old key, so a stale translation can never attach to the new text;
- The same entry reused across versions (common) → translated once.

## Incremental workflow (the standard in-session agent operation)

This project is agent-maintained — the CLI is the agent's operating surface: everything is file-based, takes effect atomically, and has machine-readable stdout/exit codes, with no model calls inside. Translation is done by the in-session agent (or a human).

```bash
# 0. See the current state (read-only, writes nothing; --json for machine-readable output)
node site/scripts/build-changelog-zh.js --status

# 1. Generate the untranslated work order (optionally limit to the latest N versions with entries)
node site/scripts/build-changelog-zh.js --missing todo.json --limit-versions 5

# 2. Translate. Two ways to fill it in:
#    a) Small batch: change null to the translation directly in todo.json (values only, don't touch keys);
#    b) Large batch (recommended): write a separate translation-only JSON array list.json in the same key order
#       as the work order, with zero transcription of the long English keys — order is the contract, a count mismatch rejects the whole order.
#    The full set of translation constraints is in STYLE.md (hard rules / punctuation details / verbatim-keep list / glossary / sentence patterns) —
#    read it before translating; in brief: inline `code`, URLs, and product names are kept verbatim, ** counts match,
#    UI quotes stay as English literals, Chinese separators use full-width (the lint rejects half-width ,; touching Chinese),
#    technical literals (`,`/`;` inside code spans, OSC 9;4, thousands separators) stay half-width.

# 3. (optional) Verify before saving: lint only, no write
node site/scripts/build-changelog-zh.js --check todo.json

# 4. Merge + bake (lint is a hard gate: on failure the whole order is rejected, exit 1, with each violation printed)
node site/scripts/build-changelog-zh.js --apply todo.json            # way (a)
node site/scripts/build-changelog-zh.js --apply-list list.json todo.json  # way (b)
```

Running `node site/scripts/build-changelog-zh.js` on its own just bakes `../public/changelog-zh.js` (build output, not committed) and reports coverage. Invalid entries in the map are skipped (treated as untranslated) and never block the data pipeline. `apply` is idempotent: re-applying the same file = `0 added, 0 changed`.

The English original is always the authoritative version; in the zh UI the translation is shown by default, with one-click toggle back to the original.
