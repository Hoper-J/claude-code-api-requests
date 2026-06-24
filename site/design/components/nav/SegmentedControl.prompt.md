**SegmentedControl** — compact pill group for few-way switches; the home of Lineage's locale and theme toggles.

```jsx
<SegmentedControl options={[{value:'en',label:'EN'},{value:'zh',label:'中文'}]} value={locale} onChange={setLocale} />
<SegmentedControl size="sm" options={[
  {value:'light', icon: sun, title:'Light'},
  {value:'dark', icon: moon, title:'Dark'},
]} value={theme} onChange={setTheme} />
```

- Switching locale must preserve the current version/diff selection (route swap only).
- Use `sm` in headers; icons are optional Lucide nodes.
