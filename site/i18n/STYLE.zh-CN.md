# changelog 翻译规范（EN → 简体中文，开发者受众）

[English](STYLE.md) | **中文**

给执行翻译的 agent 的完整约束。`--apply` 的 lint 闸门会机器强制其中的硬规则，其余靠本文档保证一致性。

## 硬规则（lint 强制，违反即整单被拒）

1. 行内代码段（反引号包裹，如 `` `--resume` ``）**逐字保留**，反引号本身也保留。
2. URL **逐字保留**。
3. `**` 加粗标记数量与原文一致（标记内文字可译，标记数不变）。
4. **中文语境内的分隔用全角**：贴着中文的半角 `,` `;` 会被拒绝（码段/双引号字面量/URL 内除外）。

## 标点细则

- 句内分隔：`，` `；` `：`；句末 `。`；枚举用 `、`；括号 `（）`；破折号 `——`。
- **拉丁词串之间的句内分隔同样用全角**:"…的 glob，deny 规则…"、"`done/total`；peek 会显示…"——判断标准是它在中文句子里起分隔作用，而不是紧邻字符是什么。
- **技术字面量保持半角，永不转换**：码段内的 `,`/`;`（如 Vim 的 `` `,` `` 键）、`OSC 9;4` 这类转义序列号、数字千分位 `100,000`、版本/坐标等数字对。
- 双引号内的**界面字面量原样保留**（含其原有半角标点），如 "esc to interrupt"、"(no content)"——它们是用户屏幕上的原文，引号用直引号 `"`。
- URL 后紧跟中文标点没问题（渲染器与 lint 都会在全角字符处截断 URL）。

## 逐字保留（不译）

- CLI 标志/命令：`--resume`、`claude agents`、`/model`、`/plugin` 等（通常已在反引号里）。
- 环境变量、settings 键名、工具名（Bash/Read/Edit/WebFetch/SendMessage/ToolSearch/EnterWorktree…）。
- 产品/技术名：Claude Code、Claude、Opus/Sonnet/Haiku/Fable、Bedrock、Vertex、Foundry、VS Code、JetBrains、IntelliJ、WSL、Windows Terminal、tmux、PowerShell、OAuth、OTEL、MCP、MCPB、SDK、API、IDE、Esc、Ctrl+O、SIGTERM、SIGKILL、EAUTH、errno、emoji、OneDrive、npm、git、worktree（Claude 功能）、worker、shell、token。
- 行首方括号范围标签逐字保留，如 `[VSCode]`。

## 术语表（全集一致）

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

注意区分：**dispatch=派发**（派任务给 agent）vs **schedule=调度**（cron/定时），**worktree**（Claude 功能，保留原文）vs **working tree**（git 概念，译"工作树"）。

## 句式

- "Fixed …" → "修复……的问题"（或同义自然句式）；"Added …" → "新增……";"Improved …" → "改进……"；"Reduced …" → "降低……"；"Removed …" → "移除……";"X now does Y" → "X 现在会 Y"。
- 简洁技术语域；不加注释、不扩写、不省略信息；原文分号/破折号结构尽量保形。
- 数字、版本号、单位原样（30 秒、5 Hz、~30-50ms 可保留原格式）。

## 输出协议（批量翻译时）

- 输入：JSON 数组文件（N 条英文）。
- 输出：**JSON 数组，恰好 N 条中文字符串，下标 1:1 对齐**——第 i 条译文对应第 i 条原文。
- 不要 null、不要对象、不要多余字段，UTF-8。
- 写完自检：条数相等，逐条确认源里每个反引号段/URL 在译文中逐字出现，`**` 计数一致，中文分隔全角。
