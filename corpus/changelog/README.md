# changelog — official release-notes snapshot

**English** | [中文](README.zh-CN.md)

`CHANGELOG.md` is a **snapshot** of the official [anthropics/claude-code](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) changelog (content © Anthropic, quoted for teaching only, with a source link built into the site UI). It's the build source for the site's Changelog tab:

```bash
# Refresh the snapshot (watch-versions does this automatically when it finds a new version)
curl -sfL https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md \
  -o corpus/changelog/CHANGELOG.md

# snapshot + corpus/manifest.json → site/public/changelog-data.js (build output, not committed)
node site/scripts/build-changelog.js
```

Chinese translations live under `site/i18n/` and are decoupled from this snapshot. Entries up to 2.1.177 were translated by `fable-5`; later versions moved to `opus-4-8` after `fable-5` was retired.
