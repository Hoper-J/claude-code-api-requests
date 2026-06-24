# site — Lineage design system + teaching site

**English** | [中文](README.zh-CN.md)

**Layout: runtime / design split** — `public/` is the directly-publishable deploy root (point Cloudflare Pages' publish dir at it; entry at `/`); `design/` is the design-system source (not deployed). For the full design picture read [design/DESIGN.md](./design/DESIGN.md).

```
site/
├── public/                    # ← deploy root
│   ├── index.html             # site entry (/), favicon = brand mark
│   ├── App.jsx · kit-lib.jsx · locales.jsx
│   ├── data.js                # generated (gitignored): node site/scripts/build-data.js corpus
│   ├── data/                  # generated (gitignored): --emit-json static JSON API (v/*.json + index/latest)
│   ├── changelog-data.js      # generated (gitignored): official changelog snapshot → verbatim bullets + category counts
│   ├── changelog-zh.js        # generated (gitignored): reviewed-translation map → per-version array (null = fall back to English)
│   ├── styles.css + tokens/   # design tokens (oklch, light/dark)
│   ├── assets/                # brand SVG + self-hosted woff2 fonts (no Google Fonts dependency)
│   ├── vendor/                # self-hosted React + Babel (production min, zero CDN dependency)
│   └── _headers               # CF Pages cache contract (/data/v/*, fonts, vendor immutable; index/latest 5min)
├── design/                    # ← design source (not deployed)
│   ├── DESIGN.md              # design guide (three-voice type model, content rules, productionization roadmap §7)
│   ├── SKILL.md               # Claude Code Agent-Skill (lineage-design)
│   ├── components/            # component sources (each: jsx + d.ts + en/zh prompt.md; one *.card.html demo per group)
│   └── foundations/           # design-spec cards (link ../../public/styles.css)
├── i18n/                      # changelog Chinese-translation map (addressed by English original, incremental; see its README)
└── scripts/                   # dependency-free Node build: build-data.js (with built-in PII gate)
                               #   + build-changelog.js + build-changelog-zh.js
```

## Launching the site

```bash
./serve.sh            # rebuilds stale data → serves site/public → opens the browser (http://localhost:4173/)
PORT=8080 ./serve.sh  # custom port (auto-bumps if taken)
./serve.sh --no-open  # don't open a browser (CI/agent)
```

It's structurally identical to the Cloudflare Pages publish directory, so local URLs match production. React/Babel and fonts are self-hosted (`public/vendor/`, `public/assets/`).

## Building the offline single file

```bash
node site/scripts/build-offline.js   # → claude-code-api-requests-offline.html (repo root, ~4MB)
```

Flattens the whole site into one offline HTML — double-click to open, no network needed.

## Deploy (Cloudflare Pages)

- **Build command**: `node site/scripts/build-data.js corpus --emit-json site/public/data && node site/scripts/build-changelog.js && node site/scripts/build-changelog-zh.js`
- **Publish directory**: `site/public`
- **Custom domain**: `api-requests.cc` (Pages → Custom domains to bind; `index.html` already has a built-in
  `canonical`/og pointing at the main domain, so `<project>.pages.dev` won't split indexing from the main domain).
- Data update = push the updated corpus (incl. changelog snapshot) → Pages regenerates at build time → `/data/latest.json` goes live worldwide within 5 minutes.
- The changelog build is fully offline (reads the committed `corpus/changelog/CHANGELOG.md` snapshot and the `site/i18n/` map, no network).

## Constraints / settled decisions

- The corpus is masked before it lands.
- **TLS/ja3/ja4 not shown**: the corpus has them pseudonymized (`<ja3#N>` group labels; `clienthello_hex` keeps length only), and the UI ignores them entirely.
- Main inference vs quota probe (`is_main_inference`/`is_quota_probe`): this corpus is entirely re-captured main inference; probes are not shown.

## Showable dimensions (boundaries in ../corpus/findings.md)

- Cross-version diff of `request.body` (system-prompt section diff / tools added-removed-modified / injected context).
- **MCP carriage**: inline 2.0.66–2.1.68 → from 2.1.69 ToolSearch deferral (tool names go into the deferred enumeration, schema not inlined); from 2.1.153 MCP switches to async connect, so whether the tool appears in the first request is a **capture race**, not a version boundary (see findings).
- Custom-file first-appearance boundaries: CLAUDE.md 2.0.0 / hook 2.0.0 (2.0.17–2.0.29 regression window) / skill 2.0.9 / MCP 2.0.66 / memory 2.1.59.
- Model chain sonnet-4-5 → … → opus-4-8, max_tokens 32k→64k (2.1.77), beta-set evolution, model-axis variants (2.1.170 ⎇ fable-5).

## Development notes

- The demo cards and the site share the same primitives: the `*.card.html` files under `design/` load `../../../public/kit-lib.jsx` directly — kit-lib is the single runtime source of truth, and `design/components/*.jsx` is its 1:1 readable mirror (change one side and you must sync the other, with d.ts/prompt.md updated to match).
- Babel standalone runs every `text/babel` script in the **same scope**: inside a card's inline script, don't destructure `const { Button } = window` (it collides with kit-lib's top-level function declarations); just use the global component name.
```

