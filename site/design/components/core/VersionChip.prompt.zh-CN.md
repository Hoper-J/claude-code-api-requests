**VersionChip** — semver 导航原子；在任何引用版本的地方使用（时间线行、面包屑、compare 选择器）。

```jsx
<VersionChip version="2.1.38" status="ok" onClick={() => go('2.1.38')} />
<VersionChip version="2.0.48" status="fail" />
<VersionChip version="2.1.40" selected size="lg" />
```

- 始终以 **mono 逐字**渲染 `version` ——它贴近语料，绝不本地化。
- `status="fail"` 会让 chip 变暗并显示一个空心圆点（"no capture"）。
- `selected` 切换为蓝宝石色调 + 品牌边框，用于标示当前激活的版本。
