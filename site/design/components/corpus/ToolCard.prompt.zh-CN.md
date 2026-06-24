**ToolCard** —— 单个工具定义的可展开卡片；用于单版本浏览器（工具列表）以及对比视图（带 `change` 标记）。

```jsx
<ToolCard name="Bash" description={desc} schema={inputSchema} />
<ToolCard name="WebSearch" change="added" schema={schema} defaultOpen />
<ToolCard name="NotebookEdit" change="removed" description={desc} />
```

- 折叠时显示名称 + 描述的首行；展开时显示完整描述以及一个 `dense` 的 `input_schema` CodeBlock。
- `change` 会添加左侧强调条 + 徽章；`removed` 会给名称加删除线并将卡片变暗。
- 所有载荷文本均为等宽且逐字 —— 切勿翻译。
- change 徽章文字与嵌套 schema CodeBlock 的按钮属于界面装饰（chrome）—— 传入 `changeLabels={{added:t.added, removed:t.removed, modified:t.modifiedLabel}}` 和 `labels={t.code}` 使其本地化。
