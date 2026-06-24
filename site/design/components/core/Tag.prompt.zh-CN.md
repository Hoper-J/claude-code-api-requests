安静的、带发丝边框的标签，用于低强调的元数据——beta 标记、reminder 类别、"identical" 列表。比 Badge 更安静；永不带颜色。

```jsx
<Tag>interleaved-thinking-2025-05-14</Tag>
<Tag interactive onRemove={() => removeFilter(x)}>oauth-2025-04-20</Tag>
```

Props：`interactive`（hover 表面 + 指针）、`onRemove`（显示一个 mono 的 `×` 移除可供性）。Tag 内部的语料字符串：通过 `style={{ fontFamily:"var(--font-mono)" }}` 设为 mono。当标签携带 tone（add/del/mod/brand）或需要强调时，改用 Badge。
