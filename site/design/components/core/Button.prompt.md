**Button** — the primary action control; use for any user-triggered action in Lineage chrome (never on corpus content).

```jsx
<Button variant="primary" onClick={openCompare}>Compare versions</Button>
<Button variant="secondary" size="sm" iconLeft={icon('copy')}>Copy</Button>
<Button variant="ghost" iconRight={icon('arrow-right')}>Next version</Button>
```

- **variant**: `primary` (sapphire, one per view), `secondary` (hairline, neutral actions), `ghost` (toolbar/inline), `danger` (destructive, rare here).
- **size**: `sm` (26px, dense toolbars), `md` (34px, default), `lg` (42px, hero CTA).
- Icons are nodes — pass a Lucide `<svg>` at 16–18px. Labels are **sentence case**, never Title Case.
