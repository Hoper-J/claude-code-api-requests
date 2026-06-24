# site — Lineage 设计系统 + 教学站

[English](README.md) | **中文**

**布局：runtime / design 两分**——`public/` 是可直接发布的部署根（Cloudflare Pages 的 publish dir 指它即可，入口在 `/`）；`design/` 是设计系统源（不部署）。设计全貌读 [design/DESIGN.zh-CN.md](./design/DESIGN.zh-CN.md)。

```
site/
├── public/                    # ← 部署根目录
│   ├── index.html             # 站点入口(/),favicon=品牌 mark
│   ├── App.jsx · kit-lib.jsx · locales.jsx
│   ├── data.js                # 生成物(gitignored):node site/scripts/build-data.js corpus
│   ├── data/                  # 生成物(gitignored):--emit-json 的静态 JSON API(v/*.json + index/latest)
│   ├── changelog-data.js      # 生成物(gitignored):官方 changelog 快照 → 逐字 bullets + 分类计数
│   ├── changelog-zh.js        # 生成物(gitignored):校对译文映射 → 按版本数组(null=回退英文)
│   ├── styles.css + tokens/   # 设计 token(oklch,light/dark)
│   ├── assets/                # 品牌 SVG + 自托管 woff2 字体(无 Google Fonts 依赖)
│   ├── vendor/                # 自托管 React + Babel(production min,零 CDN 依赖)
│   └── _headers               # CF Pages 缓存契约(/data/v/*、字体、vendor immutable;index/latest 5min)
├── design/                    # ← 设计源(不部署)
│   ├── DESIGN.md              # 设计指南(三声部字体模型、内容铁律、生产化路线 §7)
│   ├── SKILL.md               # Claude Code Agent-Skill(lineage-design)
│   ├── components/            # 组件源(每个 jsx + d.ts + 中英 prompt.md;每组一张 *.card.html 演示卡)
│   └── foundations/           # 设计规范卡(引 ../../public/styles.css)
├── i18n/                      # changelog 中文译文映射(按英文原文寻址,增量;见其 README)
└── scripts/                   # node 无依赖构建:build-data.js(自带 PII gate)
                               #   + build-changelog.js + build-changelog-zh.js
```

## 启动网站

```bash
./serve.sh            # 数据过期自动重建 → 服务 site/public → 自动开浏览器(http://localhost:4173/)
PORT=8080 ./serve.sh  # 自定义端口(被占用时自动顺延)
./serve.sh --no-open  # 不开浏览器(CI/agent)
```

与 Cloudflare Pages 的发布目录同构，本地 URL 形态等同线上。React/Babel 与字体自托管（`public/vendor/`、`public/assets/`）。

## 离线单文件产物生成

```bash
node site/scripts/build-offline.js   # → claude-code-api-requests-offline.html (仓库根, ~4MB)
```

将整站压成一个离线的 HTML，双击打开不需要联网。

## 部署（Cloudflare Pages）

- **Build command**: `node site/scripts/build-data.js corpus --emit-json site/public/data && node site/scripts/build-changelog.js && node site/scripts/build-changelog-zh.js`
- **Publish directory**: `site/public`
- **Custom domain**: `api-requests.cc`（Pages → Custom domains 绑定；`index.html` 已内置
  `canonical`/og 指向主域，`<项目>.pages.dev` 不会与主域分裂收录）。
- 数据更新 = push 更新后的 corpus（含 changelog 快照）→ Pages 构建期重新生成 → `/data/latest.json` 5 分钟内全网生效。
- changelog 构建完全离线（读已提交的 `corpus/changelog/CHANGELOG.md` 快照与 `site/i18n/` 映射，不依赖网络）。

## 约束 / 已定决策

- 语料入库前做好掩码处理。
- **TLS/ja3/ja4 暂不展示**：语料中已假名化（`<ja3#N>` 组标签；`clienthello_hex` 仅留长度），UI 一律忽略。
- 主推理 vs quota 探针（`is_main_inference`/`is_quota_probe`）：本语料全部重捕获为主推理，探针不展示。

## 可展示的维度（边界见 ../corpus/findings.zh-CN.md）

- 跨版本 diff `request.body`（system prompt 分节 diff / tools 增删改 / 注入上下文）。
- **MCP 承载**：内联 2.0.66–2.1.68 → 2.1.69 起 ToolSearch 延迟（工具名进 deferred 枚举、不内联 schema）；2.1.153 起 MCP 改异步连接，工具是否出现在首请求是**采集竞态**、非版本边界（见 findings）。
- 自定义文件首现边界：CLAUDE.md 2.0.0 / hook 2.0.0（2.0.17–2.0.29 回归窗口）/ skill 2.0.9 / MCP 2.0.66 / memory 2.1.59。
- 模型链 sonnet-4-5 → … → opus-4-8、max_tokens 32k→64k（2.1.77）、beta 集演进、模型轴变体（2.1.170 ⎇ fable-5）。

## 开发注意

- 演示卡与站点共用同一套原语：`design/` 下的 `*.card.html` 直接加载 `../../../public/kit-lib.jsx`——kit-lib 是运行时唯一真理，`design/components/*.jsx` 是它的 1:1 可读镜像（改任一侧必须同步另一侧，d.ts/prompt.md 随之更新）。
- Babel standalone 把所有 `text/babel` 脚本放在**同一作用域**执行：卡片内联脚本里不要 `const { Button } = window` 解构（与 kit-lib 的顶层函数声明重名报错），直接用全局组件名即可。
