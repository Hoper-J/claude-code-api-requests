# 语料数据结构

[English](SCHEMA.md) | **中文**

每个版本一个目录 `versions/<v>/`，含 `full.json`（抓取产物）+ `status.json`（派生索引）；顶层 `manifest.json` 汇总。

## `full.json` — 单次请求/响应/TLS

```jsonc
{
  "tls": {                      // TLS 栈指纹 —— 已假名化为组标签(见 ../sanitize/)
    "ja3": "<ja3#1>", "ja4": "<ja4#1>", "peetprint": "<peetprint#1>",
    "clienthello_hex": "<clienthello_hex>(1034 chars)"   // 原始字节含每连接唯一值,只留长度
  },
  "request": {
    "method": "POST",
    "host": "api.anthropic.com",
    "path": "/v1/messages?beta=true",
    "headers": { … },           // 凭据已脱敏(Authorization → Bearer sk-ant-‹redacted›)
    "body": { … },              // ★ 真正的 API 请求体,见下
    "body_encoding": "json"
  },
  "response": {
    "status": 200,
    "headers": { … },
    "body": "event: message_start…",   // SSE 字符串 / JSON / raw
    "body_encoding": "sse" | "json" | "raw" | "absent"
  },
  "meta": { "schema_version": 1, "claude_bin": "…", "unmasked": false, "notes": [] }   // captured_at 在 status.json,不在 meta
}
```

### `request.body`（展示的核心对比对象）
Claude Code 发给 `/v1/messages` 的真实 payload:
- `model` — 该版本默认模型（`claude-sonnet-4-5` → … → `claude-opus-4-8`）。
- `system` — system prompt（string 或 block 数组；Anthropic 的 agent 指令，**不含** CLAUDE.md/skill 等自定义文件——那些在 `messages[]`/`tools[]`）。
- `tools[]` — 工具定义。**2.1.x 把 MCP 工具延迟**：`tools[]` 只有内置 + `ToolSearch`，真正的 MCP 名在 system/messages 的 "deferred tools" 提示里（早期版本则把完整 schema 内联进 `tools[]`）——这是个关键的跨版本演进维度。
- `messages[]` — 对话；**hook 注入、CLAUDE.md 内容**常出现在这里。
- `max_tokens` — `1` = quota 探针（辅助调用），大值 = 主推理。

## `status.json` — 每版索引

```jsonc
{
  "version": "2.1.100", "result": "ok",
  "regime": "js" | "native",
  "model_in_request": "claude-opus-4-6",
  "http_status": 200,
  "ja3": "<ja3#1>", "ja4": "<ja4#1>",      // 假名化组标签(与 full.json / manifest 同映射)
  "system_blocks": 4, "tools_count": 10,
  "is_quota_probe": false,        // ★ true = 这版只抓到 quota 探针(主推理被 abort)
  "is_main_inference": true,      // ★ = (not is_quota_probe);true = 真主推理
  "captured_at": "…", "duration_seconds": 50, "error": ""
}
```

筛选要点：`is_main_inference==true` 是真请求；`is_quota_probe==true` 是辅助配额探针（主推理未成功落地时的占位：单条 content 为 `"quota"`、`max_tokens==1`）。计数随抓取而变，以 `manifest.json` 的 `.counts` 为准（当前语料**全部为主推理、0 探针**）。

## `manifest.json` — 汇总

```jsonc
{
  "counts": { "total":N, "ok":N, "fail":0, "main_inference":N, "auxiliary":0 },   // 形状示意,实数以文件为准
  "auxiliary_captures": [ {version, model, http} ],   // 当前为空;有探针时才有条目
  "tls_groups": { "<ja3#1>": ["2.0.0","2.0.1",…] },   // ★ 哪些版本共享同一 TLS 栈(key 为假名化组标签)
  "versions": ["2.0.0", "2.0.1", … ]   // 按 semver 升序,末项即最新捕获版
}
```

## 模型变体（overlay，非新版本）

某个版本可以有非默认模型的"变体"样本，挂在该版本下、**不进版本轴**:

```
versions/2.1.170/
├── full.json / status.json                    # canonical:默认 opus-4-8[1m]
└── variants/
    ├── claude-fable-5-1m.json                  # 变体 full.json(pin claude-fable-5[1m])
    └── claude-fable-5-1m.status.json           # 变体元数据 + model_axis_diff
```
- canonical 的 `status.json` 有 `"variants": ["claude-fable-5-1m"]` 索引；
- 变体 status 有 `base_version` / `pinned_model` / `is_default:false` / **`model_axis_diff`**（预先算好的"换模型只动这几处"清单——UI 据此**高亮模型差异、灰掉时序噪声**，别用原始 diff）；
- 用途：在版本页做"模型 toggle"（默认 ⇄ 变体），展示**模型轴 diff**，和 timeline 的**版本轴 diff** 正交。

## PII 字段
语料里的 PII（`metadata.user_id`、`# userEmail` 块、本机路径、会话头、捕获日期、TLS 指纹）已由 `../sanitize/sanitize.js` 占位脱敏处理：`<user_id>(159 chars)`、`<email>`、`<ja3#N>`。具体规则见 [../sanitize/README.zh-CN.md](../sanitize/README.zh-CN.md)。

**新抓的版本会重新带入原始值，所以提交前必须重跑 sanitize 清洗。**
