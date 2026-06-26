#!/bin/bash
# Self-contained corpus capture for claude-code-api-requests.
#
# Runs the version-matrix engine against THIS project's ./corpus, using the
# tracked example artifacts as the capture environment — no switching to the
# ccwrap repo, no cp. ccwrap is an EXTERNAL CLI dependency; provide it via:
#   npm i -g @hoper-j/ccwrap (→ PATH)  |  --ccwrap <path>  |  CCWRAP_BIN=<path>  |  ~/ccwrap/ccwrap
#
# ── ONE-TIME (isolated login, your own account, separate from real ~/.claude) ──
#   mkdir -p ~/.claude-demo-capture
#   CLAUDE_CONFIG_DIR=~/.claude-demo-capture claude login
#
# ── USE (args pass through to the engine) ──
#   capture/capture.sh --only "2.1.169" --refresh-versions --force --skip-preflight
#   capture/capture.sh --force --skip-preflight                  # full re-capture
#   capture/capture.sh --reclassify              # recompute status from existing full.json
#
# Default uses the official npm registry. Slow networks (e.g. mainland China) may
# add: --registry https://registry.npmmirror.com (optional; speeds install only).
#
# Every run ends with an automatic in-place PII sanitize of ./corpus
# (sanitize/sanitize.js, idempotent). Skip it with --no-sanitize (debug only —
# raw captures carry operator PII; the pre-commit gate will still block commits).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
PROJ="$(cd "$HERE/.." && pwd)"
CORPUS="$PROJ/corpus"
ARTIFACTS="$CORPUS/example-artifacts"
WORKDIR="/tmp/example"
CFG="${CCWRAP_DEMO_CONFIG_DIR:-$HOME/.claude-demo-capture}"
MEM_DST="$CFG/projects/-private-tmp-example/memory"   # /tmp/example → /private/tmp/example

# Resolve the external `ccwrap` CLI. Install it with `npm i -g @hoper-j/ccwrap`
# (ships a prebuilt per-platform binary, lands on PATH). Discovery order:
# CCWRAP_BIN -> PATH -> ~/ccwrap/ccwrap -> sibling ../ccwrap/ccwrap -> --ccwrap arg.
# Exports CCWRAP_BIN for the engine.
ensure_ccwrap() {
  local cc="${CCWRAP_BIN:-}"
  [ -z "$cc" ] && cc="$(command -v ccwrap 2>/dev/null || true)"
  if [ -z "$cc" ]; then
    for c in "$HOME/ccwrap/ccwrap" "$PROJ/../ccwrap/ccwrap"; do
      [ -x "$c" ] && { cc="$c"; break; }
    done
  fi
  if [ -n "$cc" ] && [ -x "$cc" ]; then export CCWRAP_BIN="$cc"; return 0; fi
  for a in "$@"; do [ "$a" = "--ccwrap" ] && return 0; done   # engine gets it via --ccwrap

  cat >&2 <<EOF
ccwrap (external capture CLI) not found. Install it by one of:
  • npm (prebuilt, recommended):  npm i -g @hoper-j/ccwrap
  • build from source:  git clone https://github.com/Hoper-J/ccwrap && cd ccwrap && go build -o ccwrap ./cmd/ccwrap
  • then re-run, or pass:  --ccwrap /path/to/ccwrap   (or export CCWRAP_BIN=/path/to/ccwrap)
EOF
  exit 1
}

[ -d "$ARTIFACTS" ] || { echo "ERROR: missing example artifacts: $ARTIFACTS" >&2; exit 1; }

# isolated config must be logged in
if [ ! -d "$CFG" ] || [ -z "$(ls -A "$CFG" 2>/dev/null)" ]; then
  echo "ERROR: isolated config dir '$CFG' is missing/empty — you are not logged in there." >&2
  echo "  mkdir -p \"$CFG\"" >&2
  echo "  CLAUDE_CONFIG_DIR=\"$CFG\" claude login" >&2
  exit 1
fi

ensure_ccwrap "$@"   # resolve ccwrap (or print an install hint) before doing any work

# Build the capture workdir from the tracked example artifacts (idempotent).
# memory-snapshot belongs in CLAUDE_CONFIG_DIR, not the workdir.
mkdir -p "$WORKDIR"
cp -R "$ARTIFACTS/." "$WORKDIR/"
rm -rf "$WORKDIR/memory-snapshot" "$WORKDIR/.DS_Store"
mkdir -p "$MEM_DST"
cp -f "$ARTIFACTS/memory-snapshot/"*.md "$MEM_DST/" 2>/dev/null || true

# --no-sanitize is ours, not the engine's — filter it out of the pass-through args.
# --help just prints the engine usage: skip the sanitize tail (nothing was captured).
SANITIZE=1
HELP=0
PROFILE=official          # corpus default; the ambient CCWRAP_PROFILE is deliberately ignored
ARGS=()
WANT_PROFILE=0
for a in "$@"; do
  if [ "$WANT_PROFILE" = 1 ]; then PROFILE="$a"; WANT_PROFILE=0; continue; fi
  case "$a" in
    --no-sanitize) SANITIZE=0 ;;
    --profile)     WANT_PROFILE=1 ;;        # explicit per-run override (testing only)
    --help|-h)     HELP=1; ARGS+=("$a") ;;
    *)             ARGS+=("$a") ;;
  esac
done

export CLAUDE_CONFIG_DIR="$CFG"
# Captures default to the official Anthropic profile (passthrough, claude's own OAuth).
# The operator's default/ambient ccwrap profile may be a third-party gateway whose auth
# override strips the oauth-2025-04-20 beta and yields a non-faithful request — so we set
# CCWRAP_PROFILE explicitly here, IGNORING any ambient value, to keep an interactively-set
# profile from silently leaking into the corpus. Override per-run for testing only with
# `capture.sh --profile <name>` (do NOT commit non-official captures).
export CCWRAP_PROFILE="$PROFILE"
echo "[capture] corpus=$CORPUS  config=$CFG  workdir=$WORKDIR  profile=$CCWRAP_PROFILE  (real ~/.claude untouched)"
rc=0
bash "$HERE/capture-version-matrix.sh" --root "$CORPUS" --workdir "$WORKDIR" ${ARGS[@]+"${ARGS[@]}"} || rc=$?

# ── auto-sanitize: fresh captures land with raw PII; scrub before anything can commit ──
# Runs even when the engine failed mid-run (partial captures are raw too).
if [ "$HELP" = 1 ]; then
  exit "$rc"
elif [ "$SANITIZE" = 1 ]; then
  echo "[capture] sanitizing corpus in place (idempotent) …"
  if ! node "$PROJ/sanitize/sanitize.js" --corpus "$CORPUS"; then
    echo "ERROR: sanitize failed — corpus may still contain raw PII; do NOT git add." >&2
    echo "       fix and re-run:  node sanitize/sanitize.js" >&2
    exit 1
  fi
else
  echo "[capture] --no-sanitize: corpus left RAW (operator PII on disk); run 'node sanitize/sanitize.js' before committing." >&2
fi
exit "$rc"
