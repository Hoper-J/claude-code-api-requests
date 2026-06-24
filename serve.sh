#!/bin/bash
# One-command local preview: rebuild the site data when the corpus is newer,
# then serve site/public/ (the exact directory Cloudflare Pages publishes)
# and open the browser.
#
#   ./serve.sh                 # http://localhost:4173/
#   PORT=8080 ./serve.sh       # custom port
#   ./serve.sh --no-open       # don't open the browser (CI/agents)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-4173}"

# data.js (and the /data JSON API) are build output — refresh when missing or
# older than the corpus manifest. One build-data run writes both.
if [ ! -f "$HERE/site/public/data.js" ] || [ "$HERE/corpus/manifest.json" -nt "$HERE/site/public/data.js" ]; then
  echo "[serve] corpus is newer than site data — rebuilding…"
  node "$HERE/site/scripts/build-data.js" "$HERE/corpus" --emit-json "$HERE/site/public/data"
fi

# changelog artifacts — refresh when missing or older than their sources
# (official snapshot / manifest for the EN data, translation map for zh).
if [ ! -f "$HERE/site/public/changelog-data.js" ] \
   || [ "$HERE/corpus/changelog/CHANGELOG.md" -nt "$HERE/site/public/changelog-data.js" ] \
   || [ "$HERE/corpus/manifest.json" -nt "$HERE/site/public/changelog-data.js" ]; then
  echo "[serve] changelog snapshot is newer than site data — rebuilding…"
  node "$HERE/site/scripts/build-changelog.js"
fi
if [ ! -f "$HERE/site/public/changelog-zh.js" ] \
   || [ "$HERE/site/i18n/changelog-zh.map.json" -nt "$HERE/site/public/changelog-zh.js" ] \
   || [ "$HERE/site/public/changelog-data.js" -nt "$HERE/site/public/changelog-zh.js" ]; then
  echo "[serve] zh translation map is newer than site data — rebaking…"
  node "$HERE/site/scripts/build-changelog-zh.js"
fi

exec node "$HERE/site/scripts/serve.js" --port "$PORT" "$@"
