#!/bin/bash
# Poll npm for new Claude Code 2.x releases; when any are missing from the
# corpus, capture them (capture.sh auto-sanitizes at the end), refresh the
# official changelog snapshot (corpus/changelog/), and rebuild the site data
# (data.js + changelog artifacts). Designed for launchd/cron: quiet and cheap
# when nothing is new.
#
# Usage:
#   capture/watch-versions.sh                     # one poll/update cycle
#   capture/watch-versions.sh --push              # also commit corpus (versions +
#                                                 # manifest + changelog snapshot) + push
#                                                 # (skipped unless a git remote exists)
#   capture/watch-versions.sh --install-launchd [seconds]
#       Generate ~/Library/LaunchAgents/com.lineage.watch-versions.plist
#       (default interval 3600s) and print the enable/disable commands.
#       Activation is left to you — it schedules real API captures.
#
# Exit codes: 0 = nothing new / updated OK / another run in progress;
#             1 = update attempted but capture or rebuild failed.
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
PROJ="$(cd "$HERE/.." && pwd)"
CORPUS="$PROJ/corpus"
PKG="@anthropic-ai/claude-code"
CACHE="$CORPUS/_cache"
LOCK="$CACHE/watch.lock"
LOG="$CACHE/watch.log"
mkdir -p "$CACHE"
say() { printf '%s %s\n' "$(date '+%F %T')" "$*" | tee -a "$LOG"; }

# ---- --install-launchd: emit a per-machine plist (absolute paths stay local) ----
if [ "${1:-}" = "--install-launchd" ]; then
  INTERVAL="${2:-3600}"
  PLIST="$HOME/Library/LaunchAgents/com.lineage.watch-versions.plist"
  mkdir -p "$HOME/Library/LaunchAgents"
  cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.lineage.watch-versions</string>
  <key>ProgramArguments</key><array>
    <string>/bin/bash</string>
    <string>$HERE/watch-versions.sh</string>
    <string>--push</string>
  </array>
  <key>StartInterval</key><integer>$INTERVAL</integer>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
  <key>EnvironmentVariables</key><dict>
    <key>PATH</key><string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
</dict></plist>
EOF
  echo "wrote $PLIST (interval ${INTERVAL}s, runs with --push)"
  echo "enable:  launchctl load \"$PLIST\""
  echo "disable: launchctl unload \"$PLIST\""
  exit 0
fi

PUSH=0
[ "${1:-}" = "--push" ] && PUSH=1

# ---- single-runner lock (mkdir is atomic) ----
if ! mkdir "$LOCK" 2>/dev/null; then
  say "another watch run is in progress — skipping"
  exit 0
fi
trap 'rmdir "$LOCK" 2>/dev/null' EXIT

# ---- discover: npm 2.x versions vs corpus manifest ----
MISSING="$(npm view "$PKG" versions --json 2>/dev/null | node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  let all; try { all=JSON.parse(s); } catch(e) { process.exit(2); }
  const cmp=(a,b)=>{const x=a.split(".").map(Number),y=b.split(".").map(Number);
    for(let i=0;i<3;i++){if((x[i]||0)!==(y[i]||0))return (x[i]||0)-(y[i]||0)}return 0};
  const have=new Set(require(process.argv[1]).versions);
  const missing=all.filter(v=>/^2\.\d+\.\d+$/.test(v)&&!have.has(v)).sort(cmp);
  console.log(missing.join(" "));
});' "$CORPUS/manifest.json")" || { say "npm/registry unreachable — will retry next cycle"; exit 0; }

if [ -z "$MISSING" ]; then
  say "up to date ($(node -e 'const m=require(process.argv[1]);console.log(m.versions.length+" versions, newest "+m.versions.map(v=>v.split(".").map(Number)).sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]).pop().join("."))' "$CORPUS/manifest.json"))"
  exit 0
fi

say "new version(s) on npm: $MISSING — capturing"

# ---- capture missing versions (engine skips existing; capture.sh auto-sanitizes) ----
if ! bash "$HERE/capture.sh" --refresh-versions --skip-preflight >>"$LOG" 2>&1; then
  say "capture FAILED for: $MISSING — see $LOG"
  exit 1
fi

# ---- rebuild local site data (Pages rebuilds its own at deploy time) ----
if ! node "$PROJ/site/scripts/build-data.js" "$CORPUS" >>"$LOG" 2>&1; then
  say "data rebuild FAILED — see $LOG"
  exit 1
fi
say "captured + sanitized + data.js rebuilt: $MISSING"

# ---- refresh the official changelog snapshot + rebuild its artifacts ----
# Non-fatal: the committed snapshot keeps the site consistent if the fetch
# fails; new versions just show the "no entry" state until the next run.
if curl -sfL --max-time 60 https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md \
     -o "$PROJ/corpus/changelog/CHANGELOG.md.tmp" >>"$LOG" 2>&1 \
   && [ -s "$PROJ/corpus/changelog/CHANGELOG.md.tmp" ]; then
  mv "$PROJ/corpus/changelog/CHANGELOG.md.tmp" "$PROJ/corpus/changelog/CHANGELOG.md"
  node "$PROJ/site/scripts/build-changelog.js" >>"$LOG" 2>&1 \
    && node "$PROJ/site/scripts/build-changelog-zh.js" >>"$LOG" 2>&1 \
    || say "changelog rebuild FAILED (data.js unaffected) — see $LOG"
else
  rm -f "$PROJ/corpus/changelog/CHANGELOG.md.tmp"
  say "changelog fetch failed — keeping committed snapshot"
fi

# ---- rebuild the committed offline single-file (non-fatal; its gates re-check PII) ----
OFFLINE_OK=0
if node "$PROJ/site/scripts/build-offline.js" >>"$LOG" 2>&1; then
  OFFLINE_OK=1; say "offline single-file rebuilt: claude-code-api-requests-offline.html"
else
  say "offline rebuild FAILED (corpus/data unaffected) — see $LOG"
fi

# ---- optional commit + push (pre-commit hook re-checks PII) ----
if [ "$PUSH" = 1 ]; then
  if git -C "$PROJ" remote | grep -q .; then
    git -C "$PROJ" add corpus/versions corpus/manifest.json corpus/changelog/CHANGELOG.md
    [ "$OFFLINE_OK" = 1 ] && git -C "$PROJ" add claude-code-api-requests-offline.html
    if git -C "$PROJ" commit -m "corpus: add $MISSING" >>"$LOG" 2>&1; then
      git -C "$PROJ" push >>"$LOG" 2>&1 && say "pushed: corpus: add $MISSING" \
        || say "push FAILED (commit kept locally) — see $LOG"
    else
      say "nothing to commit (corpus unchanged?)"
    fi
  else
    say "--push requested but no git remote configured — skipped"
  fi
fi
