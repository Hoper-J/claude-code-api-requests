---
name: lineage-design
description: Use this skill to generate well-branded interfaces and assets for Lineage, the static teaching archive that visualizes how the Claude Code CLI's API request evolved across versions. Use it for production or for throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, brand assets, and the UI-kit components for building the timeline, version explorer, diff/compare, and search views.
---

Read the `DESIGN.md` file within this skill first — it is the full design guide
(context, the three-voice type model, content fundamentals, visual foundations,
iconography, and a file index). Then explore the other files as needed.

Key facts to anchor on:
- **Voice rule:** serif (Newsreader) + sans (Hanken Grotesk) are localizable chrome;
  mono (JetBrains Mono) is the verbatim API corpus and is **never translated**.
- **Look:** warm ivory "paper" + cool sapphire ink, hairline rules, near-flat
  elevation, low radii. Diff add/remove/modified is a first-class color system.
- **Tokens** live in `../public/tokens/*.css` and are reached via `../public/styles.css`
  (`../public/` is the runtime/deploy root; this `design/` dir is the design source).
- **Components** live in `components/<group>/` (core, corpus, nav). The site in
  `../public/` (index.html + App.jsx) shows them composed against the real corpus.

How to work:
- If you are creating **visual artifacts** (slides, mocks, throwaway prototypes),
  copy the assets you need out of `../public/assets/`, link `../public/styles.css`, and produce static
  HTML for the user to view. Reuse `../public/kit-lib.jsx` for ready-made
  primitives, or read the component sources under `components/`.
- If you are working on **production code**, copy assets and read the rules here to
  become an expert in designing with this brand; the component sources live in
  `components/<group>/` and the runnable mirror is `../public/kit-lib.jsx`.
- Never translate corpus content. Render system prompts, tool names/descriptions, and
  input_schemas exactly as captured, in every locale.

If the user invokes this skill without other guidance, ask them what they want to build
or design, ask a few focused questions, then act as an expert designer who outputs HTML
artifacts _or_ production code, depending on the need.
