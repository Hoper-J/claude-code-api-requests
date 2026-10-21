# changelog — official release-notes snapshot

**English** | [中文](README.zh-CN.md)

`CHANGELOG.md` is a **snapshot** of the official [anthropics/claude-code](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) changelog (content © Anthropic, quoted for teaching only, with a source link built into the site UI). It's the build source for the site's Changelog tab. Upstream keeps only its recent history (the file is cut at about 1 MB, so sections before 2.1.8 are gone from it and 2.1.7 is truncated mid-line); the snapshot keeps every section a corpus version needs, so a fetch is **merged** into it rather than copied over it — per `## x.y.z` section, upstream wins unless its copy has fewer bullets than the snapshot's, and sections upstream no longer has are kept:

```bash
# Refresh the snapshot (watch-versions does this automatically when it finds a new version)
curl -sfL https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md -o /tmp/CHANGELOG.upstream.md
node site/scripts/merge-changelog.js /tmp/CHANGELOG.upstream.md    # --dry-run / --json; idempotent

# snapshot + corpus/manifest.json → site/public/changelog-data.js (build output, not committed)
node site/scripts/build-changelog.js
```

Chinese translations live under `site/i18n/` and are decoupled from this snapshot; they are done by Fable.
