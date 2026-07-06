#!/usr/bin/env bash
# capture-version-matrix.sh
#
# Capture the `--full` request/response/TLS that every `2.*.*` Claude Code CLI
# version sends to the API, through ccwrap, one folder per version — a corpus
# for cross-version request/response comparison.
#
# Design notes (the non-obvious bits, learned the hard way):
#   * JS regime (early 2.x, bin=cli.js) CRASHES on node >= 24/25
#     ("Cannot read properties of undefined (reading 'prototype')").
#     It runs cleanly on node 18-22. The harness resolves an LTS node for the
#     JS regime and runs `node <cli.js>` explicitly; the native regime
#     (late 2.x, downloaded platform binary) ignores node entirely.
#   * ccwrap capture matches host=api.anthropic.com path=/v1/messages by
#     default. If your environment routes Claude elsewhere (a corporate gateway,
#     an eval/SDK endpoint like /api/eval/sdk-*), capture will time out with
#     "no request to api.anthropic.com/v1/messages". The preflight check below
#     catches that BEFORE installing 214 versions. Override with
#     --capture-host/--capture-path if you knowingly run a custom endpoint.
#   * Resume is first-class: every artifact is written atomically (.tmp + mv),
#     a version with a valid full.json is skipped on re-run, and the manifest is
#     re-derived from per-version status.json each checkpoint — so a kill -9 at
#     any point leaves a coherent, resumable corpus. Ctrl-C is clean.
#
# Run it from a NORMAL terminal (real OAuth / api.anthropic.com), not from
# inside another tool's sandbox.

set -uo pipefail

# ----------------------------------------------------------------------------- config / defaults
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/version-matrix"
WORKDIR=""                        # capture cwd; default "$ROOT/_workdir". Point at a
                                  # folder with CLAUDE.md/.claude/.mcp.json/memory to
                                  # capture how those artifacts appear per version.
CCWRAP=""                         # auto-resolved below
JS_NODE=""                        # auto-resolved (nvm LTS) below; override with --node
PROMPT="Reply with the single word: ping"
MODEL=""                          # unset => each version's default
CAP_TIMEOUT="60s"                 # ccwrap capture --timeout (request wait)
HARD_TIMEOUT=600                  # outer per-version wall clock (install+capture)
INSTALL_TIMEOUT=700               # npm install per version. Newer builds bundle a
                                  # ~200MB native binary; a slow-but-progressing
                                  # download legitimately needs ~400s. npm's own
                                  # fetch-timeout still guards a truly stuck connection.
NPM_CACHE=""                      # npm --cache dir; default = global (~/.npm) so
                                  # downloads are REUSED across runs and the
                                  # shared native deps (sharp) download once
REGISTRY=""                       # npm --registry (e.g. https://registry.npmmirror.com);
                                  # when set with no HTTPS_PROXY, the stale ~/.npmrc
                                  # proxy is bypassed (direct mirror)
SLEEP=5                           # pace between versions
PRUNE=1                           # delete node_modules after a successful capture
FORCE=0
RECLASSIFY=0
VARIANT=0                         # --variant: capture ONE --only version pinned to --model
                                  # into versions/<v>/variants/ (an overlay, not a new version)
ONLY=""                           # comma list of versions
FROM=""; TO=""
CAP_HOST=""; CAP_PATH=""          # passthrough to ccwrap capture --host/--path
SKIP_PREFLIGHT=0
REFRESH_VERSIONS=0
QUIET=0
COLOR=auto
DRY_RUN=0
PKGNAME="@anthropic-ai/claude-code"

usage() {
  cat <<'EOF'
capture-version-matrix.sh — capture `--full` for every 2.x Claude Code version

Usage: capture-version-matrix.sh [options]

Selection:
  --only "2.0.1,2.1.168"   only these versions (smoke subset)
  --from VER --to VER      inclusive version range (version-aware)
  --force                  re-capture even if a valid full.json exists
  --reclassify             recompute status.json from existing full.json (no
                           install/capture); use after the classification logic
                           changes. Pair with --only to target specific versions.
  --variant                with --only <one version> + --model <model>: capture
                           that version pinned to the non-default model into
                           versions/<v>/variants/<slug>.{json,status.json} (an
                           overlay; builds a model_axis_diff vs the canonical).

Paths / tools:
  --root DIR               corpus root (default: <script_dir>/version-matrix)
  --workdir DIR            capture cwd (default: <root>/_workdir, empty). Point at a
                           folder with CLAUDE.md/.claude/.mcp.json/memory to capture how
                           those artifacts appear in each version's request.
  --ccwrap PATH            ccwrap binary (default: ./ccwrap, repo, or PATH)
  --node PATH              node for the JS regime (default: auto nvm LTS 18-22)

Capture:
  --prompt STR             fixed prompt (default: "Reply with the single word: ping")
  --model ID               pin model for ALL versions (default: each version default)
  --timeout DUR            ccwrap capture --timeout (default 60s)
  --capture-host HOST      override matched host (custom-endpoint envs)
  --capture-path PATH      override matched path (custom-endpoint envs)

Run control:
  --hard-timeout SEC       outer per-version timeout (default 600)
  --install-timeout SEC    npm install timeout (default 700)
  --npm-cache DIR          npm --cache (default: global ~/.npm — reuses already
                           downloaded tarballs across runs; shared deps download once)
  --registry URL           npm --registry (e.g. https://registry.npmmirror.com);
                           with no HTTPS_PROXY the stale ~/.npmrc proxy is bypassed
  --sleep SEC              pace between versions (default 5)
  --no-prune               keep node_modules (default: prune after success)
  --skip-preflight         skip the env sanity capture
  --refresh-versions       re-fetch the npm version list
  --quiet                  only summary lines
  --no-color               plain output
  --dry-run                enumerate + plan only; no installs, no captures
  -h, --help               this help

Resume: just re-run the same command. Completed versions are skipped; only
missing/failed ones are retried. The manifest is checkpointed every version.
EOF
}

# ----------------------------------------------------------------------------- arg parse
while [ $# -gt 0 ]; do
  case "$1" in
    --root) ROOT="$2"; shift 2;;
    --workdir) WORKDIR="$2"; shift 2;;
    --ccwrap) CCWRAP="$2"; shift 2;;
    --node) JS_NODE="$2"; shift 2;;
    --prompt) PROMPT="$2"; shift 2;;
    --model) MODEL="$2"; shift 2;;
    --timeout) CAP_TIMEOUT="$2"; shift 2;;
    --hard-timeout) HARD_TIMEOUT="$2"; shift 2;;
    --install-timeout) INSTALL_TIMEOUT="$2"; shift 2;;
    --npm-cache) NPM_CACHE="$2"; shift 2;;
    --registry) REGISTRY="$2"; shift 2;;
    --sleep) SLEEP="$2"; shift 2;;
    --prune) PRUNE=1; shift;;
    --no-prune) PRUNE=0; shift;;
    --force) FORCE=1; shift;;
    --reclassify) RECLASSIFY=1; shift;;
    --variant) VARIANT=1; shift;;
    --only) ONLY="$2"; shift 2;;
    --from) FROM="$2"; shift 2;;
    --to) TO="$2"; shift 2;;
    --capture-host) CAP_HOST="$2"; shift 2;;
    --capture-path) CAP_PATH="$2"; shift 2;;
    --skip-preflight) SKIP_PREFLIGHT=1; shift;;
    --refresh-versions) REFRESH_VERSIONS=1; shift;;
    --quiet) QUIET=1; shift;;
    --no-color) COLOR=never; shift;;
    --dry-run) DRY_RUN=1; shift;;
    -h|--help) usage; exit 0;;
    *) echo "unknown option: $1" >&2; usage >&2; exit 2;;
  esac
