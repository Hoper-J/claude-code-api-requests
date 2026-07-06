<div align="center">

# claude-code-api-requests

[English](README.md) | **中文**

[![gates](https://github.com/Hoper-J/claude-code-api-requests/actions/workflows/gates.yml/badge.svg)](https://github.com/Hoper-J/claude-code-api-requests/actions/workflows/gates.yml) [![license](https://img.shields.io/github/license/Hoper-J/claude-code-api-requests)](LICENSE)

**在线访问：[api-requests.cc](https://api-requests.cc)**

![时间线视图](assets/lineage-timeline.png)

</div>

一直都很好奇 Claude Code 这样的一个行业标杆级产品是怎么处理和组织上下文的，进行了一番探索后有了当前项目的分享，你可以在这里看到 2.* 版本后 Claude Code 默认请求的变化。它们确实很有趣，比如：

- CLAUDE.md、memory、hook 输出、skill 列表，这些是怎么被组织在请求体中的（[结构 →](https://api-requests.cc/#/zh/anatomy)）
- 官方提到的使用 `ToolSearch` 减少 MCP 的上下文占用，实际在哪个版本引入？实际表现是什么？（[完整推演 →](corpus/findings.zh-CN.md)）
- Fable-5 相对于 Opus-4-8 在 System 块中 Harness 的变更，以及新增的 Communicating with the user 部分（[2.1.170 Opus-4-8 vs Fable-5 →](https://api-requests.cc/#/zh/diff/2.1.170/2.1.170@claude-fable-5-1m)）

## 快速访问

访问[在线版](https://api-requests.cc)，或者克隆后跑 `./serve.sh`：

```bash
git clone https://github.com/Hoper-J/claude-code-api-requests && cd claude-code-api-requests
./serve.sh        # → http://localhost:4173/(数据自动构建,浏览器自动打开)
```

也可以直接打开根目录的 `claude-code-api-requests-offline.html`。

## 怎么抓 / 加新版本

`capture/` 里有一套脚本，运行后会直接把语料写进 `corpus/`（需要 [ccwrap](https://github.com/Hoper-J/ccwrap)，安装：`npm i -g @hoper-j/ccwrap`，需要额外登录一次，详见 [capture/README.zh-CN.md](capture/README.zh-CN.md)）：

```bash
./capture/capture.sh --force --skip-preflight                       # 全量重抓
./capture/capture.sh --only "2.1.170" --refresh-versions --force --skip-preflight    # 加单版本
```

### 脱敏

`corpus/` 数据文件由 `sanitize/sanitize.js` **同形掩码**（具体见 [sanitize/README.zh-CN.md](sanitize/README.zh-CN.md)）：metadata.user_id（`account_uuid`/`device_id`/`session_id`）、操作者邮箱、本机路径、会话 uuid 头、TLS 指纹。Authorization 在抓取时由 ccwrap 脱敏。

## CLI 总览

| 命令 | 作用 | 详细文档 |
|---|---|---|
| `./serve.sh [--no-open]`（`PORT=` 可改端口） | 一键本地预览 | [site/README.zh-CN.md](site/README.zh-CN.md) |
| `capture/capture.sh …` | 抓取（**自动脱敏**），可用 flag：`--only`/`--force`/`--reclassify`/`--variant --model`/`--help` | [capture/README.zh-CN.md](capture/README.zh-CN.md) |
| `capture/watch-versions.sh [--push\|--install-launchd]` | 轮询 npm 新版本：抓取→脱敏→刷新 changelog 快照→重建数据与离线产物 | [capture/README.zh-CN.md](capture/README.zh-CN.md) |
| `node sanitize/sanitize.js [--check]` | 脱敏，`--check` 只检不改 | [sanitize/README.zh-CN.md](sanitize/README.zh-CN.md) |
| `node site/scripts/build-data.js corpus [--emit-json site/public/data]` | 语料 → `data.js` + 静态 JSON API，自带 PII 检测 | [site/README.zh-CN.md](site/README.zh-CN.md) |
| `node site/scripts/build-changelog.js` | 官方 changelog 快照 → `changelog-data.js` | [corpus/changelog/README.zh-CN.md](corpus/changelog/README.zh-CN.md) |
| `node site/scripts/build-changelog-zh.js [--status\|--missing\|--check\|--apply\|--apply-list]` | 中文译文管线（agent 接口） | [site/i18n/README.zh-CN.md](site/i18n/README.zh-CN.md) |
| `node site/scripts/build-offline.js` | 离线阅读界面 `claude-code-api-requests-offline.html` | [site/vendor/README.zh-CN.md](site/vendor/README.zh-CN.md) |

## 一些说明

- `corpus/` 是 Claude Code CLI 实际发出的 API 请求的**存档**，其中的系统提示、工具定义等内容由 Anthropic 创作并享有相应权利，在此仅作**教育与研究**用途呈现。
- 语料基线（2.0.0–2.1.201，含每个版本及其钉定模型变体）在同一天、同一环境中一次性捕获，此后的新版本随发布逐个补充。基线内的跨版本差异反映的是版本本身的变化，而非采集日期带来的漂移。
- `corpus/changelog/` 是官方 `anthropics/claude-code` CHANGELOG.md 的快照，对应译文为构建期生成的辅助内容，以英文原文为准。
- 本仓库的 MIT 许可证只覆盖本仓库的代码、构建管线、站点实现与文档编排，不对语料内容主张任何权利。
- 权利方如对任何内容有异议，提交 issue 即移除。
- 自托管字体（Newsreader / Hanken Grotesk / JetBrains Mono）为 SIL OFL 1.1，许可文本见 [site/public/assets/fonts/LICENSE-OFL.md](site/public/assets/fonts/LICENSE-OFL.md)。
