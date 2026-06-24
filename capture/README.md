# capture — corpus capture CLI

**English** | [中文](README.zh-CN.md)

Captures the `--full` request/response/TLS that each Claude Code version sends, across versions, into this project's `../corpus`.

```
capture.sh                  ← self-contained wrapper: isolated config + sample-file env + writes into ../corpus
   └─ capture-version-matrix.sh   ← engine: list versions → install → ccwrap capture → classify → aggregate manifest → resume
```

## External dependencies

- **[ccwrap](https://github.com/Hoper-J/ccwrap)** (a MITM capture tool; capture method in the [Headless capture](https://github.com/Hoper-J/ccwrap#headless-capture-ccwrap-capture) section): install with `npm i -g @hoper-j/ccwrap`.
  - Once installed, the script auto-discovers it (`CCWRAP_BIN` → PATH → `~/ccwrap/ccwrap` → sibling `../ccwrap/ccwrap` → `--ccwrap`); if none is found it prints the install command and exits.
  - The npm package covers darwin/linux × arm64/amd64; for other platforms, `go build` from source.
- `npm` / `node` (early versions packaged as `cli.js` need node 18–22) / `jq` / `curl`.

## One-time setup

Capture points at an **isolated config dir** (doesn't touch your local `~/.claude`); log in there once:

```bash
mkdir -p ~/.claude-demo-capture
CLAUDE_CONFIG_DIR=~/.claude-demo-capture claude login
```

## Capturing versions

```bash
# Add one version (both the list and the data update automatically)
./capture/capture.sh --only "2.1.170" --refresh-versions --force --skip-preflight

# Full
./capture/capture.sh --force --skip-preflight

# Classification logic changed — recompute status only (no re-capture; don't keep --force re-running)
./capture/capture.sh --reclassify

# Capture a non-default-model "variant" of a version (an overlay, not on the version axis)
./capture/capture.sh --only "2.1.170" --model "claude-fable-5[1m]" --variant --skip-preflight
#   → versions/2.1.170/variants/<model-slug>.{json,status.json}
#   → the variant status auto-computes model_axis_diff (model/fallbacks/beta/body-keys differences)
#   → the canonical status gets the variant indexed in variants[] (deduped)
```

`capture.sh` is a wrapper: the arguments you put after it are passed straight through to the engine `capture-version-matrix.sh` that does the real work — any argument the engine accepts (`--only/--force/--registry/--npm-cache/--skip-preflight/--reclassify/--install-timeout` etc., full list via `capture-version-matrix.sh --help`) works directly. The one exception is `--no-sanitize`, which `capture.sh` consumes itself (not passed to the engine; see "Auto-sanitize" below).

## Watching for new versions (watch-versions)

```bash
capture/watch-versions.sh                      # single poll: if npm has missing versions, capture → sanitize → refresh official changelog snapshot → rebuild data.js + changelog data
capture/watch-versions.sh --push               # also git commit + push (incl. changelog snapshot; auto-skips if no remote is configured)
capture/watch-versions.sh --install-launchd    # generate a ~/Library/LaunchAgents plist (hourly by default, with --push)
launchctl load ~/Library/LaunchAgents/com.lineage.watch-versions.plist    # enable the schedule
```

With no new version it exits in seconds (an unreachable npm is treated as transient, retried next round); concurrency is guarded by a lock; logs go to `corpus/_cache/watch.log` (gitignored). A failed changelog-snapshot fetch doesn't affect the main flow (the committed snapshot is kept; a new version temporarily shows the "no entry" state, self-healing next round); Chinese translations are a separate step, see [../site/i18n/README.md](../site/i18n/README.md).

## Auto-sanitize

**Every `capture.sh` run (including a mid-run engine failure) automatically runs `../sanitize/sanitize.js` in place over `../corpus`** (idempotent) — freshly captured full/status/manifest carry operator PII and are scrubbed the moment they land. `--no-sanitize` skips it (debugging raw captures only; the corpus then contains PII — **don't `add`**). Backstop gate: the repo's pre-commit hook runs `sanitize.js --check` when corpus data is staged and rejects the commit on any residue. **Enable once on a fresh clone**: `git config core.hooksPath .githooks`.

## Sample-file environment

`../corpus/example-artifacts/` is the example loaded at capture time (CLAUDE.md + a SessionStart hook + a greeter skill + the `.mcp.json` echo + `memory-snapshot/`). `capture.sh` lays it into `/tmp/example` each run and puts memory in the isolated config dir, so a re-capture's environment matches the existing corpus.

## What isolation does / doesn't do

`CLAUDE_CONFIG_DIR` **removes** the operator's local skills/plugins/MCP/settings, but **can't remove** account-level `account_uuid`/`device_id`/email — those are shape-masked by `../sanitize/`, which `capture.sh` calls automatically on finish.

## Gotchas

- **npm install timeout**: newer versions package a ~200MB native binary (Bun); on a slow link the first install takes ~400s. The engine's default `--install-timeout` is raised to 700 (leaving headroom for a ~400s install; npm's own fetch-timeout still guards a truly stuck connection), and it reuses the global cache by default (`~/.npm`, so a reinstall is near-instant) — the default uses the official registry, no mirror needed.
- **Networks where the official registry is slow (e.g. mainland China)**: you can add `--registry <your mirror>` (e.g. `https://registry.npmmirror.com`) to speed up the install; this is optional and doesn't affect the captured corpus.
- **EACCES within 1s of install**: `~/.npm` has root-owned files → `sudo chown -R "$(id -u):$(id -g)" ~/.npm`.
- **Preflight failure ("could not record /v1/messages")**: a single trial capture is sometimes flaky; once setup is verified, use `--skip-preflight` to skip it.
- **Relative `--root`**: gets silently mkdir'd to the wrong place; `capture.sh` already uses an absolute path.
