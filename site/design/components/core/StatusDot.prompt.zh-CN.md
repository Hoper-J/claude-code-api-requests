微小的圆点，用于标示捕获状态 — ok（绿色填充）、fail（空心、淡淡的环——平静，而非警示）、aux（琥珀色填充）、active（蓝宝石色填充）——用在时间线行、版本 chip 以及标题上。

```jsx
<StatusDot status="ok" />
<StatusDot status="fail" />
<StatusDot status="aux" />
<StatusDot status="active" pulse />
```

Props：`status`（"ok" | "fail" | "aux" | "active"）、`size`（px，默认 8）、`pulse`（为 active 状态加上柔和的环）。纯展示——要与一个文本标签搭配使用；绝不作为状态的唯一指示。
