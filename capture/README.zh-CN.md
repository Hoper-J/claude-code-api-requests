# capture — 语料捕获 CLI

[English](README.md) | **中文**

跨版本抓 Claude Code 的 `--full` 请求/响应/TLS，写进本项目的 `../corpus`。

```
capture.sh                  ← 自包含包装:隔离配置 + 示例文件环境 + 写进 ../corpus
   └─ capture-version-matrix.sh   ← 引擎:列版本→安装→ccwrap 抓取→分类→汇总 manifest→断点续跑
```

## 外部依赖

- **[ccwrap](https://github.com/Hoper-J/ccwrap)**（MITM 抓包工具，抓取方式见 [Headless capture](https://github.com/Hoper-J/ccwrap#headless-capture-ccwrap-capture) 节）：通过 `npm i -g @hoper-j/ccwrap` 安装。
  - 装好后脚本自动发现（`CCWRAP_BIN` → PATH → `~/ccwrap/ccwrap` → 同级 `../ccwrap/ccwrap` → `--ccwrap`），都没有就提示安装命令然后退出。
  - npm 包覆盖 darwin/linux × arm64/amd64，其他平台从源码 `go build`。
- `npm` / `node`（早期打包成 `cli.js` 的旧版要 node 18–22）/ `jq` / `curl`。

## 一次性 setup

抓取指向**独立 config 目录**（不碰本地 `~/.claude`），需要先登录一次：

```bash
mkdir -p ~/.claude-demo-capture
CLAUDE_CONFIG_DIR=~/.claude-demo-capture claude login
```

## 捕获版本

```bash
# 加一个新版本(列表 + 数据都自动更新)
./capture/capture.sh --only "2.1.170" --refresh-versions --force --skip-preflight

# 全量
./capture/capture.sh --force --skip-preflight

# 判定逻辑变了,只重算 status(不重抓,别 --force 反复刷)
./capture/capture.sh --reclassify

# 给某版抓一个非默认模型的"变体"(overlay,不进版本轴)
./capture/capture.sh --only "2.1.170" --model "claude-fable-5[1m]" --variant --skip-preflight
#   → versions/2.1.170/variants/<model-slug>.{json,status.json}
#   → 变体 status 自动算 model_axis_diff(model/fallbacks/beta/body-keys 的差异)
#   → canonical status 的 variants[] 加索引(去重)
```

`capture.sh` 是个包装，你写在它后面的参数会原样转交给真正干活的引擎 `capture-version-matrix.sh`——引擎认的参数（`--only/--force/--registry/--npm-cache/--skip-preflight/--reclassify/--install-timeout` 等，完整列表跑 `capture-version-matrix.sh --help`）都能直接用。唯一的例外是 `--no-sanitize`，它由 `capture.sh` 自己处理（不转交引擎，作用见下文「自动脱敏」）。

## 查看新版本（watch-versions）

```bash
capture/watch-versions.sh                      # 单次轮询:npm 有缺失版本就 抓取→脱敏→刷新官方 changelog 快照→重建 data.js + changelog 数据
capture/watch-versions.sh --push               # 追加 git commit + push(含 changelog 快照;未配置 remote 时自动跳过)
capture/watch-versions.sh --install-launchd    # 生成 ~/Library/LaunchAgents 的 plist(默认每小时,带 --push)
launchctl load ~/Library/LaunchAgents/com.lineage.watch-versions.plist    # 启用定时
```

无新版本时几秒退出（npm 不可达视为瞬态，下轮重试），并发由锁防护，日志在 `corpus/_cache/watch.log`（gitignored）。changelog 快照拉取失败不影响主流程（保持已提交快照，新版本暂显"暂无条目"空态，下轮自愈），中文译文是独立环节，见 [../site/i18n/README.zh-CN.md](../site/i18n/README.zh-CN.md)。

## 自动脱敏

**每次 `capture.sh` 跑完（包括引擎中途失败）都会自动对 `../corpus` 原地跑 `../sanitize/sanitize.js`**（幂等）——新抓的 full/status/manifest 带操作者 PII,落盘即清。`--no-sanitize` 可跳过（只用于调试原始捕获，此时语料含 PII，**别 add**）。兜底闸门：仓库的 pre-commit 钩子会在暂存了 corpus 数据时跑 `sanitize.js --check`,残留即拒绝提交。**新 clone 一次性启用**：`git config core.hooksPath .githooks`。

## 示例文件环境

`../corpus/example-artifacts/` 是抓取时载入的例子（CLAUDE.md + SessionStart hook + greeter skill + `.mcp.json` 的 echo + `memory-snapshot/`）。`capture.sh` 每次自动把它放到 `/tmp/example`，memory 放到隔离 config 目录，所以重抓的捕获环境和现有语料一致。

## 隔离做了 / 没做什么

`CLAUDE_CONFIG_DIR` **去掉**操作者本地 skills/plugins/MCP/settings，**去不掉**账号级的 `account_uuid`/`device_id`/邮箱，这些由 capture.sh 收尾自动调用的 `../sanitize/` 同形掩码。

## 踩坑记录

- **npm install 超时**：较新版本打包了 ~200MB 原生二进制（Bun），慢链路下首装要 ~400s。引擎默认 `--install-timeout` 已抬到 700（给 ~400s 的安装留足冗余，npm 自带的 fetch-timeout 仍兜住真正卡死的连接），并默认复用全局缓存（`~/.npm`，重装秒级）——默认走官方 registry，不需要镜像。
- **中国大陆等访问官方 registry 缓慢的网络**：可加 `--registry <你的镜像>`（如 `https://registry.npmmirror.com`）加速安装，这是可选项，不影响抓到的语料。
- **install 1s 就 EACCES**：`~/.npm` 有 root-owned 文件 → `sudo chown -R "$(id -u):$(id -g)" ~/.npm`。
- **预检失败（"could not record /v1/messages"）**：单发试抓有时不稳定，setup 验证过就 `--skip-preflight` 跳过。
- **相对 `--root`**：会被静默 mkdir 到错位置，`capture.sh` 已用绝对路径。
