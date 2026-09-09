**DeltaSummary** — renders the build-emitted `change_delta` into a localized "what changed" line; this is the teaching spine of the timeline. Pass a locale label pack to translate without touching the data.

```jsx
<DeltaSummary delta={{ tools_added:['WebSearch'], tools_modified:['Bash'], system_chars_delta: 1284 }} />
<DeltaSummary delta={{ body_keys_added:['tool_choice'], system_blocks_changed:{ from:3, to:4 } }} />
<DeltaSummary delta={delta} labels={zh.delta} tone="editorial" />
```

- Never accepts a prose string — only the structured delta. Words live in `labels`.
- `tone="editorial"` for version headers (serif, large); `inline` for dense timeline rows.
- Badges follow diff semantics; numbers format per the active locale.
- `system_sections_added/removed` name the level-1 (`# …`) sections that appeared or vanished in the system prompt — the same section grammar as the compare view. The timeline row shows counts only (`+2 sections` / `−13 sections`, the same grammar as tools); the explorer and compare views print each heading verbatim — so a dropped section is not just a character count.
- `reminders_moved` (a reminder kind that survived but changed position, shown as `⇄ kind`) and `reminder_blocks_changed` (`<system-reminder>` block count) surface relocation — a context block moving between turns is a change, not a no-op.
- `body_keys_added/removed` (a NEW top-level request field appeared/vanished) and `system_blocks_changed` (system block count) are the structural tripwires — they surface evolution the named-field deltas would otherwise miss.
