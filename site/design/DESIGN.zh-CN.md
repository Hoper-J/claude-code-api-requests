# Lineage —— 设计系统

> **Lineage** 的设计系统，这是一个静态教学档案，可视化展示 Claude Code CLI 的 API 请求如何随版本演进 —— 逐版本、逐条系统提示、逐个工具地呈现。

Lineage 是一个**只读、100% 静态**的教学网站。它的全部职责就是渲染一份有限、不可变的语料 —— 逐字保留的 Anthropic Messages API 请求载荷 —— 并让人们以英文和简体中文去*阅读*、*探索*、*比对*它们。这套设计系统的存在，是为了让这种阅读体验保持平静、精确、且具有档案气质。

---

## 1. Context & sources

这是一个**全新（greenfield）**的品牌。此前没有任何产品 UI、Figma 或品牌套件需要复刻 —— 这里的设计方向是原创的，源自内容本身的性质。

**给定的源材料（只读语料，并非设计资产）：**
- `../corpus/` —— 捕获到的语料（本仓库，已就地脱敏）。关键文件：
  - `manifest.json` —— 作为真相来源（source-of-truth）的版本列表（按 **semver** 排序：`2.1.9 < 2.1.10 < 2.1.100`），包含 `versions` / `failed` / `auxiliary_captures`。
  - `versions/<v>/full.json` —— 每个版本捕获到的请求/响应。教学内容存放在 `.request.body`（`system[]` 块、`tools[]` 模式、`messages[]`）。
  - `versions/<v>/status.json` —— 每个版本的元数据（`result`、`system_blocks`、`tools_count`、`http_status`、……）。
  - `example/` —— 安全的**占位项目（placeholder project）**，其注入的上下文（CLAUDE.md、MEMORY.md、`.claude/` skills、`.mcp.json`、SessionStart hook）出现在捕获到的 `messages[]` 中。
- 语料规模：整条 Claude Code `2.x` 线，从 `2.0.0` 起 —— 全部为主捕获（0 个 auxiliary、0 个 no-capture）。这个集合会随着新版本被捕获而增长；`manifest.json` 是真相来源，构建过程会从中派生出 `COUNTS`。

> 语料包含一个 `tls` 对象以及 `ja3`/`ja4` 字段。它们在本系统中**处处被刻意忽略** —— 永远不会有任何指纹识别（fingerprinting）UI。

**UI 必须渲染的内容：**
- **System prompts** —— 带有 `<system-reminder>` 标签、markdown 与实例演示的长段等宽文本。保留空白；折叠过长的小节。
- **Tool definitions** —— `name`、`description`，以及美化打印的 `input_schema`（JSON Schema）。
- **Version metadata** —— 模型、HTTP 状态、头部摘要。
- **Timeline** —— 按 semver 顺序排列的每个版本，附一行"改了什么"。
- **Diffs** —— 系统提示上的行级 add/remove；工具的 add/remove/modify。

---

## 2. The core idea: three voices

Lineage 的字体系统与站点的信息架构一一对应 —— 后者同时也是它的 **i18n 架构**：

| Voice | Family | Role | Translated? |
|-------|--------|------|-------------|
| **Editorial** | Newsreader (serif) | 教学声部、标题、"改了什么"散文 | ✅ 本地化外壳 |
| **UI** | Hanken Grotesk (sans) | 标签、按钮、元数据、导航 | ✅ 本地化外壳 |
| **Corpus** | JetBrains Mono (mono) | 逐字保留的 API 载荷 —— 系统提示、工具模式 | ❌ **从不翻译** |

如果它以 **mono 排版，那它就是研究对象**，在每种语言环境下都逐字节相同地渲染。如果它是 serif 或 sans，那它就是站点自身的编辑外壳（editorial chrome），会被本地化。这条规则能解决站点上几乎所有的设计问题。

唯一的微妙之处是 **changelog**（官方发行说明）：它是被引用的第三方散文，而非站点自己的声部。它以 sans 渲染，且 zh 语言环境提供一份经审校的译文，但 —— 与外壳不同 —— 英文原文仍保持权威地位（一键 译文/原文 切换，任何未翻译的条目都按条回退到英文），其内部的行内 `code` 段 / URL 仍保持 mono 逐字。所以它读起来像外壳那样被本地化，来源却像语料那样。语料本身（系统提示、工具模式、messages）依旧**从不翻译**。

