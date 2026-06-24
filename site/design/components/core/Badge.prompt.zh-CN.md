**Badge** — 紧凑的计数/标签，其 tone 遵循 diff 语义；用于工具计数、字符增量以及行内变更标记。

```jsx
<Badge tone="neutral" mono>15 tools</Badge>
<Badge tone="add" mono>+2</Badge>
<Badge tone="del" mono>−1</Badge>
<Badge tone="accent">modified</Badge>
```

- 对任何数字/贴近语料的内容（增量、计数）使用 `mono`。
- `add`/`del`/`mod` 与 diff 调色板对应，使得一个 badge 与一行 diff 一眼看去就一致。