done

# ----------------------------------------------------------------------------- colors / output
if [ "$COLOR" = auto ]; then [ -t 2 ] && COLOR=always || COLOR=never; fi
if [ "$COLOR" = always ]; then
  C_DIM=$'\e[2m'; C_RED=$'\e[31m'; C_GRN=$'\e[32m'; C_YEL=$'\e[33m'; C_CYN=$'\e[36m'; C_BLD=$'\e[1m'; C_RST=$'\e[0m'
else C_DIM=; C_RED=; C_GRN=; C_YEL=; C_CYN=; C_BLD=; C_RST=; fi

RUN_LOG=""
say()  { [ "$QUIET" = 1 ] && return 0; printf '%s\n' "$*" >&2; }       # terminal (suppressed by --quiet)
note() { printf '%s\n' "$*" >&2; }                                     # always to terminal
logf() { [ -n "$RUN_LOG" ] && printf '%s %s\n' "$(date '+%H:%M:%S')" "$*" >>"$RUN_LOG"; }
die()  { note "${C_RED}error:${C_RST} $*"; exit 1; }

# ----------------------------------------------------------------------------- helpers
# run_with_timeout SECS cmd...  (cmd may be a function; kills the tree on deadline)
run_with_timeout() {
  local secs="$1"; shift
  # Run the command in its OWN process group so a hung capture's WHOLE tree
  # (the subshell + ccwrap + node + claude) is killed on deadline, not just the
  # immediate subshell. `set -m` makes a backgrounded job a process-group leader
  # (pgid == pid); `kill -SIG -$pid` then signals the entire group. Without this
  # the grandchildren orphan and leak across the 214-version run.
  local had_m=0; case "$-" in *m*) had_m=1;; esac
  set -m
  "$@" & local pid=$!
  [ "$had_m" = 1 ] || set +m
  # Poll-loop watcher (1s granularity): self-terminates within ~1s of the
  # command finishing, so no long-lived `sleep` ever orphans. fds -> /dev/null
  # so even a transient orphan can't hold a pipe open.
  (
    local i=0
    while kill -0 "$pid" 2>/dev/null; do
      sleep 1; i=$((i+1))
      if [ "$i" -ge "$secs" ]; then
        kill -TERM "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null
        sleep 3
        kill -KILL "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null
        break
      fi
    done
  ) >/dev/null 2>&1 & local w=$!
  wait "$pid" 2>/dev/null; local rc=$?
  kill -KILL "-$pid" 2>/dev/null || true   # reap any survivor in the work group
  pkill -P "$w" 2>/dev/null; kill "$w" 2>/dev/null; wait "$w" 2>/dev/null
  return "$rc"
}

atomic_write() {  # atomic_write FILE  (content on stdin; rejects empty payloads)
  # An empty stdin still makes `cat` succeed, so without the size check a jq abort
  # upstream (swallowed by 2>/dev/null) would clobber a good file with 0 bytes —
  # e.g. one corrupt status.json nuking the whole manifest on the next checkpoint.
  local f="$1"; cat > "$f.tmp"
  if [ -s "$f.tmp" ]; then mv -f "$f.tmp" "$f"; else rm -f "$f.tmp"; return 1; fi
}

valid_full_json() {  # valid_full_json FILE  -> 0 if it is a real captured exchange
  local f="$1"; [ -s "$f" ] || return 1
  jq -e '.meta.schema_version==1 and (.request.body != null)' "$f" >/dev/null 2>&1
}

now_epoch() { date +%s; }
fmt_dur() {  # seconds -> "1h12m" / "8m" / "42s"
  local s=$1
  if [ "$s" -ge 3600 ]; then printf '%dh%02dm' $((s/3600)) $(((s%3600)/60))
  elif [ "$s" -ge 60 ]; then printf '%dm%02ds' $((s/60)) $((s%60))
  else printf '%ds' "$s"; fi
}

