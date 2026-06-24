**DeltaSummary** — renders the build-emitted `change_delta` into a localized "what changed" line; this is the teaching spine of the timeline. Pass a locale label pack to translate without touching the data.

```jsx
<DeltaSummary delta={{ tools_added:['WebSearch'], tools_modified:['Bash'], system_chars_delta: 1284 }} />
<DeltaSummary delta={{ body_keys_added:['tool_choice'], system_blocks_changed:{ from:3, to:4 } }} />
<DeltaSummary delta={delta} labels={zh.delta} tone="editorial" />
```

- Never accepts a prose string — only the structured delta. Words live in `labels`.
- `tone="editorial"` for version headers (serif, large); `inline` for dense timeline rows.
- Badges follow diff semantics; numbers format per the active locale.
- `body_keys_added/removed` (a NEW top-level request field appeared/vanished) and `system_blocks_changed` (system block count) are the structural tripwires — they surface evolution the named-field deltas would otherwise miss.
