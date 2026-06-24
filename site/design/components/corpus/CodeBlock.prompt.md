**CodeBlock** — the only correct way to render verbatim corpus (system-prompt text, pretty-printed `input_schema`); never put payload in prose.

```jsx
<CodeBlock label="System prompt · block 2" copyText={text} collapsible>
  {text}
</CodeBlock>

<CodeBlock dense copyText={JSON.stringify(schema, null, 2)}>
  {JSON.stringify(schema, null, 2)}
</CodeBlock>
```

- Always mono, sunken well, whitespace preserved. Content is **never translated**.
- `collapsible` for long system prompts; `dense` for JSON schemas.
- Pass the raw string as both child and `copyText` so copy matches what's shown.
- The copy/collapse button words are chrome — pass `labels={t.code}` from the locale pack so they localize (defaults are English).
