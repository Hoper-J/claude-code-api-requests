# corpus — Claude Code 2.x request corpus

**English** | [中文](README.zh-CN.md)

```
corpus/
├── versions/<v>/full.json      # capture output (request/response/TLS)
├── versions/<v>/status.json    # derived index
├── versions/<v>/variants/      # non-default model for that version, e.g. fable-5
├── manifest.json               # aggregate counts + tls_groups
├── example-artifacts/          # sample files loaded at capture time (CLAUDE.md/skill/mcp/memory)
├── changelog/CHANGELOG.md      # official release-notes snapshot
└── SCHEMA.md / findings.md      # docs
```

The corpus is written into this dir's `versions/` and `manifest.json` by `../capture/capture.sh`. `ccwrap` is installed with `npm i -g @hoper-j/ccwrap`; the capture commands:

```bash
# First run: log in inside an isolated config dir, with your own account
mkdir -p ~/.claude-demo-capture
CLAUDE_CONFIG_DIR=~/.claude-demo-capture claude login

# Add one version (both the version list and the data update automatically)
../capture/capture.sh --only "2.1.170" --refresh-versions --force --skip-preflight

# Full re-capture
../capture/capture.sh --force --skip-preflight

# Recompute status only (no re-capture)
../capture/capture.sh --reclassify
```
