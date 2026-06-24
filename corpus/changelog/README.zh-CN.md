# changelog — 官方发布说明快照

[English](README.md) | **中文**

`CHANGELOG.md` 是 [anthropics/claude-code](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) 官方更新日志的**快照**（内容 © Anthropic，仅作教学引用，站点 UI 内置出处链接）。它是站点 Changelog 标签页的构建源：

```bash
# 刷新快照(watch-versions 在发现新版本时自动执行)
curl -sfL https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md \
  -o corpus/changelog/CHANGELOG.md

# 快照 + corpus/manifest.json → site/public/changelog-data.js(生成物,不入库)
node site/scripts/build-changelog.js
```

中文译文走 `site/i18n/`，与本快照解耦。其中 2.1.177 及之前的条目由 `fable-5` 翻译，后续版本因模型下架更改为 `opus-4-8`。
