---
name: lineage-design
description: Use this skill to generate well-branded interfaces and assets for Lineage, the static teaching archive that visualizes how the Claude Code CLI's API request evolved across versions. Use it for production or for throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, brand assets, and the UI-kit components for building the timeline, version explorer, diff/compare, and search views.
---

先阅读本 skill 内的 `DESIGN.md` 文件——它是完整的设计指南
（背景、三声部排版模型、内容基本原则、视觉基础、
图标系统，以及一份文件索引）。然后按需探索其他文件。

需要锚定的关键事实：
- **声部规则：** serif（Newsreader）+ sans（Hanken Grotesk）是可本地化的外壳；
  mono（JetBrains Mono）是逐字呈现的 API 语料，且**永不翻译**。
- **观感：** 暖象牙白"纸面" + 冷蓝宝石墨色、发丝级分隔线、近乎扁平的
  立面层级、低圆角。Diff 的 add/remove/modified 是一等公民的配色系统。
- **Tokens** 位于 `../public/tokens/*.css`，并经由 `../public/styles.css` 引用
  （`../public/` 是运行时/部署根目录，而本 `design/` 目录是设计源）。
- **Components** 位于 `components/<group>/`（core、corpus、nav）。`../public/` 中的站点
  （index.html + App.jsx）展示了它们在真实语料上的组合形态。

如何工作：
- 如果你在创建**视觉产物**（幻灯片、mock、一次性原型），
  从 `../public/assets/` 中复制你需要的资源，链接 `../public/styles.css`，并产出静态
  HTML 供用户查看。复用 `../public/kit-lib.jsx` 里现成的
  基础组件，或阅读 `components/` 下的组件源码。
- 如果你在做**生产代码**，复制资源并阅读这里的规则，以
  成为运用本品牌进行设计的专家；组件源码位于
  `components/<group>/`，可运行的镜像是 `../public/kit-lib.jsx`。
- 永不翻译语料内容。在每一种 locale 下，都要原样呈现系统提示词、工具名/描述以及
  input_schemas，与捕获时完全一致。

如果用户在没有其他指引的情况下调用本 skill，就询问他们想构建或
设计什么，问几个聚焦的问题，然后作为一名专家设计师行事，根据需要输出 HTML
产物 _或_ 生产代码。
