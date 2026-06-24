# Lineage — Design System

> The design system for **Lineage**, a static teaching archive that visualizes how the
> Claude Code CLI's API request evolved across versions — version by version, system
> prompt by system prompt, tool by tool.

Lineage is a **read-only, 100% static** educational website. Its whole job is to render a
finite, immutable corpus — verbatim Anthropic Messages API request payloads — and let
people *read*, *explore*, and *diff* them in English and Simplified Chinese. This design
system exists to make that reading experience calm, precise, and archival.

---

## 1. Context & sources

This is a **greenfield** brand. There was no prior product UI, Figma, or brand kit to
recreate — the design direction here is original, derived from the nature of the content.

**Source material given (read-only corpus, not design assets):**
- `../corpus/` — the captured corpus (this repo, sanitized in place). Key files:
  - `manifest.json` — the source-of-truth version list (sorted by **semver**: `2.1.9 < 2.1.10 < 2.1.100`), with `versions` / `failed` / `auxiliary_captures`.
  - `versions/<v>/full.json` — the captured request/response per version. Teaching content lives in `.request.body` (`system[]` blocks, `tools[]` schemas, `messages[]`).
  - `versions/<v>/status.json` — per-version metadata (`result`, `system_blocks`, `tools_count`, `http_status`, …).
  - `example/` — the safe **placeholder project** whose injected context (CLAUDE.md, MEMORY.md, `.claude/` skills, `.mcp.json`, SessionStart hook) appears in the captured `messages[]`.
- Corpus scale: the whole Claude Code `2.x` line from `2.0.0` onward — all main captures (0 auxiliary, 0 no-capture). The set grows as new releases are captured; `manifest.json` is the source of truth and the build derives `COUNTS` from it.

> The corpus contains a `tls` object and `ja3`/`ja4` fields. These are **deliberately ignored**
> everywhere in this system — no fingerprinting UI, ever.

**The content the UI must render:**
- **System prompts** — long monospace text with `<system-reminder>` tags, markdown, and worked examples. Preserve whitespace; collapse long sections.
- **Tool definitions** — `name`, `description`, and pretty-printed `input_schema` (JSON Schema).
- **Version metadata** — model, HTTP status, header summary.
- **Timeline** — every version in semver order with a one-line "what changed."
- **Diffs** — line-level add/remove on the system prompt; tool add/remove/modify.

---

## 2. The core idea: three voices

Lineage's type system maps one-to-one onto the site's information architecture — which is
also its **i18n architecture**:

| Voice | Family | Role | Translated? |
|-------|--------|------|-------------|
| **Editorial** | Newsreader (serif) | Teaching voice, titles, "what changed" prose | ✅ localized chrome |
| **UI** | Hanken Grotesk (sans) | Labels, buttons, metadata, navigation | ✅ localized chrome |
| **Corpus** | JetBrains Mono (mono) | The verbatim API payload — system prompts, tool schemas | ❌ **never translated** |

If it's set in **mono, it's the object of study** and renders byte-for-byte identical in
every locale. If it's serif or sans, it's the site's own editorial chrome and gets
localized. This rule resolves almost every design question on the site.

The one nuance is the **changelog** (official release notes): it's quoted third-party
prose, not the site's own voice. It renders in sans and the zh locale offers a reviewed
translation, but — unlike chrome — the English original stays authoritative (one-click
译文/原文 toggle, and any untranslated bullet falls back to English), and inline `code`
spans / URLs inside it stay mono-verbatim. So it reads localized like chrome yet is
sourced like the corpus. The corpus itself (system prompts, tool schemas, messages) is
still **never translated**.

---

## 3. Content fundamentals (copy & tone)

The site's editorial chrome (everything *except* the corpus) follows these rules:

- **Voice:** a knowledgeable archivist/curator, not a marketer. Plain, exact, quietly
  curious. We are *showing* an artifact, not selling anything.
- **Person:** address the reader as **"you"** sparingly; prefer descriptive, impersonal
  labels ("System prompt", "15 tools", "Changed since 2.0.12"). Never "we."
- **Casing:** **Sentence case** everywhere — headings, buttons, labels. The only
  uppercase is the **overline/eyebrow** (tracked-out caps, e.g. `SYSTEM PROMPT`) and the
  monospace metadata keys. Never Title Case buttons.
- **Numbers are facts, not decoration.** Every number on screen is real and from the
  corpus (`15 tools`, `+1,284 chars`, `2.1.38`). No invented stats, no vanity metrics.