---

## 3. Content fundamentals (copy & tone)

站点的编辑外壳（除语料*之外*的一切）遵循以下规则：

- **Voice：** 一位博学的档案员/策展人，而非营销者。平实、精确、安静而好奇。我们是在*展示*一件文物，而不是兜售任何东西。
- **Person：** 谨慎地以**"you"**称呼读者；优先使用描述性的、非人称的标签（"System prompt"、"15 tools"、"Changed since 2.0.12"）。绝不用 "we"。
- **Casing：** 处处使用 **Sentence case** —— 标题、按钮、标签。唯一的大写是**上线眉题（overline/eyebrow）**（拉开字距的大写，如 `SYSTEM PROMPT`）以及等宽元数据键名。绝不用 Title Case 按钮。
- **Numbers are facts, not decoration.** 屏幕上的每个数字都是真实的、来自语料（`15 tools`、`+1,284 chars`、`2.1.38`）。没有杜撰的统计，没有虚荣指标。
- **"What changed" is generated, never written.** 构建过程会发出一个结构化的、与语言环境无关的增量（`{ tools_added, tools_removed, system_chars_delta, model_changed }`）。UI 通过带有恰当复数处理的模板，将其渲染为一个本地化的句子。
  *渲染示例：*
  - en：`Added 2 tools · 1 modified · +1,284 chars in the system prompt`
  - en（单数）：`Added 1 tool · model changed`
  - zh：`新增 2 个工具 · 修改 1 个 · 系统提示 +1,284 字符`
- **Diff language is directional and terse：** `Added`、`Removed`、`Modified`、`Unchanged`。
- **Failures are stated plainly, never alarmingly：** "No capture for this version."。timeline 仍会显示该版本；它只是被淡化且不可交互。
- **No emoji. No exclamation marks.** 语气是档案式的平静。标点是用于行内分隔的间隔号（`·`）和用于范围的 en-dash。
- **Tense：** 文物用现在时（"This version sends 15 tools"），事件用过去时（"Removed in 2.1.0"）。

---

## 4. Visual foundations

**Overall feeling：** 一间面向代码的档案阅览室。暖色纸张、冷色墨水、发丝级细线、几乎没有阴影。它应当让人感觉像一份精美排版的技术参考，又交织着一个 git 历史查看器 —— 绝不像 SaaS 仪表盘。

- **Color & vibe.** 一个**暖色象牙白"纸张"**背景（`--paper-50`，约 `#FBF9F4`），配以**暖色近黑墨水**文本。唯一的品牌/交互色是一种**冷调、略微去饱和的蓝宝石色**（`--brand`）—— 之所以选它，是因为它能平静地衬在暖色纸张上，并能与 diff 调色板清晰区分。**琥珀色（Amber）**是用于"changed"标记与高亮的克制点缀。冷色品牌色对抗暖色中性色，是标志性的张力所在。
- **Diff is a first-class color system.** 绿色 = 新增，红色 = 删除，琥珀色 = 修改 —— 每种都带有 `text` / `surface` / `edge` / `marker` 四元组，并为两套主题分别调校。它们绝不读作"成功/错误"；它们意味着 insert/delete/change。
- **Themes.** 浅色"paper"为主。一套深色"ink"主题（暖色炭灰、象牙白文本、提亮的蓝宝石色）通过 `[data-theme="dark"]` 提供，面向开发者受众以及内容的终端亲和性。
- **Type.** Newsreader（serif，光学尺寸）用于编辑性展示与散文；Hanken Grotesk 用于 UI；JetBrains Mono 用于所有语料。慷慨的阅读行宽：散文 `68ch`，mono 载荷 `96ch`。大号展示文字用紧凑字距（`-0.02em`）；眉题用宽大写字距（`0.10em`）。
- **Spacing.** 4px 栅格。舒适但不空旷 —— 这是一个密集的阅读工具，所以纵向节奏紧凑而一致（`--space-4`/`6`/`8` 承担了大部分工作）。
- **Backgrounds.** 平整的纸张。**没有渐变、没有摄影图像、没有纹理。** 唯一的"图像"是语料本身以及版本图谱母题（version-graph motif）。代码井（Code wells）是一种略微下沉的暖色调（`--surface-well`），带内嵌发丝线。
- **Borders & cards.** 结构来自 **1px 发丝线**（`--line-hairline`），而非阴影。卡片为 `--surface-card`，带发丝线与 `--radius-3`（8px）。圆角刻意保持**低**（3–12px）—— 利落、文档感、绝不软糯如药丸，除非是真正的药丸形（chips/tags）。
- **Elevation.** 近乎平整。阴影为暖色调，且严格保留给浮层（菜单 `--shadow-md`、对话框 `--shadow-pop`）。静止状态的卡片**不投阴影**。
- **Animation.** 克制且功能性。默认 `150ms`，配 `cubic-bezier(0.2,0,0,1)` 标准缓动；面板以 `220ms` 展开。**没有弹跳、没有弹簧、没有装饰性循环。** 只有淡入淡出以及短促的高度/不透明度过渡。所有动效都尊重 `prefers-reduced-motion`。
- **Hover.** 交互表面会向暗一档纸色偏移（或获得一条发丝线）；品牌按钮转为 `--brand-hover`。链接在悬停时显示下划线。悬停时不放大。
- **Press.** 微妙地变暗至 `--brand-press`，加上 `translateY(0.5px)` —— 一种轻微的物理"落定"感。没有大幅挤压。
- **Focus.** 一道 2px 蓝宝石色焦点环，由一段纸色间隙隔开（`--focus-shadow`）—— 在两套主题上都可见，永不移除。
- **Transparency & blur.** 克制使用：粘性页头用约 85% 不透明度的纸色背景，配一点 `backdrop-filter: blur(8px)`；遮罩层用暖色墨水幕（scrim）压暗。模糊是一种外壳手段，绝不施加于语料内容。
- **Corner radii recap：** chips/inputs `3px`，buttons/badges `5px`，cards/panels `8px`，dialogs `12px`，pills `999px`。

