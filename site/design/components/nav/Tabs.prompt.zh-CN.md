**Tabs** — 用于在单个视图内切换面板的下划线标签栏（浏览器上的 System prompt / Tools / Metadata）。

```jsx
<Tabs items={[
  { id:'system', label:'System prompt' },
  { id:'tools', label:'Tools', count: 15 },
  { id:'meta', label:'Metadata' },
]} value={tab} onChange={setTab} />
```

- 当前激活的标签页会获得蓝宝石色下划线，并高亮 count 药丸。标签文字采用句首大写（sentence-case）。
