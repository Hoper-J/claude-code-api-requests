**Button** — 主要的动作控件；用于 Lineage 外壳中任何由用户触发的动作（绝不用在语料内容上）。

```jsx
<Button variant="primary" onClick={openCompare}>Compare versions</Button>
<Button variant="secondary" size="sm" iconLeft={icon('copy')}>Copy</Button>
<Button variant="ghost" iconRight={icon('arrow-right')}>Next version</Button>
```

- **variant**：`primary`（蓝宝石色，每个视图一个）、`secondary`（发丝线，中性动作）、`ghost`（工具栏/行内）、`danger`（破坏性，这里很少用）。
- **size**：`sm`（26px，密集工具栏）、`md`（34px，默认）、`lg`（42px，hero CTA）。
- 图标是节点——传入一个 16–18px 的 Lucide `<svg>`。标签用**句首字母大写（sentence case）**，绝不用 Title Case。
