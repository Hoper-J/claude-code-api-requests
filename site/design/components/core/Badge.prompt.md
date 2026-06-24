**Badge** — compact count/label whose tone follows diff semantics; use for tool counts, char deltas, and inline change markers.

```jsx
<Badge tone="neutral" mono>15 tools</Badge>
<Badge tone="add" mono>+2</Badge>
<Badge tone="del" mono>−1</Badge>
<Badge tone="accent">modified</Badge>
```

- Use `mono` for anything numeric/corpus-adjacent (deltas, counts).
- `add`/`del`/`mod` mirror the diff palette so a badge and a diff line agree at a glance.
