# changelog — 官方发布说明快照

[English](README.md) | **中文**

`CHANGELOG.md` 是 [anthropics/claude-code](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) 官方更新日志的**快照**（内容 © Anthropic，仅作教学引用，站点 UI 内置出处链接）。它是站点 Changelog 标签页的构建源。上游只保留近期历史（文件在约 1 MB 处截断，2.1.8 之前的小节已不在其中，2.1.7 断在半句）；快照则保留语料各版本需要的每个小节，所以拉取结果是**合并**进快照而不是覆盖——按 `## x.y.z` 小节，上游优先，除非上游那份的条目数少于快照，上游已没有的小节保留：

```bash
# 刷新快照(watch-versions 在发现新版本时自动执行)
curl -sfL https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md -o /tmp/CHANGELOG.upstream.md
node site/scripts/merge-changelog.js /tmp/CHANGELOG.upstream.md    # --dry-run / --json；幂等

# 快照 + corpus/manifest.json → site/public/changelog-data.js(生成物,不入库)
node site/scripts/build-changelog.js
```

中文译文走 `site/i18n/`，与本快照解耦，由 Fable 完成。
