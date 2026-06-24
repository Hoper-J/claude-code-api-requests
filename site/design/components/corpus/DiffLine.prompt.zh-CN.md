**DiffLine** —— 构建期行级 diff 的一行；把多行堆叠在带边框的井槽内即可渲染系统提示的 diff。切勿在浏览器中做 diff —— 这些组件消费的是预先计算好的行。

```jsx
<div style={{border:'1px solid var(--line-hairline)',borderRadius:8,overflow:'hidden'}}>
  <DiffLine kind="context" showNumbers oldNo={11} newNo={11}># Tone and style</DiffLine>
  <DiffLine kind="del" showNumbers oldNo={12}>You should be concise and direct.</DiffLine>
  <DiffLine kind="add" showNumbers newNo={12}>You should be concise, direct, and to the point.</DiffLine>
</div>
```

- `kind` 决定槽沟字形 + 颜色：`+` 新增、`−` 删除、`~` 修改、空格表示上下文。
- 内容来自 corpus → 等宽、逐字、永不本地化。