# resolve_js_node: prefer an LTS node (major 18-22) so old cli.js bundles don't crash.
resolve_js_node() {
  [ -n "$JS_NODE" ] && { echo "$JS_NODE"; return; }
  [ -n "${CCWRAP_VM_NODE_JS:-}" ] && { echo "$CCWRAP_VM_NODE_JS"; return; }
  local best="" bestmaj=0 d maj
  if [ -d "$HOME/.nvm/versions/node" ]; then
    for d in "$HOME/.nvm/versions/node"/v*/bin/node; do
      [ -x "$d" ] || continue
      maj=$("$d" -e 'process.stdout.write(String(process.versions.node.split(".")[0]))' 2>/dev/null) || continue
      if [ "$maj" -ge 18 ] && [ "$maj" -le 22 ] && [ "$maj" -gt "$bestmaj" ]; then best="$d"; bestmaj="$maj"; fi
    done
  fi
  if [ -z "$best" ]; then  # fall back to PATH node only if it's in-range
    if command -v node >/dev/null 2>&1; then
      maj=$(node -e 'process.stdout.write(String(process.versions.node.split(".")[0]))' 2>/dev/null||echo 0)
      [ "${maj:-0}" -ge 18 ] && [ "${maj:-0}" -le 23 ] && best="$(command -v node)"
    fi
  fi
  echo "$best"
}

# resolve_target VDIR -> echoes "REGIME|EXEC..." where EXEC is the runnable
# command for that version: native => "native|<bin>", js => "js|<node>|<cli.js>"
probe_ok() { run_with_timeout 20 "$@" --version >/dev/null 2>&1; }
resolve_target() {
  local vdir="$1" pkg="$vdir/node_modules/$PKGNAME"
  # Prefer the JS regime FIRST when cli.js exists: cli.js can crash on node>=24,
  # so it must run on the pinned LTS node, never via the .bin shim (which uses the
  # PATH node). Some mid-range cli.js bundles survive a node-25 `--version` probe,
  # so probing .bin first would mislabel them "native" and run them on the wrong
  # node. Only fall through to a real native binary when there is no cli.js.
  if [ -f "$pkg/cli.js" ] && [ -n "$JS_NODE" ] && probe_ok "$JS_NODE" "$pkg/cli.js"; then
    echo "js|$JS_NODE|$pkg/cli.js"; return 0
  fi
  local cand
  for cand in "$pkg/bin/claude" "$vdir/node_modules/.bin/claude"; do
    if [ -e "$cand" ] && probe_ok "$cand"; then echo "native|$cand"; return 0; fi
  done
  echo "fail|"; return 1
}

write_wrapper() {  # write_wrapper VDIR REGIME EXEC...  -> path to wrapper
  local vdir="$1" regime="$2"; shift 2
  local wf="$vdir/claude-wrapper.sh"
  {
    echo '#!/bin/sh'
    # A plain user's `claude -p` has no host-managed-provider contract. ccwrap
    # injects CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST into its child, and from
    # 2.1.198 that flag makes the client skip its own stored OAuth entirely
    # ("Not logged in"). Unset it so the capture authenticates like a real
    # standalone run (<=2.1.197 ignored the flag, so this changes nothing there).
    echo 'unset CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST'
    # A plain user's shell has none of the CLAUDE* session vars either. They
    # leak in when the capture is launched from inside a Claude Code session,
    # and CLAUDECODE trips the nested-session guard (js-regime versions from
    # ~2.1.40 refuse to start: "cannot be launched inside another session").
    echo 'unset CLAUDECODE CLAUDE_CODE_ENTRYPOINT CLAUDE_CODE_EXECPATH CLAUDE_CODE_SESSION_ID CLAUDE_CODE_CHILD_SESSION CLAUDE_EFFORT CLAUDE_PLUGIN_DATA'
    if [ "$regime" = native ]; then printf 'exec %q "$@"\n' "$1"
    else printf 'exec %q %q "$@"\n' "$1" "$2"; fi
  } > "$wf"
  chmod +x "$wf"; echo "$wf"
}

# ----------------------------------------------------------------------------- preflight
resolve_ccwrap() {
  [ -n "$CCWRAP" ] && { echo "$CCWRAP"; return; }              # --ccwrap PATH (arg)
  [ -n "${CCWRAP_BIN:-}" ] && { echo "$CCWRAP_BIN"; return; }  # CCWRAP_BIN env
  command -v ccwrap 2>/dev/null && return                      # on PATH
  local c d                                                     # last: a sibling/HOME ccwrap repo
  for c in "$SCRIPT_DIR/../../ccwrap/ccwrap" "$HOME/ccwrap/ccwrap"; do
    [ -x "$c" ] && { d="$(cd "$(dirname "$c")" && pwd)"; echo "$d/ccwrap"; return; }
  done
}

