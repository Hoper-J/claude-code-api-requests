**Tabs** — underline tab bar for switching panels inside one view (System prompt / Tools / Metadata on the explorer).

```jsx
<Tabs items={[
  { id:'system', label:'System prompt' },
  { id:'tools', label:'Tools', count: 15 },
  { id:'meta', label:'Metadata' },
]} value={tab} onChange={setTab} />
```

- Active tab gets a sapphire underline + count pill highlight. Sentence-case labels.