---

## 5. Iconography

- **System：** [**Lucide**](https://lucide.dev) —— 一套干净、一致的**描边（stroke）**图标集（2px 描边、24px 栅格、圆形端点/连接），与 Lineage 的发丝线美学相契合。运行时把它用到的那少数几条路径内联为 `kit-lib.jsx` 中的 `Icon` 组件 —— 运行时不加载任何图标库。
  - **Substitution flag：** Lineage 没有自己定制的图标字体；Lucide 是选定的现成集合。如果你想要一套定制的图标语言，那是后续的事。
- **Stroke & size.** 图标在 UI 行中以 `16` 或 `18px` 渲染，在页头中以 `20px` 渲染。保持 Lucide 原生的 2px 描边；不要给描边图标填色。
- **Color.** 图标继承 `currentColor` —— 静止时为 `--text-muted`，激活时为 `--text-strong` 或 `--brand`。Diff 标记（`+` / `−`）是 **mono 中的字形（glyphs）**，而非图标，并使用 `--add-marker` / `--del-marker`。
- **Key icons in use：** `git-branch`、`git-commit`、`git-compare`、`arrow-left/right`、`chevron-right`（展开）、`copy`、`check`、`search`、`languages`（语言切换）、`sun` / `moon`（主题）、`external-link`、`link`（深链锚点）、`x`、`circle-dot`、`circle-slash`（捕获失败）。
- **No emoji. No unicode pictographs** 作为图标。间隔号 `·`、en-dash `–`，以及 diff 字形 `+ −` 是仅有的"符号"字符，全部以 mono 排版。
- **The brand mark**（`../public/assets/lineage-mark.svg`）是版本图谱字形：一条主干带两个节点，以及一条通往"changed"节点的分支。它使用 `currentColor` 与一个感知 `--bg-app` 的节点填充，因此在任一主题上都能工作。

---

## 6. Index / manifest

> **Repo layout：** 运行时/部署根目录是 **`../public/`**
> （index.html 入口在 `/`、样式、tokens、字体、应用源码、生成的 `data.js`）；
> 这个 **`design/`** 目录存放设计源（本指南、SKILL、组件、
> foundations），且**不会被部署**。摄取（ingest）流水线位于
> `../scripts/build-data.js`。演示卡片加载 `../public/kit-lib.jsx` —— 与站点运行时所用的同一套原语。

**Runtime root**（`../public/`）
- `index.html` —— 站点入口（链接 `styles.css`，启动应用；favicon = 品牌标记）。
- `styles.css` —— 全局入口（仅 import）。消费方链接此文件。
- `App.jsx` · `kit-lib.jsx` · `locales.jsx`（外加生成的 `data.js` · `changelog-data.js` · `changelog-zh.js`，已 gitignore）。

**This dir**（`design/`）
- `DESIGN.md` —— 本指南。 · `SKILL.md` —— 供 Claude Code 使用的 Agent-Skill front-matter。
- `../scripts/build-data.js` —— 语料 → `data.js` 摄取流水线（Node，无依赖）。
- `../scripts/build-changelog.js` —— 官方 changelog 快照（`../../corpus/changelog/`）→ `changelog-data.js`。
- `../scripts/build-changelog-zh.js` —— 经审校的 zh 映射（`../i18n/`）→ `changelog-zh.js`（增量式：以英文条目作内容寻址）。

**Tokens**（`../public/tokens/`）
- `fonts.css` · `colors.css` · `typography.css` · `spacing.css` · `elevation.css` · `base.css`

**Assets**（`../public/assets/`）
- `lineage-mark.svg` · `lineage-wordmark.svg` · `fonts/*.woff2`

**Foundation cards**（`foundations/`）—— Design System 标签页的样本卡片：
type（editorial / UI / corpus）、colors（paper / ink / brand / diff）、spacing（scale /
radii & elevation）、brand（logo / voice）。

**Components**（`components/`）—— 可复用原语，每个都带 `.jsx` + `.d.ts` + `.prompt.md`（+ `.prompt.zh-CN.md`），并由每组一张 `*.card.html` 样本卡演示：
- `core/` —— **Button**、**VersionChip**、**Badge**、**Tag**、**StatusDot**、**Tooltip**
- `corpus/` —— **CodeBlock**、**ToolCard**、**DiffLine**、**DeltaSummary**、**ChangelogEntry**
- `nav/` —— **Tabs**、**SegmentedControl**

**The site**（`../public/`）—— 教学站点本身，在 **en/zh** 与 **light/dark** 下完全可交互，运行在**真实的、已脱敏的语料**上：`index.html`
（启动应用）、`kit-lib.jsx`（原语的本地镜像）、`data.js`（由 `../corpus/` 生成 —— manifest 中的每个版本、去重后的块 + 工具模式 + messages、真实的相邻增量，按**最新优先**排序）、`locales.jsx`
（en + zh 外壳包）、`App.jsx`（页头、timeline、版本浏览器、compare/diff、搜索覆盖层、anatomy）、`changelog-data.js`（由 `../../corpus/changelog/` 中的官方 changelog 快照生成 —— 逐字保留的条目 + 生成的分类计数，仅限语料中的版本）、`changelog-zh.js`（由 `../i18n/changelog-zh.map.json` 生成 —— 经审校的构建期翻译，按条目英文回退；无运行时翻译）。

站点视图：
- **Timeline** —— 仅主线 ok 版本（auxiliary + no-capture 已折叠），每一行是一条结构化的"改了什么"；被隐藏的范围会显示一个"N versions not captured"缺口标记；chips/items 可点击直达对应的 Compare 小节。
- **Explorer** —— 六个标签页，分组为 **Request**（System prompt · Messages · Tools · Params）、**Response**，以及 **Changelog** —— 该版本的官方发行说明，逐字引用自 `anthropics/claude-code` 的 CHANGELOG.md。英文条目是研究对象，保持权威地位；zh 语言环境显示经审校的构建期翻译，带 译文/原文 切换（未翻译的条目按条回退到英文）。生成的摘要行（"3 added · 5 fixed" / "新增 3 · 修复 5"）以及外壳照常本地化。在官方 changelog 中缺席的版本会得到一个平静的"no entry"状态（文案绝不声称该发行被跳过 —— 快照无从得知）。Params 持有 model / max_tokens / temperature / stream / `output_config.effort` / `diagnostics` / `metadata.user_id`（已掩码） / beta 集 / `context_management`。Messages 逐字渲染，并附一个 Message 结构签名（reminder kinds · blocks · probe · cache breaks）。Response 持有 http_status / regime / 模型**回复**+ `stop_reason` / 完整 `usage` / 头部摘要。当某个版本携带模型变体（例如一次 Fable 5 捕获）时，一个 **captures** 切换可在默认 ⇄ 变体之间切换，且一个模型轴 diff 面板只高亮模型驱动的变更（与版本轴 diff 正交）。
- **Compare** —— 版本选择器在右上角（紧凑的自定义下拉）；一条粘性的 **Changes** 边栏（scroll-spy，可折叠为一个浮动按钮）为已变更的分组建立索引。Diffs：系统提示**按小节（by section）**（`# Heading` 块被归类为 added/removed/modified/unchanged，可下钻到行级 diff，可切换 unified）；工具（含某个被修改工具的 description 与 input_schema 的 before→after）；beta features；`max_tokens` / `effort`；以及**注入的消息上下文**（reminder kinds、probe、block count）。没有变更的小节会被整段省略。一个收尾的 **changelog** 小节列出所比对跨度的官方发行说明（`(from, to]`，最新优先，与 explorer 相同的 译文/原文 切换）—— 载荷 diff 与陈述的发行说明同屏呈现。基于同一基底的两个版本（一次模型轴比对，例如 `2.1.170` vs `2.1.170@claude-fable-5-1m`）同样有效。
- **Anatomy** —— 对请求体的一次性编辑性拆解，将每个部分指向其所在的标签页。

> Data note：`data.js` 是构建产物，每当拉取新版本时就从 `../corpus/` 重新生成（manifest 的 `versions`/`failed`/`auxiliary_captures` 列表是真相来源，所以最新发行总会排到顶部）。构建过程会提取每个捕获请求的 `system` 块、`tools` 模式、`messages`（带 `cache_control` ttl）、`max_tokens`、`temperature`、`stream`、`output_config.effort`、`diagnostics`、`context_management`、解析出的 `Anthropic-Beta` 集，以及响应的 `reply` / `stop_reason` / 完整 `usage`；对共享的块/工具/messages 去重；并计算相邻**主线** ok 版本之间的结构化 `change_delta`（tools/beta/reminder 的 add-remove-modify、`system_chars_delta`、`max_tokens`/`effort`/`model` 变更）。`COUNTS` 分别报告 `ok`（主捕获） / `aux` / `fail`，因此"captured"不包含 auxiliary。语料是异构的，并逐字呈现 —— 模型在演进（sonnet-4-5 → opus-4-5 → opus-4-6 → opus-4-7 → opus-4-8），`max_tokens` 在增长（在 2.1.77 从 32,000 → 64,000），beta 集在扩张，注入的上下文行也在增长（CLAUDE.md → session hook → skills → date → memory → user email → deferred tools）。
>
> **Privacy：** 注入的上下文（CLAUDE.md、MEMORY.md、`.claude/` skills、`.mcp.json`、SessionStart hook）是安全的**占位样本数据（placeholder sample data）**，因此 messages 逐字渲染。语料就地脱敏（见 `../../sanitize/`），构建过程套用形状完全相同的规则 —— 操作者主目录**前缀** → `~`（保留尾部；只匹配 `os.homedir()`，因此语料中本来就有的示例路径如 `/Users/name/My Documents` 会保留）、操作者邮箱 → `<email>`（`@anthropic.com` 是语料内容，保留）、密钥 → `<token>`、注入的捕获日期 → `<date>`（仅当该值等于该版本的捕获当天时 —— 恒定的语料示例日期会保留）—— 并把每个 `metadata.user_id` 字段掩码为 `<key>(N chars)` 占位符，例如 `<user_id>(159 chars)`（保留 id 长度，隐藏值）。头部**完整发送**（denylist + mask，而非白名单）：易变/基础设施头部被丢弃（`Request-Id`、`Date`、`anthropic-ratelimit-*`、`cf-ray`、`x-client-request-id`、`x-claude-code-session-id`、`Content-Length`、`Host`、`Connection`、`Accept-Encoding`）；认证头部（`Authorization`、`X-Api-Key`、`Cookie`）被掩码为 `<masked>(N chars)`；其余每个头部逐字（脱敏后）发送 —— 整个语料中有 19 个不同名称，在 Params → Request headers 下展示。完全忽略：`tls`。在生产环境中，`data.js` 会被惰性获取，而非内联。

> Fonts note：这三个字族都是**自托管的** —— 拉丁 `woff2` 二进制被 vendored 在 `assets/fonts/` 中（Hanken Grotesk 400–700、JetBrains Mono 400–700、Newsreader 400–700 + 斜体），在 `tokens/fonts.css` 中声明为 `@font-face` 规则，配 `font-display: swap`。运行时不依赖 Google Fonts。

---

## 7. Production notes — claude-code-api-requests

这套 UI kit 是 **claude-code-api-requests** 项目的最终展示界面（站点保留 **Lineage** 品牌名；仓库名出现在页脚）。哪些已经具备生产形态，哪些是静态构建必须替换的：

**In the kit already**
- `scripts/build-data.js` —— 完整的摄取流水线，作为可运行的 Node 脚本：
  `node scripts/build-data.js <corpusDir>` 会从 `manifest.json` +
  `versions/<v>/{full,status}.json`（+ `variants/`）重建 `data.js`。它编码了每一条已落地的规则 ——
  脱敏、头部 denylist+mask、metadata 掩码、去重池、消息形状
  检测、所有 delta 种类、变体附加 —— 并且若有 PII 残存则会大声 FAIL。
  重建后新版本会自动出现在每个视图里；无需改 UI。
  `--emit-json <dir>` 还会为 curl 用户额外写出稳定的逐版本 JSON：
  `<dir>/v/<version>.json`（+ `-<variantId>` 形式，不可变 —— 版本号就是内容
  哈希），外加短缓存别名 `<dir>/index.json` 与 `<dir>/latest.json`。
  ```
  curl -s https://<site>/data/v/2.1.170.json | jq .request.body.model
  curl -s https://<site>/data/latest.json | jq .version
  ```
  `_headers` 配对：`/data/v/*` → `max-age=31536000, immutable`；
  `/data/index.json`、`/data/latest.json` → `max-age=300`。
- 哈希路由镜像生产 URL 方案：`#/en`（timeline） ·
  `#/en/v/2.1.170`（explorer） · `#/en/diff/2.1.169/2.1.170?focus=tools`（compare，
  允许诸如 `2.1.170@claude-fable-5-1m` 的变体键） · `#/zh/anatomy`。深链、
  前进/后退以及分享出去的 URL 都会恢复状态；切换语言会保留路由。
  生产环境把 `#/` 换成同样形状的、带语言前缀的真实路径。
- 语言 + 主题持久化到 `localStorage`；语料在每种语言环境下逐字渲染。

**Distribution form（与下方生产路线图正交）**
- `scripts/build-offline.js` 把整个站点压平成单个自包含的
  `claude-code-api-requests-offline.html`（约 4 MB），入库在仓库根、供离线 /
  归档使用：JSX 在构建期通过 vendored 的 Babel 预编译
  （`../vendor/`，哈希钉死 —— 编译器本身不随产物发布），生产版 React
  被内联，字体/favicon 变成 data: URI，且除非其闸门全部通过，构建会拒绝写出
  （脚本闭包模拟、无外部引用、
  内嵌许可证/OFL、PII 扫描、相对 manifest 的新鲜度）。这部分推进了下面的预编译
  事项，但不替代托管形态。

**Production build replaces（按原始 spec）**
- `data.js`（内联，约 2.6 MB）以及 `changelog-data.js`/`changelog-zh.js`（各约 350 KB）→
  `index.json` 首屏 + 逐版本 / 逐 diff 的 JSON 惰性加载、
  内容哈希文件名、`_headers` 不可变缓存。
- 浏览器内 Babel/JSX → 预编译的 bundle（Vite/Astro 静态输出）。
- 浏览器端 diffing → 构建期预计算的 diff 文件。
- 内存内搜索扫描 → Pagefind 静态索引。
- 字体已经自托管（`assets/fonts/` + `tokens/fonts.css` @font-face）。
- **PII verify-or-fail 步骤**（spec PART 1）不在演示构建中：脱敏之后，
  `build:data` 必须重新扫描它自己的输出 —— 主目录路径（macOS/Linux/Windows）、邮箱、
  `sk-ant-*`、通用的 `api_key/secret/password` 值、`Bearer …`、JWT（`eyJ…`）、
  AWS `AKIA…` / GitHub `ghp_…` 令牌、长十六进制 id —— 并在任何命中时 `process.exit(1)`
  （像 `2.1.108.260` 这样的版本字符串是已知的 IPv4 模式误报；将其
  加入白名单）。用这套确切规则对当前 `data.js` 做的人工审计：**0 命中**。
