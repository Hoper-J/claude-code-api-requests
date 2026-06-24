# sanitize — 语料脱敏

[English](README.md) | **中文**

使用方式：

```bash
node sanitize/sanitize.js            # 原地脱敏(full/status/variants/manifest)
node sanitize/sanitize.js --check    # 只检查不改写;有残留 PII → exit 1(CI/提交闸门)
```

## 处理矩阵

| PII | 位置 | 处理 | 处理后形态 |
|---|---|---|---|
| API key | `request.headers.Authorization` | 抓取时由 ccwrap 脱敏 | `Bearer sk-ant-‹redacted 108 chars›` |
| 账号/设备/会话标识 | `request.body.metadata.user_id`（旧版不可解析 string；新版 JSON-string 含 `device_id`/`account_uuid`/`session_id`） | **同形掩码**：保留 key 顺序与原始长度 | `<user_id>(159 chars)` / `{"device_id":"<device_id>(64 chars)",…}` |
| 操作者邮箱 | `messages[*]` 的 `# userEmail` 块 | 占位符替换。但`<noreply@anthropic.com>` 保持不变 | `<email>` |
| 本机路径 | `meta.claude_bin`、`status.claude_bin`、`manifest.ccwrap`、system/messages 里的 memory 路径 | 替换本地目录前缀（`os.homedir()`） | `~/.claude-demo-capture/…/memory/MEMORY.md` |
| 会话/请求 uuid | 请求头 `X-Claude-Code-Session-Id` / `X-Client-Request-Id` | 掩码 | `<masked>(36 chars)` |
| 注入的捕获日期 | `Today's date …` 且**值等于该版捕获日**（从同目录 status.json 读取）——短语锚定 + 日期比对双保险：语料作者写的固定示例日期（如旧版 env 说明里的 `Today's date: 2025-07-01`）与知识截止、beta 名一律不碰 | 占位符替换 | `Today's date is <date>.` |
| 捕获时间戳 | `status.captured_at`、`manifest.generated_at/started_at`（秒级=操作者活动模式） | 截断到天（不入 diff） | `2026-06-11` |
| TLS 指纹 | `tls.ja3`/`ja4`/`peetprint`（全语料各 6 个去重值=6 个栈分组）、`status` 顶层 `ja3`/`ja4`、`manifest.tls_groups` 的 key | 占位符替换 | `<ja3#1>`…`<ja3#6>` |
| TLS 原始字节 | `tls.clienthello_hex`（含每连接唯一的 client random/key share，每次捕获都是不同值） | 按长度掩码 | `<clienthello_hex>(1034 chars)` |
| 抓取日志 | `install.log` / `capture.stderr` / `claude-wrapper.sh` | 不处理，**保持 gitignore**（含本机路径） | 不入库 |

`corpus/changelog/` 是官方 CHANGELOG.md 快照，跳过处理。