- **"What changed" is generated, never written.** The build emits a structured,
  locale-agnostic delta (`{ tools_added, tools_removed, system_chars_delta, model_changed }`).
  The UI renders it into a localized sentence via templates with proper pluralization.
  *Example renderings:*
  - en: `Added 2 tools · 1 modified · +1,284 chars in the system prompt`
  - en (singular): `Added 1 tool · model changed`
  - zh: `新增 2 个工具 · 修改 1 个 · 系统提示 +1,284 字符`
- **Diff language is directional and terse:** `Added`, `Removed`, `Modified`, `Unchanged`.
- **Failures are stated plainly, never alarmingly:** "No capture for this version." The
  timeline still shows the version; it's just dimmed and non-interactive.
- **No emoji. No exclamation marks.** The tone is archival calm. Punctuation is a middot
  (`·`) for inline separation and an en-dash for ranges.
- **Tense:** present for the artifact ("This version sends 15 tools"), past for events
  ("Removed in 2.1.0").

---

## 4. Visual foundations

**Overall feeling:** an archival reading room for code. Warm paper, cool ink, hairline
rules, almost no shadow. It should feel like a beautifully typeset technical reference
crossed with a git-history viewer — never a SaaS dashboard.

- **Color & vibe.** A **warm ivory "paper"** background (`--paper-50`, ~`#FBF9F4`) with
  **warm near-black ink** text. The single brand/interactive color is a **cool, slightly
  desaturated sapphire** (`--brand`) — chosen to sit calmly against warm paper and to stay
  clearly distinct from the diff palette. **Amber** is a sparing accent for "changed"
  marks and highlights. The cool brand against warm neutrals is the signature tension.
- **Diff is a first-class color system.** Green = addition, red = deletion, amber =
  modified — each with a `text` / `surface` / `edge` / `marker` quartet, tuned for both
  themes. These never read as "success/error"; they mean insert/delete/change.
- **Themes.** Light "paper" is primary. A dark "ink" theme (warm charcoal, ivory text,
  lifted sapphire) ships via `[data-theme="dark"]` for the developer audience and the
  terminal affinity of the content.
- **Type.** Newsreader (serif, optical-sized) for editorial display and prose; Hanken
  Grotesk for UI; JetBrains Mono for all corpus. Generous reading measures: `68ch` for
  prose, `96ch` for mono payloads. Large display uses tight tracking (`-0.02em`); eyebrows
  use wide caps (`0.10em`).
- **Spacing.** 4px grid. Comfortable but not airy — this is a dense reading tool, so
  vertical rhythm is tight and consistent (`--space-4`/`6`/`8` do most of the work).
- **Backgrounds.** Flat paper. **No gradients, no photographic imagery, no texture.** The
  only "imagery" is the corpus itself and the version-graph motif. Code wells are a
  slightly sunken warm tint (`--surface-well`) with an inset hairline.
- **Borders & cards.** Structure comes from **1px hairlines** (`--line-hairline`), not
  shadow. Cards are `--surface-card` with a hairline and `--radius-3` (8px). Radii are
  deliberately **low** (3–12px) — crisp, document-like, never pill-soft except true pills
  (chips/tags).
- **Elevation.** Near-flat. Shadows are warm-tinted and reserved strictly for floating
  layers (menus `--shadow-md`, dialogs `--shadow-pop`). Resting cards cast **no shadow**.
- **Animation.** Restrained and functional. Default `150ms` with a `cubic-bezier(0.2,0,0,1)`
  standard ease; panels expand at `220ms`. **No bounce, no spring, no decorative looping.**
  Fades and short height/opacity transitions only. All motion respects
  `prefers-reduced-motion`.
- **Hover.** Interactive surfaces shift one paper-step darker (or gain a hairline);
  brand buttons go to `--brand-hover`. Links underline on hover. No scale-up on hover.
- **Press.** A subtle darken to `--brand-press` plus `translateY(0.5px)` — a small physical
  "set." No big squish.
- **Focus.** A 2px sapphire ring offset by a paper-colored gap (`--focus-shadow`) —
  visible on both themes, never removed.
- **Transparency & blur.** Used sparingly: a sticky header uses a paper background at
  ~85% with a small `backdrop-filter: blur(8px)`; overlays dim with a warm ink scrim.
  Blur is a chrome affordance, never applied to corpus content.
- **Corner radii recap:** chips/inputs `3px`, buttons/badges `5px`, cards/panels `8px`,
  dialogs `12px`, pills `999px`.

---

## 5. Iconography

