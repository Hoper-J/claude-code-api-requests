**ToolCard** — expandable card for one tool definition; use in the single-version explorer (tool list) and in compare (with a `change` marker).

```jsx
<ToolCard name="Bash" description={desc} schema={inputSchema} />
<ToolCard name="WebSearch" change="added" schema={schema} defaultOpen />
<ToolCard name="NotebookEdit" change="removed" description={desc} />
```

- Collapsed shows name + first line of description; expanded reveals full description and a dense `input_schema` CodeBlock.
- `change` adds a left accent + badge; `removed` strikes the name and dims the card.
- All payload text is mono and verbatim — never translate it.
- The change badge words and the nested schema CodeBlock buttons are chrome — pass `changeLabels={{added:t.added, removed:t.removed, modified:t.modifiedLabel}}` and `labels={t.code}` so they localize.
