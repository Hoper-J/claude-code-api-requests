# corpus — Claude Code 2.x 请求语料

[English](README.md) | **中文**

```
corpus/
├── versions/<v>/full.json      # 抓取产物(请求/响应/TLS)
├── versions/<v>/status.json    # 派生索引
├── versions/<v>/variants/      # 非当前版本默认模型，比如 fable-5
├── manifest.json               # 汇总计数 + tls_groups
├── example-artifacts/          # 用于演示的示例文件(CLAUDE.md/skill/mcp/memory)
├── changelog/CHANGELOG.md      # 官方发布说明快照
└── SCHEMA.md / findings.md     # 文档说明
```

语料由 `../capture/capture.sh` 写进当前目录中的 `versions/` 和 `manifest.json`。`ccwrap` 使用 `npm i -g @hoper-j/ccwrap` 安装，具体抓取命令：

```bash
# 首次运行：隔离目录登录你自己的账号
mkdir -p ~/.claude-demo-capture
CLAUDE_CONFIG_DIR=~/.claude-demo-capture claude login

# 加一个新版本(列表 + 数据都自动更新)
../capture/capture.sh --only "2.1.170" --refresh-versions --force --skip-preflight

# 全量重抓
../capture/capture.sh --force --skip-preflight

# 重算 status(不重抓)
../capture/capture.sh --reclassify
```
