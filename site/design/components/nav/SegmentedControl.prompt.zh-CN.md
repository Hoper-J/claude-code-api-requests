**SegmentedControl** — 紧凑的药丸形分段控件，适用于少量选项之间的切换；是 Lineage 语言与主题切换器的所在处。

```jsx
<SegmentedControl options={[{value:'en',label:'EN'},{value:'zh',label:'中文'}]} value={locale} onChange={setLocale} />
<SegmentedControl size="sm" options={[
  {value:'light', icon: sun, title:'Light'},
  {value:'dark', icon: moon, title:'Dark'},
]} value={theme} onChange={setTheme} />
```

- 切换 locale 时必须保留当前的版本/diff 选择（仅做路由切换）。
- 在页眉中使用 `sm`；icon 是可选的 Lucide 节点。