- **System:** [**Lucide**](https://lucide.dev) — a clean, consistent **stroke** icon set
  (2px stroke, 24px grid, round caps/joins) that matches Lineage's hairline aesthetic.
  The runtime inlines the handful of paths it uses as the `Icon` component in
  `kit-lib.jsx` — no icon library is loaded at runtime.
  - **Substitution flag:** Lineage has no bespoke icon font of its own; Lucide is the
    chosen stock set. If you want a custom icon language, that's a follow-up.
- **Stroke & size.** Icons render at `16` or `18px` in UI rows, `20px` in headers. Keep
  Lucide's native 2px stroke; do not fill stroke icons.
- **Color.** Icons inherit `currentColor` — `--text-muted` at rest, `--text-strong` or
  `--brand` when active. Diff markers (`+` / `−`) are **glyphs in mono**, not icons, and
  use `--add-marker` / `--del-marker`.
- **Key icons in use:** `git-branch`, `git-commit`, `git-compare`, `arrow-left/right`,
  `chevron-right` (expand), `copy`, `check`, `search`, `languages` (locale switch),
  `sun` / `moon` (theme), `external-link`, `link` (deep-link anchor), `x`, `circle-dot`,
  `circle-slash` (failed capture).
- **No emoji. No unicode pictographs** as icons. The middot `·`, en-dash `–`, and the
  diff glyphs `+ −` are the only "symbol" characters used, all set in mono.
- **The brand mark** (`../public/assets/lineage-mark.svg`) is the version-graph glyph: a spine with
  two nodes and a branch to a "changed" node. It uses `currentColor` and a
  `--bg-app`-aware node fill, so it works on either theme.

---

## 6. Index / manifest

> **Repo layout:** the runtime/deploy root is **`../public/`**
> (index.html entry at `/`, styles, tokens, fonts, app sources, generated `data.js`);
> this **`design/`** dir holds the design source (this guide, SKILL, components,
> foundations) and is **not deployed**. The ingest pipeline lives at
> `../scripts/build-data.js`. The demo cards load `../public/kit-lib.jsx` — the same
> primitives the site runs.

**Runtime root** (`../public/`)
- `index.html` — site entry (links `styles.css`, boots the app; favicon = brand mark).
- `styles.css` — global entry (import-only). Consumers link this.
- `App.jsx` · `kit-lib.jsx` · `locales.jsx` (+ generated `data.js` · `changelog-data.js` · `changelog-zh.js`, gitignored).

**This dir** (`design/`)
- `DESIGN.md` — this guide. · `SKILL.md` — Agent-Skill front-matter for Claude Code.
- `../scripts/build-data.js` — corpus → `data.js` ingest pipeline (Node, no deps).
- `../scripts/build-changelog.js` — official changelog snapshot (`../../corpus/changelog/`) → `changelog-data.js`.
- `../scripts/build-changelog-zh.js` — reviewed zh map (`../i18n/`) → `changelog-zh.js` (incremental: content-addressed by English bullet).

**Tokens** (`../public/tokens/`)
- `fonts.css` · `colors.css` · `typography.css` · `spacing.css` · `elevation.css` · `base.css`

**Assets** (`../public/assets/`)
- `lineage-mark.svg` · `lineage-wordmark.svg` · `fonts/*.woff2`

**Foundation cards** (`foundations/`) — specimen cards for the Design System tab:
type (editorial / UI / corpus), colors (paper / ink / brand / diff), spacing (scale /
radii & elevation), brand (logo / voice).

**Components** (`components/`) — reusable primitives, each with `.jsx` + `.d.ts` +
`.prompt.md` (+ `.prompt.zh-CN.md`), demoed in a per-group `*.card.html` specimen:
- `core/` — **Button**, **VersionChip**, **Badge**, **Tag**, **StatusDot**, **Tooltip**
- `corpus/` — **CodeBlock**, **ToolCard**, **DiffLine**, **DeltaSummary**, **ChangelogEntry**
- `nav/` — **Tabs**, **SegmentedControl**

**The site** (`../public/`) — the teaching site itself, fully interactive in
**en/zh** and **light/dark**, running on the **real, sanitized corpus**: `index.html`
(boots the app), `kit-lib.jsx` (local mirror of the primitives), `data.js` (generated
from `../corpus/` — every version in the manifest, deduped blocks + tool
schemas + messages, real consecutive deltas, sorted **newest-first**), `locales.jsx`
(en + zh chrome packs), `App.jsx` (header, timeline, version explorer, compare/diff,
search overlay, anatomy), `changelog-data.js` (generated from the official changelog
snapshot in `../../corpus/changelog/` — verbatim bullets + generated category counts,
corpus versions only), `changelog-zh.js` (generated from `../i18n/changelog-zh.map.json`
— reviewed build-time translations, per-bullet English fallback; no runtime translation).

Site views:
- **Timeline** — main ok versions only (auxiliary + no-capture folded), each row a
  structured "what changed"; hidden ranges show a "N versions not captured" gap marker;
  chips/items are click-through to the matching Compare section.
- **Explorer** — six tabs grouped **Request** (System prompt · Messages · Tools · Params),
  **Response**, and **Changelog** — the version's official release notes, quoted verbatim
  from `anthropics/claude-code` CHANGELOG.md. The English bullets are the object of study
  and stay authoritative; the zh locale shows reviewed build-time translations with a
  译文/原文 toggle (untranslated bullets fall back to English per bullet). The generated
  digest line ("3 added · 5 fixed" / "新增 3 · 修复 5") and the chrome localize as usual.
  Versions absent from the official changelog get a calm "no entry" state (the copy never
  claims the release was skipped — the snapshot can't know). Params holds model /
  max_tokens / temperature / stream / `output_config.effort` / `diagnostics` /
  `metadata.user_id` (masked) / beta set / `context_management`. Messages renders
  verbatim, with a Message-structure signature (reminder kinds · blocks · probe · cache
  breaks). Response holds http_status / regime / the model **reply** + `stop_reason` /
  full `usage` / header summary. When a version carries model variants (e.g. a Fable 5
  capture), a **captures** toggle switches default ⇄ variant and a model-axis diff panel
  highlights only the model-driven changes (orthogonal to the version-axis diff).
- **Compare** — version pickers top-right (compact custom dropdowns); a sticky **Changes**
  rail (scroll-spy, collapsible to a floating button) indexes the changed groups. Diffs:
  system prompt **by section** (`# Heading` blocks classified added/removed/modified/
  unchanged, drill-in line diff, unified toggle); tools (incl. before→after of a modified
  tool's description and input_schema); beta features; `max_tokens` / `effort`; and the
  **injected message context** (reminder kinds, probe, block count). Sections with no
  change are omitted entirely. A trailing **changelog** section lists the official release
  notes for the compared span (`(from, to]`, newest first, same 译文/原文 toggle as the
  explorer) — payload diff and stated release notes on one screen. Two versions on the same
  base (a model-axis compare, e.g. `2.1.170` vs `2.1.170@claude-fable-5-1m`) work too.
- **Anatomy** — a one-time editorial breakdown of the request body, pointing each part to
  its tab.

> Data note: `data.js` is build output, regenerated from `../corpus/` whenever
> new versions are pulled (the manifest's `versions`/`failed`/`auxiliary_captures` lists
> are the source of truth, so the newest release always sorts to the top). The build
> extracts each captured request's `system` blocks, `tools` schemas, `messages` (with
> `cache_control` ttl), `max_tokens`, `temperature`, `stream`, `output_config.effort`,
> `diagnostics`, `context_management`, the parsed `Anthropic-Beta` set, and the response
> `reply` / `stop_reason` / full `usage`; dedupes shared blocks/tools/messages; and
> computes the structured `change_delta` between consecutive **main** ok versions
> (tools/beta/reminder add-remove-modify, `system_chars_delta`, `max_tokens`/`effort`/
> `model` changes). `COUNTS` reports `ok` (main captures) / `aux` / `fail` separately, so
> "captured" excludes auxiliary. The corpus is heterogeneous and shown verbatim — models
> evolve (sonnet-4-5 → opus-4-5 → opus-4-6 → opus-4-7 → opus-4-8), `max_tokens` grows (32,000 → 64,000 at 2.1.77), the beta set
> expands, and the injected-context line grows (CLAUDE.md → session hook → skills → date →
> memory → user email → deferred tools).
>
> **Privacy:** the injected context (CLAUDE.md, MEMORY.md, `.claude/` skills,
> `.mcp.json`, SessionStart hook) is safe **placeholder sample data**, so messages
> render verbatim. The corpus is sanitized in place (see `../../sanitize/`), and the
> build applies the same shape-identical rules — the operator home-dir **prefix** → `~`
> (tail kept; only `os.homedir()` matches, so corpus-authored example paths like
> `/Users/name/My Documents` stay), operator emails → `<email>` (`@anthropic.com` is
> corpus content and stays), keys → `<token>`, the injected capture date → `<date>`
> (only when the value equals the version's capture day — constant corpus example
> dates stay) — and masks each `metadata.user_id` field to `<key>(N chars)`
> placeholders, e.g. `<user_id>(159 chars)` (id length kept, value hidden). Headers ship **in full** (denylist + mask, not whitelist): volatile/infra
> headers are dropped (`Request-Id`, `Date`, `anthropic-ratelimit-*`, `cf-ray`,
> `x-client-request-id`, `x-claude-code-session-id`, `Content-Length`, `Host`,
> `Connection`, `Accept-Encoding`); auth headers (`Authorization`, `X-Api-Key`, `Cookie`)
> are masked to `<masked>(N chars)`; every other header ships verbatim (sanitized) —
> 19 distinct names across the corpus, shown under Params → Request headers. Ignored
> entirely: `tls`. In production `data.js` would be fetched lazily, not inlined.

> Fonts note: the three families are **self-hosted** — latin `woff2` binaries vendored
> in `assets/fonts/` (Hanken Grotesk 400–700, JetBrains Mono 400–700, Newsreader
> 400–700 + italics), declared as `@font-face` rules in `tokens/fonts.css` with
> `font-display: swap`. No runtime dependency on Google Fonts.

---

## 7. Production notes — claude-code-api-requests

This UI kit is the final display interface of the **claude-code-api-requests** project
(the site keeps the **Lineage** brand name; the repo name appears in the footer).
What's already production-shaped vs what the static build must replace:

**In the kit already**
- `scripts/build-data.js` — the full ingest pipeline as a runnable Node script:
  `node scripts/build-data.js <corpusDir>` rebuilds `data.js` from `manifest.json` +
  `versions/<v>/{full,status}.json` (+ `variants/`). Encodes every shipped rule —
  sanitize, header denylist+mask, metadata masking, dedupe pools, message-shape
  detection, all delta kinds, variant attachment — and FAILS loudly if PII survives.
  New versions auto-appear in every view after a rebuild; no UI changes needed.
  `--emit-json <dir>` additionally writes stable per-version JSON for curl users:
  `<dir>/v/<version>.json` (+ `-<variantId>` forms, immutable — the version IS the
  content hash), plus short-cache aliases `<dir>/index.json` and `<dir>/latest.json`.
  ```
  curl -s https://<site>/data/v/2.1.170.json | jq .request.body.model
  curl -s https://<site>/data/latest.json | jq .version
  ```
  `_headers` pairing: `/data/v/*` → `max-age=31536000, immutable`;
  `/data/index.json`, `/data/latest.json` → `max-age=300`.
- Hash routing mirrors the production URL scheme: `#/en` (timeline) ·
  `#/en/v/2.1.170` (explorer) · `#/en/diff/2.1.169/2.1.170?focus=tools` (compare,
  variant keys like `2.1.170@claude-fable-5-1m` allowed) · `#/zh/anatomy`. Deep links,
  back/forward, and shared URLs restore state; switching language preserves the route.
  Production swaps `#/` for real locale-prefixed paths with the same shape.
- Locale + theme persist to `localStorage`; corpus renders verbatim in every locale.

**Distribution form (orthogonal to the production roadmap below)**
- `scripts/build-offline.js` flattens the whole site into ONE self-contained
  `claude-code-api-requests-offline.html` (~4 MB) committed at the repo root for
  offline / archival use: JSX is precompiled at build time via the vendored Babel
  (`../vendor/`, hash-pinned — the compiler does not ship), production React
  is inlined, fonts/favicon become data: URIs, and the build refuses to write
  unless its gates pass (script-closure simulation, no external refs,
  licenses/OFL embedded, PII scan, freshness vs the manifest). This partially
  advances the precompile item below but does not replace the hosted form.

**Production build replaces (per the original spec)**
- `data.js` (inlined, ~2.6 MB) and `changelog-data.js`/`changelog-zh.js` (~350 KB each) →
  `index.json` first paint + per-version / per-diff JSON lazy-loads,
  content-hashed filenames, `_headers` immutable caching.
- In-browser Babel/JSX → precompiled bundle (Vite/Astro static output).
- Browser-side diffing → build-time precomputed diff files.
- In-memory search scan → Pagefind static index.
- Fonts are already self-hosted (`assets/fonts/` + `tokens/fonts.css` @font-face).
- **PII verify-or-fail step** (spec PART 1) is NOT in the demo build: after sanitizing,
  `build:data` must re-scan its own output — home paths (macOS/Linux/Windows), emails,
  `sk-ant-*`, generic `api_key/secret/password` values, `Bearer …`, JWTs (`eyJ…`),
  AWS `AKIA…` / GitHub `ghp_…` tokens, long hex ids — and `process.exit(1)` on any hit
  (version strings like `2.1.108.260` are known IPv4-pattern false positives; whitelist
  them). A manual audit of the current `data.js` with this exact rule set: **0 hits**.
