**DeltaSummary** —— 把构建期生成的 `change_delta` 渲染成一行本地化的"改了什么"；这是时间线的教学主线。传入一个语言标签包即可在不触碰数据的前提下完成翻译。

```jsx
<DeltaSummary delta={{ tools_added:['WebSearch'], tools_modified:['Bash'], system_chars_delta: 1284 }} />
<DeltaSummary delta={{ body_keys_added:['tool_choice'], system_blocks_changed:{ from:3, to:4 } }} />
<DeltaSummary delta={delta} labels={zh.delta} tone="editorial" />
```

- 从不接受散文字符串 —— 只接受结构化的 delta。文字存放在 `labels` 中。
- 版本标题用 `tone="editorial"`（衬线、大号）；密集的时间线行用 `inline`。
- 徽章遵循 diff 语义；数字按当前生效的 locale 格式化。
- `system_sections_added/removed` 点名 system 提示词中出现/消失的一级（`# …`）小节，与 compare 视图同一套小节语法。时间线行只显示计数（`+2 个小节` / `−13 个小节`，与工具同一套语法）；explorer 与 compare 视图逐条原样列出标题 —— 被删掉的小节不再只是一个字符数。
- `reminders_moved`（种类仍在但位置变了，显示为 `⇄ 种类`）与 `reminder_blocks_changed`（`<system-reminder>` 块数）用于暴露迁移 —— 上下文块在轮次之间搬家是一次变更，不是无事发生。
- `body_keys_added/removed`（出现/消失了一个**新的顶层请求字段**）与 `system_blocks_changed`（system 块数量变化）是结构性触发器 —— 它们会暴露按字段命名的 delta 否则会漏掉的演进。
