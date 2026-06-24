**CodeBlock** —— 渲染逐字 corpus（系统提示文本、美化打印的 `input_schema`）的唯一正确方式；切勿把载荷放进散文里。

```jsx
<CodeBlock label="System prompt · block 2" copyText={text} collapsible>
  {text}
</CodeBlock>

<CodeBlock dense copyText={JSON.stringify(schema, null, 2)}>
  {JSON.stringify(schema, null, 2)}
</CodeBlock>
```

- 始终等宽、凹陷井槽、保留空白。内容**永不翻译**。
- 长系统提示用 `collapsible`；JSON schema 用 `dense`。
- 把原始字符串同时作为子节点和 `copyText` 传入，使复制内容与显示内容一致。
- 复制／折叠按钮的文字属于界面装饰（chrome）—— 从语言包传入 `labels={t.code}` 使其本地化（默认为英文）。
