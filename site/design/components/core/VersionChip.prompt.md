**VersionChip** — the semver navigation atom; use anywhere a version is referenced (timeline rows, breadcrumbs, compare selectors).

```jsx
<VersionChip version="2.1.38" status="ok" onClick={() => go('2.1.38')} />
<VersionChip version="2.0.48" status="fail" />
<VersionChip version="2.1.40" selected size="lg" />
```

- Always renders `version` **verbatim in mono** — it is corpus-adjacent, never localized.
- `status="fail"` dims the chip and shows a hollow dot ("no capture").
- `selected` switches to sapphire tint + brand border for the active version.
