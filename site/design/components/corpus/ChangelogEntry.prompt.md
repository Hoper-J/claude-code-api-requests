**ChangelogEntry** — one version's official release notes, quoted verbatim from the Claude Code `CHANGELOG.md`. The English bullets are source material and stay authoritative in every locale, exactly like the corpus. The zh locale may show **reviewed build-time translations** (generated via `site/scripts/build-changelog-zh.js` from the content-addressed map in `site/i18n/`); untranslated bullets fall back to English per bullet. Only the generated digest line ("3 added · 5 fixed") and the chrome around it localize.

```jsx
<ChangelogEntry
  bullets={["Added `/cd` command to move a session to a new working directory", "Fixed footer hints not showing for users with a custom statusline"]}
  counts={{ add: 1, fix: 1, imp: 0, chg: 0, oth: 0 }}
  source={{ name: "anthropics/claude-code", url: "https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md" }}
/>
<ChangelogEntry bullets={entry && entry.b} counts={entry && entry.c} labels={t.changelogLabels} />
```

- Bullets render minimal inline markdown only: `` `code` ``, `**bold**`, `[text](url)`, bare URLs. Never feed it arbitrary HTML or a full markdown document.
- Counts come from the build (`site/scripts/build-changelog.js` leading-verb classification) — never hand-write them.
- Null/empty `bullets` renders the calm "no entry" state; pass `labels.missing`/`labels.missingBody` to localize it. The copy states the entry is **absent** — it must not claim the release was "skipped" (the snapshot can't know whether upstream skipped the number or just hasn't published yet).
- zh pack sets `wordFirst: true` ("新增 3" not "3 新增") and a `verbatimNote`/`mtNote` footnote naming the originals as authoritative.
- The optional `actions` slot renders in the meta row (right side, before the source link) — controls and identity chips belong with the entry's chrome, never as a stacked row above it. The site passes an icon-only `languages` toggle button here on the version page (brand color = translated view "on", faint = originals; `title` names the target view, `aria-pressed` carries state), and the clickable `VersionChip` in the compare-span cards; en locale passes no toggle. No text label on the toggle — the icon IS the control.
- Don't color-code bullets with the diff palette — diff colors mean payload insert/delete/change, not release-note categories.
