# sanitize — corpus PII sanitization

**English** | [中文](README.zh-CN.md)

Usage:

```bash
node sanitize/sanitize.js            # sanitize in place (full/status/variants/manifest)
node sanitize/sanitize.js --check    # check only, no rewrite; residual PII → exit 1 (CI / commit gate)
```

## Processing matrix

| PII | Where | Treatment | Resulting form |
|---|---|---|---|
| API key | `request.headers.Authorization` | redacted by ccwrap at capture time | `Bearer sk-ant-‹redacted 108 chars›` |
| Account/device/session ids | `request.body.metadata.user_id` (old versions: an opaque string; new versions: a JSON-string holding `device_id`/`account_uuid`/`session_id`) | **shape-preserving mask**: keep key order and original length | `<user_id>(159 chars)` / `{"device_id":"<device_id>(64 chars)",…}` |
| Operator email | the `# userEmail` block in `messages[*]` | placeholder substitution, but `<noreply@anthropic.com>` is left unchanged | `<email>` |
| Local paths | `meta.claude_bin`, `status.claude_bin`, `manifest.ccwrap`, memory paths inside system/messages | replace the local home-dir prefix (`os.homedir()`) | `~/.claude-demo-capture/…/memory/MEMORY.md` |
| Session/request uuid | headers `X-Claude-Code-Session-Id` / `X-Client-Request-Id` | mask | `<masked>(36 chars)` |
| Injected capture date | `Today's date …` where the **value equals that version's capture day** (read from the sibling status.json) — phrase anchor + date comparison, both required; corpus-authored fixed example dates (e.g. `Today's date: 2025-07-01` in an old env note), the knowledge cutoff, and beta names are never touched | placeholder substitution | `Today's date is <date>.` |
| Capture timestamps | `status.captured_at`, `manifest.generated_at/started_at` (second-level = operator activity pattern) | truncate to the day (kept out of the diff) | `2026-06-11` |
| TLS fingerprints | `tls.ja3`/`ja4`/`peetprint` (6 distinct values each across the whole corpus = 6 stack groups), top-level `status` `ja3`/`ja4`, the keys of `manifest.tls_groups` | placeholder substitution | `<ja3#1>`…`<ja3#6>` |
| Raw TLS bytes | `tls.clienthello_hex` (holds the per-connection-unique client random / key share — a different value on every capture) | length mask | `<clienthello_hex>(1034 chars)` |
| Capture logs | `install.log` / `capture.stderr` / `claude-wrapper.sh` | not processed, **kept gitignored** (they contain local paths) | not committed |

`corpus/changelog/` is a snapshot of the official CHANGELOG.md and is skipped.
