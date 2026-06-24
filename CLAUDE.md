# CLAUDE.md

This repo is a cross-version archive site for the Claude Code CLI's default API request (brand: Lineage, domain: api-requests.cc). The corpus lives in `corpus/`, the site in `site/`, and capture in `capture/`; for everyday commands see the "CLI overview" in [README.md](README.md). The corpus is produced by the maintainer's isolated capture setup — outsiders neither need nor can reproduce it, and the display side has zero `ccwrap` dependency.

## Invariants you must hold when changing code

- **Comments in English.** Reader-facing docs are bilingual: an English `X.md` (primary — what GitHub shows) plus a Chinese mirror `X.zh-CN.md`; edit one side and sync the other. `CLAUDE.md` is English-only; the zh locale pack stays Chinese.
- **1:1 mirror**: `site/public/kit-lib.jsx` is the single runtime source of truth, and `site/design/components/*.jsx` is its readable mirror — change one side and you must sync the other, plus update the matching `.d.ts` / `.prompt.md`.
- **Sanitize rules in two copies**: the string rules in `sanitize/sanitize.js` and `site/scripts/build-data.js` are shape-identical; change one side and you must sync the other, holding the invariant "`data.js` is byte-identical before vs after sanitization" (verify with `cmp`).
- **Docs describe the present**, not the evolution history; the version count grows with the corpus, so read it from `corpus/manifest.json` — never hard-code it.
- **Corpus is verbatim**: system prompts / tool schemas / messages and other corpus content are never translated and never rewritten (the site's core rule).

## Before committing

- Sanitize. `node sanitize/sanitize.js --check` must report 0 leaks — the pre-commit hook runs it automatically when corpus data is staged (on a fresh clone, enable it once with `git config core.hooksPath .githooks`).
- If you touched `site/`: `node site/scripts/build-data.js corpus` has a built-in PII gate and exits non-zero on failure.
- If you touched changelog translations (`site/i18n/`): verify with `node site/scripts/build-changelog-zh.js --check <file>`, then merge with `--apply` (workflow in [site/i18n/README.md](site/i18n/README.md)).
