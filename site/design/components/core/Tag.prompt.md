Quiet hairline-bordered label for low-emphasis metadata — beta flags, reminder kinds, "identical" lists. Quieter than Badge; never colored.

```jsx
<Tag>interleaved-thinking-2025-05-14</Tag>
<Tag interactive onRemove={() => removeFilter(x)}>oauth-2025-04-20</Tag>
```

Props: `interactive` (hover surface + pointer), `onRemove` (shows a mono `×` remove affordance). Corpus strings inside a Tag: set mono via `style={{ fontFamily:"var(--font-mono)" }}`. Use Badge instead when the label carries tone (add/del/mod/brand) or needs emphasis.
