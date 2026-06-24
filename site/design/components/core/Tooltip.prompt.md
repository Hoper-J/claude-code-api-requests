**Tooltip** — lightweight hover/focus popover that gives a terse label the one line of context it needs (a status badge, an abbreviated chip). Light card surface + pop shadow; reveals on hover and on keyboard focus.

```jsx
<Tooltip tip="MCP hadn't finished connecting when this version was captured — a capture-time state, not a removal.">
  <Badge tone="accent">MCP not connected</Badge>
</Tooltip>
```

- Wrap the trigger; the wrapper is `inline-flex` so it hugs the child.
- `placement="bottom"` when the trigger sits near the top of the viewport (avoids clipping above).
- Empty `tip` renders the child bare — safe to pass a maybe-empty string.
- Prefer it over a native `title` when the label is cryptic on its own: discoverable, on-brand, keyboard-reachable, and visible on touch.
