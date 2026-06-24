# changelog translation style guide (EN → Simplified Chinese, developer audience)

**English** | [中文](STYLE.zh-CN.md)

The full set of constraints for the agent doing the translation. The lint gate behind `--apply` machine-enforces the hard rules; the rest is held consistent by this document.

## Hard rules (lint-enforced; a violation rejects the whole order)

1. Inline code spans (backtick-wrapped, e.g. `` `--resume` ``) are **kept verbatim**, backticks included.
2. URLs are **kept verbatim**.
3. The number of `**` bold markers matches the original (text inside a marker may be translated, the marker count doesn't change).
4. **Separators inside Chinese context use full-width**: a half-width `,` `;` touching Chinese is rejected (except inside code spans / double-quoted literals / URLs).

## Punctuation details

- In-sentence separators: `，` `；` `：`; sentence end `。`; enumeration `、`; brackets `（）`; em-dash `——`.
- **Separators between Latin word-runs also use full-width** inside a Chinese sentence: `"…的 glob，deny 规则…"`, `"`done/total`；peek 会显示…"` — the test is whether it acts as a separator in the Chinese sentence, not what characters happen to be adjacent.
- **Technical literals stay half-width, never converted**: `,`/`;` inside code spans (e.g. Vim's `` `,` `` key), escape-sequence numbers like `OSC 9;4`, thousands separators `100,000`, version/coordinate number pairs.
- **Interface literals inside double quotes are kept as-is** (including their original half-width punctuation), e.g. `"esc to interrupt"`, `"(no content)"` — they're the exact text on the user's screen; use straight quotes `"`.
- A Chinese punctuation mark immediately after a URL is fine (both the renderer and the lint terminate the URL at the full-width character).

## Keep verbatim (do not translate)

- CLI flags/commands: `--resume`, `claude agents`, `/model`, `/plugin`, etc. (usually already in backticks).
- Env vars, settings keys, tool names (Bash/Read/Edit/WebFetch/SendMessage/ToolSearch/EnterWorktree…).
- Product/technical names: Claude Code, Claude, Opus/Sonnet/Haiku/Fable, Bedrock, Vertex, Foundry, VS Code, JetBrains, IntelliJ, WSL, Windows Terminal, tmux, PowerShell, OAuth, OTEL, MCP, MCPB, SDK, API, IDE, Esc, Ctrl+O, SIGTERM, SIGKILL, EAUTH, errno, emoji, OneDrive, npm, git, worktree (Claude feature), worker, shell, token.
- Line-leading bracketed scope tags kept verbatim, e.g. `[VSCode]`.

## Glossary (consistent across the whole set) — `EN 中文`

session 会话 · background session/agent 后台会话/后台代理 · subagent/sub-agent 子代理 ·
agents view agents 视图 · daemon 守护进程 · sandbox 沙箱 · permission rules 权限规则 ·
managed settings 托管设置 · enterprise 企业 · marketplace 市场 · plugin 插件 ·
skill 保留 skill · hook 钩子 · slash command 斜杠命令 · transcript 转录 ·
statusline 状态栏 · footer 页脚 · spinner 转圈/加载动画 · plan mode 计划模式 ·
auto mode 自动模式 · bypass permissions 绕过权限 · headless 无头 · IME 输入法 ·
scrollback 回滚缓冲 · checkpoint 检查点 · compact 压缩 · context window 上下文窗口 ·
thinking 思考 · voice mode 语音模式 · dispatch 派发 · schedule/cron 调度 ·
working tree（git）工作树 · attach/reattach 连接/重新连接 · quota/credits 额度 ·
rate limit 限流 · interrupt 中断 · streaming 流式输出 · fallback model 回退模型 ·
prompt cache 提示缓存 · startup 启动 · cold start 冷启动 · regression in X（X 引入的回归）

Disambiguation: **dispatch=派发** (assigning a task to an agent) vs **schedule=调度** (cron/timed); **worktree** (Claude feature, keep the original) vs **working tree** (the git concept, translated "工作树").

## Sentence patterns

- "Fixed …" → "修复……的问题" (or a natural synonym); "Added …" → "新增……"; "Improved …" → "改进……"; "Reduced …" → "降低……"; "Removed …" → "移除……"; "X now does Y" → "X 现在会 Y".
- Concise technical register; no added commentary, no expansion, no dropped information; keep the original semicolon/em-dash structure where possible.
- Numbers, version numbers, and units as-is (30 秒, 5 Hz, ~30-50ms may keep their original format).

## Output protocol (batch translation)

- Input: a JSON array file (N English entries).
- Output: **a JSON array, exactly N Chinese strings, index-aligned 1:1** — the i-th translation corresponds to the i-th original.
- No null, no objects, no extra fields; UTF-8.
- Self-check after writing: counts equal; for each entry confirm every backtick span / URL in the source appears verbatim in the translation; `**` counts match; Chinese separators full-width.