preflight() {
  command -v npm  >/dev/null || die "npm not found"
  command -v jq   >/dev/null || die "jq not found (required for resume + parsing)"
  command -v curl >/dev/null || die "curl not found"
  [ -x "$CCWRAP" ] || die "ccwrap binary not executable: $CCWRAP (use --ccwrap)"
  JS_NODE="$(resolve_js_node)"
  if [ -z "$JS_NODE" ]; then
    note "${C_YEL}warning:${C_RST} no node 18-22 found (nvm or PATH). JS-regime (early 2.x) versions will fail."
    note "         install one (e.g. nvm install 22) or pass --node /path/to/node18-22."
  else
    say "${C_DIM}js node : $JS_NODE ($("$JS_NODE" --version))${C_RST}"
  fi
  say "${C_DIM}ccwrap  : $CCWRAP ($("$CCWRAP" version 2>/dev/null | head -1))${C_RST}"

  { [ "$SKIP_PREFLIGHT" = 1 ] || [ "$DRY_RUN" = 1 ] || [ "$RECLASSIFY" = 1 ]; } && return 0  # reclassify makes no live call

  # npm registry reachability (using do_install's proxy logic). Catches the
  # stale-.npmrc-proxy hang up front instead of burning 300s/version.
  if run_with_timeout 25 npm_reachable; then
    say "${C_DIM}npm     : registry reachable${C_RST}"
  else
    note "${C_RED}preflight:${C_RST} npm cannot reach the registry within 25s (installs would hang on npm's 300s fetch-timeout)."
    note "  npm https-proxy = $(npm config get https-proxy 2>/dev/null) (from ~/.npmrc);  env HTTPS_PROXY = ${HTTPS_PROXY:-<unset>}"
    note "  Fix: point ~/.npmrc proxy at a running proxy, or export HTTPS_PROXY to one, then re-run."
    return 1
  fi

  # Env sanity: one real capture against the system claude. Catches the
  # "Claude routes somewhere other than /v1/messages" trap before 214 installs.
  local sysclaude; sysclaude="$(command -v claude || true)"
  [ -z "$sysclaude" ] && { note "${C_YEL}preflight:${C_RST} no 'claude' on PATH to sanity-check; pass --skip-preflight to proceed."; return 1; }
  say "${C_CYN}preflight:${C_RST} test-capturing system claude ($("$sysclaude" --version 2>/dev/null)) ..."
  mkdir -p "$WORKDIR"
  local tmp; tmp="$(mktemp)"
  ( cd "$WORKDIR" && "$CCWRAP" capture --full --main-inference --claude-bin "$sysclaude" --timeout "$CAP_TIMEOUT" \
      ${CAP_HOST:+--host "$CAP_HOST"} ${CAP_PATH:+--path "$CAP_PATH"} \
      -- -p "$PROMPT" ${MODEL:+--model "$MODEL"} < /dev/null > "$tmp" 2>/dev/null ) || true
  if valid_full_json "$tmp"; then
    say "${C_GRN}preflight ok${C_RST} — HTTP $(jq -r '.response.status' "$tmp" 2>/dev/null), path $(jq -r '.request.path' "$tmp" 2>/dev/null)"
    rm -f "$tmp"; return 0
  fi
  rm -f "$tmp"
  note "${C_RED}preflight FAILED${C_RST} — ccwrap capture could not record a ${C_BLD}/v1/messages${C_RST} request here."
  note "  Likely this environment routes Claude through a gateway/eval endpoint, not the public API."
  note "  Run from a normal terminal (real OAuth → api.anthropic.com), or, if you KNOW the endpoint,"
  note "  pass --capture-host/--capture-path. To proceed anyway: --skip-preflight."
  return 1
}

