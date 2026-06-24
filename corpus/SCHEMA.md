# Corpus data structure

**English** | [中文](SCHEMA.zh-CN.md)

One directory per version, `versions/<v>/`, holding `full.json` (capture output) + `status.json` (derived index); the top-level `manifest.json` aggregates.

## `full.json` — one request/response/TLS

```jsonc
{
  "tls": {                      // TLS stack fingerprint — pseudonymized to group labels (see ../sanitize/)
    "ja3": "<ja3#1>", "ja4": "<ja4#1>", "peetprint": "<peetprint#1>",
    "clienthello_hex": "<clienthello_hex>(1034 chars)"   // raw bytes hold per-connection-unique values; length only is kept
  },
  "request": {
    "method": "POST",
    "host": "api.anthropic.com",
    "path": "/v1/messages?beta=true",
    "headers": { … },           // credentials redacted (Authorization → Bearer sk-ant-‹redacted›)
    "body": { … },              // ★ the actual API request body, see below
    "body_encoding": "json"
  },
  "response": {
    "status": 200,
    "headers": { … },
    "body": "event: message_start…",   // SSE string / JSON / raw
    "body_encoding": "sse" | "json" | "raw" | "absent"
  },
  "meta": { "schema_version": 1, "claude_bin": "…", "unmasked": false, "notes": [] }   // captured_at is in status.json, not meta
}
```

### `request.body` (the core object being compared)
The real payload Claude Code sends to `/v1/messages`:
- `model` — that version's default model (`claude-sonnet-4-5` → … → `claude-opus-4-8`).
- `system` — the system prompt (a string or a block array; Anthropic's agent instructions, **not** custom files like CLAUDE.md/skill — those are in `messages[]`/`tools[]`).
- `tools[]` — tool definitions. **2.1.x defers MCP tools**: `tools[]` holds only built-ins + `ToolSearch`, and the real MCP names are in the "deferred tools" note in system/messages (early versions inline the full schema into `tools[]`) — a key cross-version evolution axis.
- `messages[]` — the conversation; **hook injection and CLAUDE.md content** often appear here.
- `max_tokens` — `1` = quota probe (an auxiliary call); a large value = main inference.

## `status.json` — per-version index

```jsonc
{
  "version": "2.1.100", "result": "ok",
  "regime": "js" | "native",
  "model_in_request": "claude-opus-4-6",
  "http_status": 200,
  "ja3": "<ja3#1>", "ja4": "<ja4#1>",      // pseudonymized group labels (same mapping as full.json / manifest)
  "system_blocks": 4, "tools_count": 10,
  "is_quota_probe": false,        // ★ true = this version only captured a quota probe (main inference was aborted)
  "is_main_inference": true,      // ★ = (not is_quota_probe); true = a real main inference
  "captured_at": "…", "duration_seconds": 50, "error": ""
}
```

Filtering: `is_main_inference==true` is a real request; `is_quota_probe==true` is an auxiliary quota probe (a placeholder when main inference didn't land: a single content of `"quota"`, `max_tokens==1`). Counts change with each capture — go by `manifest.json`'s `.counts` (the current corpus is **entirely main inference, 0 probes**).

## `manifest.json` — aggregate

```jsonc
{
  "counts": { "total":N, "ok":N, "fail":0, "main_inference":N, "auxiliary":0 },   // shape illustration; real numbers are in the file
  "auxiliary_captures": [ {version, model, http} ],   // currently empty; entries only when probes exist
  "tls_groups": { "<ja3#1>": ["2.0.0","2.0.1",…] },   // ★ which versions share the same TLS stack (key = pseudonymized group label)
  "versions": ["2.0.0", "2.0.1", … ]   // ascending semver; the last entry is the newest captured version
}
```

## Model variants (overlay, not a new version)

A version can have a non-default-model "variant" sample, attached under that version and **not on the version axis**:

```
versions/2.1.170/
├── full.json / status.json                    # canonical: default opus-4-8[1m]
└── variants/
    ├── claude-fable-5-1m.json                  # variant full.json (pinned to claude-fable-5[1m])
    └── claude-fable-5-1m.status.json           # variant metadata + model_axis_diff
```
- the canonical `status.json` has a `"variants": ["claude-fable-5-1m"]` index;
- the variant status has `base_version` / `pinned_model` / `is_default:false` / **`model_axis_diff`** (a pre-computed "swapping the model only touches these few places" list — the UI uses it to **highlight model differences and gray out timing noise**, so don't use the raw diff);
- purpose: a "model toggle" on the version page (default ⇄ variant), showing the **model-axis diff**, orthogonal to the timeline's **version-axis diff**.

## PII fields
The PII in the corpus (`metadata.user_id`, the `# userEmail` block, local paths, session headers, capture date, TLS fingerprints) is placeholder-masked by `../sanitize/sanitize.js`: `<user_id>(159 chars)`, `<email>`, `<ja3#N>`. For the exact rules see [../sanitize/README.md](../sanitize/README.md).

**A freshly captured version re-introduces the raw values, so you must re-run sanitize before committing.**
