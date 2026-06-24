**ChangelogEntry** —— 单个版本的官方发布说明，逐字引自 Claude Code 的 `CHANGELOG.md`。英文条目是源材料，在每个 locale 中都保持权威地位，与 corpus 完全一样。zh locale 可以展示**经审校的构建期翻译**（通过 `site/scripts/build-changelog-zh.js` 从 `site/i18n/` 中按内容寻址的映射生成）；未翻译的条目逐条回退为英文。只有生成的摘要行（"3 added · 5 fixed"）及其周围的界面装饰（chrome）会本地化。

```jsx
<ChangelogEntry
  bullets={["Added `/cd` command to move a session to a new working directory", "Fixed footer hints not showing for users with a custom statusline"]}
  counts={{ add: 1, fix: 1, imp: 0, chg: 0, oth: 0 }}
  source={{ name: "anthropics/claude-code", url: "https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md" }}
/>
<ChangelogEntry bullets={entry && entry.b} counts={entry && entry.c} labels={t.changelogLabels} />
```

- 条目仅渲染极少量的行内 markdown：`` `code` ``、`**bold**`、`[text](url)`、裸 URL。切勿向它喂入任意 HTML 或完整的 markdown 文档。
- counts 来自构建（`site/scripts/build-changelog.js` 的首动词分类）—— 切勿手写。
- `bullets` 为 null／空时渲染平静的"无条目"状态；传入 `labels.missing`／`labels.missingBody` 使其本地化。文案声明该条目**缺失** —— 它绝不能声称该发布被"跳过"（快照无法知晓上游究竟是跳过了这个版本号，还是只是尚未发布）。
- zh 包设置 `wordFirst: true`（"新增 3" 而非 "3 新增"），并设置一条 `verbatimNote`／`mtNote` 脚注，指明原文为权威。
- 可选的 `actions` 槽位渲染在 meta 行（右侧，源链接之前）—— 控件与身份标签芯片应随条目的界面装饰（chrome）一同出现，绝不要作为堆叠在其上方的单独一行。站点在版本页此处传入一个仅含图标的 `languages` 切换按钮，以及对比跨度卡片中可点击的 `VersionChip`；en locale 不传入任何切换按钮（品牌色 = 翻译视图"开启"，淡色 = 原文；`title` 标明目标视图，`aria-pressed` 携带状态）。切换按钮上没有文字标签 —— 图标本身就是控件。
- 不要用 diff 色板给条目做颜色编码 —— diff 颜色表示载荷的插入／删除／改动，而非发布说明的类别。