# ----------------------------------------------------------------------------- version enumeration
enumerate() {
  local cache="$ROOT/_cache/versions.txt"
  if [ "$REFRESH_VERSIONS" = 1 ] || [ ! -s "$cache" ]; then
    npm view "$PKGNAME" versions --json 2>/dev/null \
      | jq -r '.[] | select(test("^2\\."))' \
      | grep -E '^2\.[0-9]+\.[0-9]+$' | sort -V > "$cache.tmp" && mv -f "$cache.tmp" "$cache" \
      || die "failed to fetch version list from npm"
  fi
  local list; list="$(cat "$cache")"
  if [ -n "$ONLY" ]; then
    list="$(printf '%s\n' "$list" | grep -Fxf <(printf '%s\n' "${ONLY//,/$'\n'}"))"
  fi
  if [ -n "$FROM" ]; then list="$(printf '%s\n' "$list" | awk -v f="$FROM" 'BEGIN{}{print}' | sort -V | awk -v f="$FROM" '$0==f{ok=1} ok' )"; fi
  if [ -n "$TO" ];   then list="$(printf '%s\n' "$list" | sort -V | awk -v t="$TO" '{print} $0==t{exit}')"; fi
  printf '%s\n' "$list" | sed '/^$/d'
}

# ----------------------------------------------------------------------------- per-version
write_status() { atomic_write "$1/status.json"; }

do_install() {  # do_install VERSION VDIR
  # Proxy: ~/.npmrc may pin a proxy (e.g. Clash :7890) that is slow/down here,
  # making npm wait out its 300s fetch-timeout. When HTTPS_PROXY is set we force
  # npm to use it; with a direct --registry mirror and no HTTPS_PROXY we bypass
  # the stale .npmrc proxy; otherwise we leave npm's own config alone.
  local px="${HTTPS_PROXY:-${https_proxy:-}}"
  local args=( "$PKGNAME@$1" --prefix "$2" --cache "$NPM_CACHE"
               --no-save --no-audit --no-fund --no-progress --loglevel warn )
  [ -n "$REGISTRY" ] && args+=( --registry "$REGISTRY" )
  if [ -n "$px" ]; then
    npm install "${args[@]}" --proxy "$px" --https-proxy "$px" > "$2/install.log" 2>&1
  elif [ -n "$REGISTRY" ]; then
    npm_config_proxy= npm_config_https_proxy= npm install "${args[@]}" > "$2/install.log" 2>&1
  else
    npm install "${args[@]}" > "$2/install.log" 2>&1
  fi
}

# npm_reachable: fast check that npm can hit the registry with the proxy logic
# do_install uses — catches the .npmrc-proxy-hang before installing 214 versions.
npm_reachable() {
  local px="${HTTPS_PROXY:-${https_proxy:-}}"
  if [ -n "$px" ]; then npm view "$PKGNAME" version --proxy "$px" --https-proxy "$px" >/dev/null 2>&1
  else npm view "$PKGNAME" version >/dev/null 2>&1; fi
}

do_capture() {  # do_capture VDIR WRAPPER  (stdout -> full.json.tmp)
  ( cd "$WORKDIR" && "$CCWRAP" capture --full --main-inference --claude-bin "$2" --timeout "$CAP_TIMEOUT" \
      ${CAP_HOST:+--host "$CAP_HOST"} ${CAP_PATH:+--path "$CAP_PATH"} \
      -- -p "$PROMPT" ${MODEL:+--model "$MODEL"} \
      < /dev/null > "$1/full.json.tmp" 2> "$1/capture.stderr" )
}

# classify_failure CAP_RC STDERR_FILE -> short reason
classify_failure() {
  local rc="$1" f="$2"
  if grep -q 'no request to' "$f" 2>/dev/null; then echo "timeout-no-request"; return; fi
  if grep -qiE 'find claude executable|start claude' "$f" 2>/dev/null; then echo "launch-failed"; return; fi
  if grep -qiE 'auth|502' "$f" 2>/dev/null; then echo "auth-missing"; return; fi
  echo "capture-failed(rc=$rc)"
}

# emit_ok_status harvests the classification fields from an existing
# $vdir/full.json and writes an ok status.json. Single source of the status
# schema, shared by the live capture path (run_one) and --reclassify.
#   args: VDIR V REGIME CLAUDE_BIN INSTALL_OK INSTALL_SECONDS CAPTURE_EXIT DURATION PRUNED
# is_quota_probe is the precise content fingerprint of Claude Code's auxiliary
# haiku "quota" call (a single user message exactly "quota" with max_tokens 1);
# is_main_inference is classified off it (main iff NOT the quota probe), which is
# exact and corpus-verified rather than inferred from tools/system counts.
# system_blocks + tools_count are kept as informational corroborators.
emit_ok_status() {
  local vdir="$1" v="$2" regime="$3" wrapper="$4" io="$5" ins_dt="$6" cap_rc="$7" dt="$8" pruned="$9"
  local at="${10:-}"; [ -n "$at" ] || at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"  # preserve on reclassify; now on live capture
  local http ja3 ja4 model sysblk tools isquota
  http="$(jq -r '.response.status // "?"' "$vdir/full.json" 2>/dev/null)"
  ja3="$(jq -r '.tls.ja3 // ""' "$vdir/full.json" 2>/dev/null)"
  ja4="$(jq -r '.tls.ja4 // ""' "$vdir/full.json" 2>/dev/null)"
  model="$(jq -r '.request.body.model // "?"' "$vdir/full.json" 2>/dev/null)"
  sysblk="$(jq -r '.request.body.system | if type=="array" then length elif .==null then 0 else 1 end' "$vdir/full.json" 2>/dev/null)"
  tools="$(jq -r '.request.body.tools | if type=="array" then length else 0 end' "$vdir/full.json" 2>/dev/null)"
  isquota="$(jq -r '(.request.body // {}) as $b
    | (($b.max_tokens==1)
       and (($b.messages|type=="array") and (($b.messages|length)==1))
       and ($b.messages[0].content=="quota")) // false' "$vdir/full.json" 2>/dev/null)"
  [ -n "$sysblk" ] || sysblk=0; [ -n "$tools" ] || tools=0; [ "$isquota" = true ] || isquota=false
  jq -n --arg v "$v" --arg rg "$regime" --arg cb "$wrapper" --argjson io "$io" \
        --argjson is "$ins_dt" --argjson cr "$cap_rc" --arg http "$http" --arg ja3 "$ja3" --arg ja4 "$ja4" \
        --arg model "$model" --argjson sb "$sysblk" --argjson tl "$tools" --argjson iq "$isquota" \
        --arg at "$at" --argjson dur "$dt" --argjson pr "$pruned" \
    '{version:$v,result:"ok",phase:"done",regime:$rg,claude_bin:$cb,install_ok:$io,install_seconds:$is,
      capture_exit:$cr,http_status:(($http|tonumber?) // $http),ja3:$ja3,ja4:$ja4,model_in_request:$model,
      system_blocks:$sb,tools_count:$tl,is_quota_probe:$iq,is_main_inference:($iq|not),
      captured_at:$at,duration_seconds:$dur,pruned:$pr,error:""}' | write_status "$vdir"
  # variants index: re-derive from the variants/ dir (the single source of truth),
  # so re-capture and --reclassify keep the index without --variant's help.
  if [ -d "$vdir/variants" ]; then
    local vlist vt
    vlist="$(ls "$vdir/variants" 2>/dev/null | jq -R . | jq -sc '[ .[] | select(endswith(".json")) | select(endswith(".status.json")|not) | sub("\\.json$";"") ] | sort')"
    if [ -n "$vlist" ] && [ "$vlist" != "[]" ]; then
      vt="$(mktemp)"
      jq --argjson vs "$vlist" '.variants = $vs' "$vdir/status.json" > "$vt" && mv -f "$vt" "$vdir/status.json"
    fi
  fi
}

# model_slug: filesystem-safe id for a pinned model. claude-fable-5[1m] -> claude-fable-5-1m
model_slug() { printf '%s' "$1" | sed 's/\[/-/g; s/\]//g; s/[^A-Za-z0-9._-]/-/g'; }

# emit_variant_status VDIR V SLUG MODEL -> writes variants/<slug>.status.json with the
# harvested fields + a model_axis_diff computed against the canonical full.json (the
# reliably-diffable parts: model, fallbacks, beta delta, body-key delta). Capture-timing
# noise (MCP connect-state, date) is deliberately NOT enumerated — normalize that in UI.
emit_variant_status() {
  local vdir="$1" v="$2" slug="$3" model="$4"
  local vf="$vdir/variants/$slug.json" cf="$vdir/full.json"
  [ -f "$cf" ] || cf=/dev/null   # no canonical -> $C becomes [] -> diff is skipped
  # captured_at: the variant's OWN capture day. The date sanitizer masks the
  # injected "Today's date" against the capture file's sibling status.json, so
  # a variant captured later than its canonical needs its own stamp.
  local at; at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  jq -n --slurpfile V "$vf" --slurpfile C "$cf" --arg v "$v" --arg slug "$slug" --arg model "$model" --arg at "$at" '
    def betas($r): (($r.request.headers["Anthropic-Beta"] // [])
                    | (if type=="array" then (.[0] // "") else tostring end)
                    | split(",") | map(select(length>0)));
    ($V[0]) as $vv | ($vv.request.body) as $vb |
    ( ($vb.max_tokens==1) and ($vb.messages|type=="array")
      and (($vb.messages|length)==1) and ($vb.messages[0].content=="quota") ) as $isq |
    {
      variant_id:$slug, base_version:$v, pinned_model:$model, is_default:false,
      captured_at:$at,
      model_in_request:$vb.model, http_status:$vv.response.status,
      ja3:$vv.tls.ja3, ja4:$vv.tls.ja4,
      system_blocks:($vb.system|length), tools_count:($vb.tools|length),
      is_quota_probe:$isq, is_main_inference:($isq|not),
      model_axis_diff: (
        if ($C|length) > 0 then
          ($C[0]) as $cc | ($cc.request.body) as $cb |
          { vs: ($cb.model + " (default)"),
            model: { from:$cb.model, to:$vb.model },
            fallbacks_added: ($vb.fallbacks != null and ($cb.fallbacks == null)),
            beta_added: (betas($vv) - betas($cc)),
            beta_removed: (betas($cc) - betas($vv)),
            body_keys_added: (($vb|keys) - ($cb|keys)),
            body_keys_removed: (($cb|keys) - ($vb|keys)) }
        else { vs: "(no canonical full.json to diff against)" } end )
    }' > "$vdir/variants/$slug.status.json"
}

run_one() {  # run_one VERSION INDEX TOTAL
  local v="$1" idx="$2" total="$3"
  local vdir="$ROOT/versions/$v"; mkdir -p "$vdir"
  local t0; t0="$(now_epoch)"
  # pessimistic default status (so an interrupt still leaves a record)
  printf '{"version":"%s","result":"fail","phase":"install","pruned":false}' "$v" | write_status "$vdir"

  local line="[$(printf '%3d' "$idx")/$total] ${C_BLD}$(printf '%-9s' "$v")${C_RST}"

  # ---- install ----
  local ins0; ins0="$(now_epoch)"
  run_with_timeout "$INSTALL_TIMEOUT" do_install "$v" "$vdir"
  local ins_rc=$? ins_dt=$(( $(now_epoch) - ins0 ))
  # tolerate nonzero exit; require a runnable binary next

  # ---- resolve binary (two-regime) ----
  local rt regime exec1 exec2 wrapper
  rt="$(resolve_target "$vdir")"; regime="${rt%%|*}"
  if [ "$regime" = fail ]; then
    say "$line ${C_DIM}install ${ins_dt}s${C_RST} → ${C_RED}✗ fail${C_RST}  resolve (no runnable bin; rc=$ins_rc)"
    logf "FAIL $v resolve (install rc=$ins_rc); see $vdir/install.log"
    printf '{"version":"%s","result":"fail","phase":"resolve","install_ok":%s,"install_seconds":%d,"error":"no runnable binary","pruned":false}' \
      "$v" "$([ $ins_rc -eq 0 ] && echo true || echo false)" "$ins_dt" | write_status "$vdir"
    return 1
  fi
  if [ "$regime" = native ]; then exec1="${rt#native|}"; wrapper="$(write_wrapper "$vdir" native "$exec1")"
  else exec1="$(echo "$rt" | cut -d'|' -f2)"; exec2="$(echo "$rt" | cut -d'|' -f3)"; wrapper="$(write_wrapper "$vdir" js "$exec1" "$exec2")"; fi

  # ---- capture ----
  say "$line ${C_DIM}[$(printf '%-3s' "$regime")] install ${ins_dt}s → capture …${C_RST}"
  run_with_timeout "$HARD_TIMEOUT" do_capture "$vdir" "$wrapper"
  local cap_rc=$?

  # ---- evaluate (judge by full.json, not exit code) ----
  local dt=$(( $(now_epoch) - t0 ))
  if valid_full_json "$vdir/full.json.tmp"; then
    mv -f "$vdir/full.json.tmp" "$vdir/full.json"
    local pruned=false
    if [ "$PRUNE" = 1 ]; then rm -rf "$vdir/node_modules" 2>/dev/null; pruned=true; : > "$vdir/capture.stderr"; fi
    emit_ok_status "$vdir" "$v" "$regime" "$wrapper" "$([ $ins_rc -eq 0 ]&&echo true||echo false)" "$ins_dt" "$cap_rc" "$dt" "$pruned"
    local http ja3 model
    http="$(jq -r '.http_status' "$vdir/status.json" 2>/dev/null)"
    ja3="$(jq -r '.ja3' "$vdir/status.json" 2>/dev/null)"
    model="$(jq -r '.model_in_request' "$vdir/status.json" 2>/dev/null)"
    say "$line ${C_DIM}[$(printf '%-3s' "$regime")] install ${ins_dt}s →${C_RST} ${C_GRN}✓ ok${C_RST}   HTTP $http  ja3=${ja3:0:16}…  $(fmt_dur $dt)"
    logf "OK $v regime=$regime http=$http model=$model dur=${dt}s"
    return 0
  else
    rm -f "$vdir/full.json.tmp"
    local reason; reason="$(classify_failure "$cap_rc" "$vdir/capture.stderr")"
    jq -n --arg v "$v" --arg rg "$regime" --arg cb "$wrapper" --argjson is "$ins_dt" --argjson cr "$cap_rc" \
          --arg er "$reason" --arg at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --argjson dur "$dt" \
      '{version:$v,result:"fail",phase:"capture",regime:$rg,claude_bin:$cb,install_ok:true,install_seconds:$is,
        capture_exit:$cr,error:$er,captured_at:$at,duration_seconds:$dur,pruned:false}' | write_status "$vdir"
    say "$line ${C_DIM}[$(printf '%-3s' "$regime")] install ${ins_dt}s →${C_RST} ${C_RED}✗ fail${C_RST}  $reason  $(fmt_dur $dt)"
    logf "FAIL $v regime=$regime $reason (see $vdir/capture.stderr)"
    return 1
  fi
}

# ----------------------------------------------------------------------------- manifest
checkpoint_manifest() {
  local started="$1"
  local files=( "$ROOT"/versions/*/status.json )
  [ -e "${files[0]}" ] || return 0   # no status files yet (e.g. interrupt before first version)
  jq -n --arg prompt "$PROMPT" --arg model "${MODEL:-default}" --arg started "$started" \
        --arg now "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg ccwrap "$CCWRAP" \
        '[inputs] as $st
         | { schema_version:1, generated_at:$now, started_at:$started, ccwrap:$ccwrap,
             prompt:$prompt, model_policy:$model,
             counts:{ total:($st|length),
                      ok:([$st[]|select(.result=="ok")]|length),
                      fail:([$st[]|select(.result=="fail")]|length),
                      main_inference:([$st[]|select(.result=="ok" and .is_main_inference==true)]|length),
                      auxiliary:([$st[]|select(.result=="ok" and (.is_main_inference!=true))]|length) },
             failed:[ $st[]|select(.result=="fail")|{version,phase,error} ],
             auxiliary_captures:[ $st[]|select(.result=="ok" and (.is_main_inference!=true))|{version,model:.model_in_request,http:.http_status} ],
             tls_groups:( [ $st[]|select(.result=="ok" and (.ja3//"")!="") ]
                          | group_by(.ja3) | map({ (.[0].ja3): [.[].version] }) | add ),
             versions:[ $st[]|.version ] }' \
    "${files[@]}" 2>/dev/null | atomic_write "$ROOT/manifest.json" \
    || logf "manifest checkpoint skipped (empty/invalid jq output; previous manifest kept)"
}

# ----------------------------------------------------------------------------- main
# Absolutise ROOT before anything derives paths from it: do_capture cd's into
# $WORKDIR before redirecting stdout to "$vdir/full.json.tmp", so a RELATIVE
# --root (vdir = corpus/versions/<v>) would resolve against the
# wrong dir after the cd and silently fail every capture. mkdir -p first so a
# not-yet-existing root still absolutises.
mkdir -p "$ROOT"; ROOT="$(cd "$ROOT" && pwd)"
WORKDIR="${WORKDIR:-$ROOT/_workdir}"   # capture cwd (default empty _workdir under root)
mkdir -p "$ROOT/versions" "$ROOT/_cache" "$WORKDIR"
WORKDIR="$(cd "$WORKDIR" && pwd)"      # same hazard if --workdir is relative
# npm cache: default to the GLOBAL cache so installs reuse already-downloaded
# tarballs (the big shared native deps like sharp download once) across runs.
# ($ROOT/_cache stays the harness's own version-list cache, separate from npm.)
NPM_CACHE="${NPM_CACHE:-$(npm config get cache 2>/dev/null)}"
case "$NPM_CACHE" in ''|null|undefined) NPM_CACHE="$ROOT/_cache";; esac
mkdir -p "$NPM_CACHE"
RUN_LOG="$ROOT/run.log"
CCWRAP="$(resolve_ccwrap)"
[ -z "$CCWRAP" ] && die "could not find ccwrap (use --ccwrap PATH)"

note "${C_BLD}ccwrap version-matrix${C_RST}  root=$ROOT"
preflight || { [ "$DRY_RUN" = 1 ] || die "preflight failed (see message above; --skip-preflight to override)"; }

VERSIONS=(); while IFS= read -r _line; do [ -n "$_line" ] && VERSIONS+=("$_line"); done < <(enumerate)
TOTAL=${#VERSIONS[@]}
[ "$TOTAL" -eq 0 ] && die "no versions selected"
note "${C_BLD}$TOTAL${C_RST} versions selected  prompt=\"$PROMPT\"  model=${MODEL:-<default>}  prune=$([ $PRUNE = 1 ]&&echo on||echo off)"

if [ "$DRY_RUN" = 1 ]; then
  note "${C_CYN}dry-run${C_RST} — would process:"
  local_done=0
  for v in "${VERSIONS[@]}"; do
    if valid_full_json "$ROOT/versions/$v/full.json"; then printf '  %-9s ⏭ skip (have full.json)\n' "$v" >&2; local_done=$((local_done+1))
    else printf '  %-9s ◻ pending\n' "$v" >&2; fi
  done
  note "summary: $((TOTAL-local_done)) pending, $local_done already captured"
  exit 0
fi

START_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"; START_EP="$(now_epoch)"
INTERRUPTED=0

# --reclassify: recompute status.json from the existing full.json for each
# selected version, without install/capture. For flaky-to-capture versions whose
# data is already on disk, this deterministically re-derives the classification
# (e.g. after the is_quota_probe judgment changed) instead of risking a re-run.
# --variant: capture ONE --only version pinned to --model as an overlay under
# versions/<v>/variants/, with a model_axis_diff vs the canonical. Not a new version.
if [ "$VARIANT" = 1 ]; then
  [ -n "$MODEL" ] || die "--variant requires --model <model> (the non-default model to pin)"
  [ "${#VERSIONS[@]}" -eq 1 ] || die "--variant requires --only <one version> (selected ${#VERSIONS[@]})"
  v="${VERSIONS[0]}"; vdir="$ROOT/versions/$v"; slug="$(model_slug "$MODEL")"
  mkdir -p "$vdir/variants"
  note "${C_BLD}variant${C_RST} — $v pinned to ${C_CYN}$MODEL${C_RST} → variants/$slug.json"
  run_with_timeout "$INSTALL_TIMEOUT" do_install "$v" "$vdir"
  rt="$(resolve_target "$vdir")"; regime="${rt%%|*}"
  [ "$regime" = fail ] && die "variant: no runnable binary for $v (see $vdir/install.log)"
  if [ "$regime" = native ]; then wrapper="$(write_wrapper "$vdir" native "${rt#native|}")"
  else wrapper="$(write_wrapper "$vdir" js "$(echo "$rt"|cut -d'|' -f2)" "$(echo "$rt"|cut -d'|' -f3)")"; fi
  vtmp="$(mktemp)"
  ( cd "$WORKDIR" && "$CCWRAP" capture --full --main-inference --claude-bin "$wrapper" --timeout "$CAP_TIMEOUT" \
      ${CAP_HOST:+--host "$CAP_HOST"} ${CAP_PATH:+--path "$CAP_PATH"} \
      -- -p "$PROMPT" --model "$MODEL" < /dev/null > "$vtmp" 2>/dev/null ) || true
  valid_full_json "$vtmp" || { rm -f "$vtmp"; die "variant capture failed ($v --model $MODEL) — check the model id, or add --skip-preflight"; }
  mv -f "$vtmp" "$vdir/variants/$slug.json"
  [ "$PRUNE" = 1 ] && rm -rf "$vdir/node_modules" 2>/dev/null
  emit_variant_status "$vdir" "$v" "$slug" "$MODEL"
  if [ -f "$vdir/status.json" ]; then
    vt="$(mktemp)"; jq --arg s "$slug" '.variants = (((.variants // []) + [$s]) | unique)' "$vdir/status.json" > "$vt" && mv -f "$vt" "$vdir/status.json"
  fi
  note "variant stored — $(jq -c '{model_in_request,http_status,is_main_inference,model:.model_axis_diff.model}' "$vdir/variants/$slug.status.json" 2>/dev/null)"
  exit 0
fi

if [ "$RECLASSIFY" = 1 ]; then
  note "${C_BLD}reclassify${C_RST} — recomputing status.json from existing full.json (no install/capture)"
  rc_ok=0; rc_skip=0
  for v in "${VERSIONS[@]}"; do
    vdir="$ROOT/versions/$v"
    if valid_full_json "$vdir/full.json"; then
      # preserve capture-context fields from the existing status.json
      rc_regime="$(jq -r '.regime // "?"' "$vdir/status.json" 2>/dev/null)"; [ -n "$rc_regime" ] || rc_regime="?"
      rc_cb="$(jq -r '.claude_bin // ""' "$vdir/status.json" 2>/dev/null)"
      rc_io="$(jq -r 'if .install_ok==true then true else false end' "$vdir/status.json" 2>/dev/null)"; [ "$rc_io" = true ] || rc_io=false
      rc_is="$(jq -r '.install_seconds // 0' "$vdir/status.json" 2>/dev/null)"; case "$rc_is" in ''|*[!0-9]*) rc_is=0;; esac
      rc_dur="$(jq -r '.duration_seconds // 0' "$vdir/status.json" 2>/dev/null)"; case "$rc_dur" in ''|*[!0-9]*) rc_dur=0;; esac
      rc_at="$(jq -r '.captured_at // ""' "$vdir/status.json" 2>/dev/null)"
      emit_ok_status "$vdir" "$v" "$rc_regime" "$rc_cb" "$rc_io" "$rc_is" 0 "$rc_dur" true "$rc_at"
      rc_ok=$((rc_ok+1))
      printf '  %-9s ✓ reclassified  is_quota_probe=%s is_main_inference=%s\n' \
        "$v" "$(jq -r '.is_quota_probe' "$vdir/status.json")" "$(jq -r '.is_main_inference' "$vdir/status.json")" >&2
    else
      rc_skip=$((rc_skip+1)); printf '  %-9s ◻ no valid full.json — left as-is\n' "$v" >&2
    fi
  done
  checkpoint_manifest "$START_UTC"
  note "reclassified $rc_ok, skipped $rc_skip; manifest updated"
  exit 0
fi

trap 'INTERRUPTED=1; note ""; note "${C_YEL}interrupted${C_RST} — flushing manifest; re-run to resume."; checkpoint_manifest "$START_UTC"; exit 130' INT TERM

OK=0; FAIL=0; SKIP=0; DONE=0
for i in "${!VERSIONS[@]}"; do
  v="${VERSIONS[$i]}"; idx=$((i+1))
  if [ "$FORCE" != 1 ] && valid_full_json "$ROOT/versions/$v/full.json"; then
    SKIP=$((SKIP+1)); say "[$(printf '%3d' "$idx")/$TOTAL] $(printf '%-9s' "$v") ${C_DIM}⏭ skip${C_RST}"; continue
  fi
  run_one "$v" "$idx" "$TOTAL" && OK=$((OK+1)) || FAIL=$((FAIL+1))
  DONE=$((DONE+1))
  checkpoint_manifest "$START_UTC"
  # periodic summary + ETA
  if [ $((idx % 5)) -eq 0 ] || [ "$idx" -eq "$TOTAL" ]; then
    el=$(( $(now_epoch) - START_EP ))
    if [ "$DONE" -gt 0 ]; then per=$(( el / DONE )); remain=$(( (TOTAL - idx) * per )); eta="$(fmt_dur $remain)"; else eta="?"; fi
    say "  ${C_DIM}── $OK ok · $FAIL fail · $SKIP skip · elapsed $(fmt_dur $el) · ETA ~$eta${C_RST}"
  fi
  # 429 backoff, else normal pace
  if [ -f "$ROOT/versions/$v/full.json" ] && [ "$(jq -r '.response.status//0' "$ROOT/versions/$v/full.json" 2>/dev/null)" = 429 ]; then
    note "${C_YEL}429 — backing off 60s${C_RST}"; sleep 60
  else sleep "$SLEEP"; fi
done

trap - INT TERM
checkpoint_manifest "$START_UTC"
EL=$(( $(now_epoch) - START_EP ))
note ""
note "${C_BLD}done${C_RST} — ${C_GRN}$OK ok${C_RST} · ${C_RED}$FAIL fail${C_RST} · ${C_DIM}$SKIP skip${C_RST} · $(fmt_dur $EL)"
note "corpus:   $ROOT/versions/<v>/full.json"
note "manifest: $ROOT/manifest.json   (jq '.counts, .failed, .tls_groups')"
[ "$FAIL" -gt 0 ] && note "failures: jq -r '.failed[]|\"\\(.version)  \\(.phase)  \\(.error)\"' $ROOT/manifest.json"
exit 0
