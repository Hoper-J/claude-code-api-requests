**DiffLine** — one row of a build-time line diff; stack many inside a bordered well to render the system-prompt diff. Never diff in the browser — these consume precomputed rows.

```jsx
<div style={{border:'1px solid var(--line-hairline)',borderRadius:8,overflow:'hidden'}}>
  <DiffLine kind="context" showNumbers oldNo={11} newNo={11}># Tone and style</DiffLine>
  <DiffLine kind="del" showNumbers oldNo={12}>You should be concise and direct.</DiffLine>
  <DiffLine kind="add" showNumbers newNo={12}>You should be concise, direct, and to the point.</DiffLine>
</div>
```

- `kind` drives gutter glyph + color: `+` add, `−` del, `~` mod, space for context.
- Content is corpus → mono, verbatim, never localized.
