Tiny dot signaling capture status — ok (green fill), fail (hollow, faint ring — calm, not alarming), aux (amber fill), active (sapphire fill) — used on timeline rows, version chips, and headers.

```jsx
<StatusDot status="ok" />
<StatusDot status="fail" />
<StatusDot status="aux" />
<StatusDot status="active" pulse />
```

Props: `status` ("ok" | "fail" | "aux" | "active"), `size` (px, default 8), `pulse` (soft ring for the active state). Pure presentation — pair it with a text label; never the only indicator of state.
