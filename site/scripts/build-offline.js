/* ============================================================
   Lineage — self-contained offline artifact builder
   ------------------------------------------------------------
   Usage:
     node site/scripts/build-offline.js [--help]

   Produces claude-code-api-requests-offline.html at the repo root — the whole
   teaching site flattened into ONE file that opens via file:// with zero network:
   - re-runs the three GATED data builders first (never trusts what's on
     disk), then inlines data with an HTML-parser escaping pass;
   - precompiles the JSX sources with the vendored Babel (build-time
     only — the 3.1MB compiler does NOT ship) and inlines production
     React UMDs (vendored, hash-pinned — see ../vendor/README.md);
   - flattens the @import CSS chain, embeds fonts/favicon as data: URIs;
   - injects a pre-paint theme script, a static splash, <noscript>, an
     offline footer flag, and a licenses/colophon block (React MIT
     headers travel inside the inlined files; OFL text embedded);
   - refuses to write unless every gate passes: vendor sha384 pins,
     WHATWG script-data closure simulation over every script element,
     no-external-reference scan, license presence, PII scan, freshness
     (embedded COUNTS.total == corpus/manifest.json).

   Deterministic: the build stamp derives from corpus/manifest.json
   (no wall-clock), so same inputs → same artifact.
   ============================================================ */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..");
const PUB = path.join(ROOT, "site", "public");
const VENDOR = path.join(ROOT, "site", "vendor");

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`usage: node site/scripts/build-offline.js

  Builds claude-code-api-requests-offline.html at the repo root (self-contained, file://-ready).
  Re-runs the gated data builders, precompiles JSX via vendored Babel (build-time
  only), inlines vendored production React, and hard-fails unless all artifact
  gates pass (vendor pins, script-closure simulation, no external refs, licenses,
  PII, freshness). Vendor provenance: site/vendor/README.md.`);
  process.exit(0);
}

const read = (p) => fs.readFileSync(p, "utf8");
const fail = (msg) => { console.error("x build-offline: " + msg); process.exit(1); };

/* ---- 1. vendor pins (must match site/vendor/README.md) ---- */
const PINS = {
  "react.production.min.js": "DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z",
  "react-dom.production.min.js": "gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1",
  "babel.min.js": "m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y",
};
for (const [f, want] of Object.entries(PINS)) {
  const got = crypto.createHash("sha384").update(fs.readFileSync(path.join(VENDOR, f))).digest("base64");
  if (got !== want) fail(`vendor pin mismatch for ${f}\n  want sha384-${want}\n  got  sha384-${got}`);
}
console.log("vendor pins OK (3 files)");

/* ---- 2. rebuild the gated data (gates run by construction) ---- */
for (const cmd of [
  ["site/scripts/build-data.js", path.join(ROOT, "corpus")],
  ["site/scripts/build-changelog.js"],
  ["site/scripts/build-changelog-zh.js"],
]) {
  execFileSync(process.execPath, [path.join(ROOT, cmd[0]), ...cmd.slice(1)], { stdio: "inherit" });
}

/* ---- 3. stamps & freshness inputs ---- */
const manifest = JSON.parse(read(path.join(ROOT, "corpus", "manifest.json")));
const BUILT = String(manifest.generated_at || "").slice(0, 10) || fail("manifest.generated_at missing");
const TOTAL = manifest.counts.total;

/* ---- 4. CSS: flatten @import chain, embed fonts as data: URIs ---- */
function flattenCss() {
  const cssDir = PUB;
  let out = "";
  for (const m of read(path.join(cssDir, "styles.css")).matchAll(/@import\s+url\("([^"]+)"\);/g)) {
    let css = read(path.join(cssDir, m[1]));
    css = css.replace(/url\("\.\.\/assets\/fonts\/([^"]+)"\)/g, (_, f) => {
      const b64 = fs.readFileSync(path.join(PUB, "assets", "fonts", f)).toString("base64");
      return `url("data:font/woff2;base64,${b64}")`;
    });
    out += `/* —— ${m[1]} —— */\n` + css + "\n";
  }
  if (/@import|url\(\s*["']?\.\./.test(out)) fail("CSS flatten left an unresolved @import or relative url()");
  return out;
}

/* ---- 5. JSX precompile via vendored Babel (classic scripts) ---- */
const Babel = require(path.join(VENDOR, "babel.min.js"));
function compileJsx(name) {
  const src = read(path.join(PUB, name));
  const code = Babel.transform(src, { presets: ["react"], sourceType: "script", compact: false }).code;
  for (const re of [/<\/script/i, /<!--/, /<script/i]) {
    if (re.test(code)) fail(`${name}: compiled output contains ${re} — split the string literal ("</scr"+"ipt>") in the source`);
  }
  return code;
}

/* ---- 6. data payloads: HTML-parser escaping (safe inside JSON strings) ---- */
function escapeDataJs(name) {
  return read(path.join(PUB, name))
    .replace(/<\//g, "<\\/")
    .replace(/<!--/g, "<\\!--")
    .replace(/<(script)/gi, "<\\$1");
}

/* ---- 7. WHATWG script-data closure simulation (gate) ---- */
/* States: DATA → (<!--) → ESC → (<script[\s/>]) → DESC; ESC/DESC --> back.
   CLOSE fires on </script[\s/>] in DATA or ESC; in DESC it returns to ESC. */
function scriptCloseGate(html) {
  const lower = html.toLowerCase();
  let i = 0, n = 0;
  while (true) {
    const open = lower.indexOf("<script", i);
    if (open < 0) break;
    const tagEnd = lower.indexOf(">", open);
    if (tagEnd < 0) fail("unterminated <script> tag");
    let st = "DATA", j = tagEnd + 1, close = -1;
    while (j < lower.length) {
      if (st !== "DESC" && lower.startsWith("</script", j) && /[\s/>]/.test(lower[j + 8] || "")) { close = j; break; }
      if (st === "DESC" && lower.startsWith("</script", j) && /[\s/>]/.test(lower[j + 8] || "")) { st = "ESC"; j += 8; continue; }
      if (st === "DATA" && lower.startsWith("<!--", j)) { st = "ESC"; j += 4; continue; }
      if (st === "ESC" && lower.startsWith("-->", j)) { st = "DATA"; j += 3; continue; }
      if (st === "DESC" && lower.startsWith("-->", j)) { st = "DATA"; j += 3; continue; }
      if (st === "ESC" && lower.startsWith("<script", j) && /[\s/>]/.test(lower[j + 7] || "")) { st = "DESC"; j += 7; continue; }
      j++;
    }
    if (close < 0) fail(`script #${n + 1} (offset ${open}) never closes — parser would swallow the rest of the file`);
    const intended = lower.indexOf("</script>", tagEnd);
    if (close !== intended) fail(`script #${n + 1} (offset ${open}) closes at ${close}, intended ${intended} — content needs escaping`);
    n++; i = close + 9;
  }
  return n;
}

/* ---- 8. assemble from the live index.html template ---- */
let html = read(path.join(PUB, "index.html"));
const css = flattenCss();
const favicon = "data:image/svg+xml;base64," + fs.readFileSync(path.join(PUB, "assets", "lineage-mark.svg")).toString("base64");
const ofl = read(path.join(PUB, "assets", "fonts", "LICENSE-OFL.md"));

const themeScript = `<script>try{var t=localStorage.getItem("lineage-theme");if(t)document.documentElement.setAttribute("data-theme",t);}catch(e){}</script>`;
const splash = `<div id="root"><div role="status" style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:var(--bg-app);color:var(--text-faint)">
  <svg width="36" height="36" viewBox="0 0 32 32" fill="none" style="color:var(--text-strong);animation:linpulse 1.2s ease-in-out infinite"><line x1="9" y1="4.5" x2="9" y2="27.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M9 16 C 9 21, 14 20, 23 20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/><circle cx="9" cy="6.5" r="3.4" fill="var(--bg-app)" stroke="currentColor" stroke-width="2.2"/><circle cx="9" cy="25.5" r="3.4" fill="var(--bg-app)" stroke="currentColor" stroke-width="2.2"/><circle cx="24.5" cy="20" r="3.4" fill="var(--brand,#c2410c)"/></svg>
  <div style="font-family:var(--font-ui,sans-serif);font-size:13px">loading the corpus · 正在载入语料 (${TOTAL} versions)</div>
  <style>@keyframes linpulse{0%,100%{opacity:1}50%{opacity:.45}}</style>
</div></div>
<noscript><div style="font-family:sans-serif;padding:40px;text-align:center">Claude Code API Requests — offline archive. This file requires JavaScript. 本离线存档需要启用 JavaScript。</div></noscript>`;

const colophon = `<details style="max-width:1200px;margin:0 auto;padding:10px 24px 40px;font-family:sans-serif;font-size:12px;color:#888">
  <summary style="cursor:pointer">Licenses &amp; colophon · 许可与出处</summary>
  <div style="line-height:1.6;margin-top:10px">
    <p><strong>Claude Code API Requests — offline archive.</strong> Built ${BUILT} from a corpus of ${TOTAL} captured Claude Code versions.
    Online version: <a href="https://api-requests.cc">api-requests.cc</a> ·
    Repository: <a href="https://github.com/Hoper-J/claude-code-api-requests">github.com/Hoper-J/claude-code-api-requests</a> (MIT — covers the code and site, <em>not</em> the corpus content).</p>
    <p>The corpus quotes, verbatim and for educational/research purposes, API requests produced by the Claude Code CLI; system prompts, tool
    definitions and the quoted CHANGELOG are © Anthropic. 语料内容仅作教学与研究用途逐字呈现，权利方有异议提交 issue 即移除。</p>
    <p>Bundled libraries: React and ReactDOM 18.3.1 (MIT, © Meta Platforms — license headers retained inside the embedded files).
    JSX was precompiled at build time; no compiler ships in this file.</p>
    <p>Embedded fonts: Newsreader, Hanken Grotesk, JetBrains Mono — SIL Open Font License 1.1:</p>
    <pre style="white-space:pre-wrap;background:#f4f4f4;color:#555;padding:12px;border-radius:6px;max-height:240px;overflow:auto">${ofl.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>
  </div>
</details>`;

// All content injections use FUNCTION replacements: a replacement STRING
// re-interprets $-patterns ($', $&, $1…) and minified JS is full of them —
// string form would splice the template into itself.
const inject = (re, content, what) => {
  if (!re.test(html)) fail(`template anchor not found: ${what}`);
  html = html.replace(re, () => content);
};
// head: favicon → data URI; stylesheet → inline; pre-paint theme script first
inject(/<link rel="icon"[^>]*>/, themeScript + `\n<link rel="icon" type="image/svg+xml" href="${favicon}">`, "favicon link");
inject(/<link rel="stylesheet"[^>]*>/, `<style>\n${css}</style>`, "stylesheet link");
// body: splash + noscript
inject(/<div id="root"><\/div>/, splash, "#root");
// vendor: three self-hosted tags → two inline production UMDs (Babel dropped — JSX is precompiled below)
inject(/<script src="vendor\/react\.production\.min\.js"[^>]*><\/script>\s*/, `<script>\n${read(path.join(VENDOR, "react.production.min.js"))}\n</script>\n`, "react vendor tag");
inject(/<script src="vendor\/react-dom\.production\.min\.js"[^>]*><\/script>\s*/, `<script>\n${read(path.join(VENDOR, "react-dom.production.min.js"))}\n</script>\n`, "react-dom vendor tag");
inject(/\s*<script src="vendor\/babel\.min\.js"[^>]*><\/script>/, "", "babel vendor tag"); // precompiled — no compiler ships
// data payloads (escaped) + offline flag
inject(/<script src="data\.js"><\/script>/, `<script>\n${escapeDataJs("data.js")}\n</script>`, "data.js tag");
inject(/<script src="changelog-data\.js"><\/script>/, `<script>\n${escapeDataJs("changelog-data.js")}\n</script>`, "changelog-data tag");
inject(/<script src="changelog-zh\.js"><\/script>/, `<script>\n${escapeDataJs("changelog-zh.js")}\n</script>\n<script>window.LINEAGE_OFFLINE={built:"${BUILT}",versions:${TOTAL}};</script>`, "changelog-zh tag");
// app sources: precompiled, plain scripts, same order
for (const f of ["kit-lib.jsx", "locales.jsx", "App.jsx"]) {
  const re = new RegExp(`<script type="text/babel"[^>]*src="${f.replace(".", "\\.")}"></script>`);
  inject(re, `<script>\n${compileJsx(f)}\n</script>`, f);
}
// colophon before </body>; provenance comment at byte 0
inject(/<\/body>/, colophon + "\n</body>", "</body>");
html = `<!-- Claude Code API Requests · offline archive · built ${BUILT} · ${TOTAL} versions · https://api-requests.cc · https://github.com/Hoper-J/claude-code-api-requests -->\n` + html;

/* ---- 9. artifact gates ---- */
const scripts = scriptCloseGate(html);
console.log(`script-closure gate OK (${scripts} script elements)`);

{ const m = html.match(/<script[^>]*\ssrc=[^>]*>/i); if (m) fail("external <script src=> survived: " + m[0].slice(0, 120)); }
// rel="canonical" is metadata (never fetched) and intentionally points at the
// live site for provenance; every other <link> must be a data: URI.
{ const m = html.match(/<link(?![^>]*rel="canonical")[^>]+href="(?!data:)[^>]*>/i); if (m) fail("external <link href=> survived: " + m[0].slice(0, 100)); }
if (/url\(\s*["']?(?!data:)[^)]*\.(woff2|png|svg|css)/i.test(html)) fail("external url() survived in CSS");
if (/integrity=/.test(html)) fail("stray integrity attribute");
console.log("no-external-reference gate OK");

for (const [label, re] of [
  ["React license", /@license React/],
  ["OFL text", /SIL OPEN FONT LICENSE/i],
  ["Anthropic content notice", /© Anthropic/],
  ["repo link", /github\.com\/Hoper-J\/claude-code-api-requests/],
]) if (!re.test(html)) fail(`license/colophon gate: missing ${label}`);
console.log("license gate OK");

const os = require("os");
const piiRules = [
  ["operator home path", new RegExp(os.homedir().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))],
  ["live sk-ant token", /sk-ant-[A-Za-z0-9_-]{8,}/],
  ["non-anthropic email", /[A-Za-z0-9._%+-]+@(?!anthropic\.com\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/],
];
for (const [label, re] of piiRules) { const m = html.match(re); if (m) fail(`PII gate: ${label}: ${m[0].slice(0, 60)}`); }
console.log("PII gate OK");

const totalInData = (html.match(/"COUNTS":\{"total":(\d+)/) || [])[1];
if (Number(totalInData) !== TOTAL) fail(`freshness gate: embedded total ${totalInData} != manifest ${TOTAL}`);
console.log(`freshness gate OK (${TOTAL} versions)`);

/* ---- 10. write — committed deliverable at the repo ROOT with a stable name,
   overwritten in place (no churn); the build date + version count live in the
   page colophon, not the filename. ---- */
const outName = "claude-code-api-requests-offline.html";
const outPath = path.join(ROOT, outName);
fs.writeFileSync(outPath, html);
const sha = crypto.createHash("sha256").update(html).digest("hex");
fs.writeFileSync(outPath + ".sha256", sha + "  " + outName + "\n");
console.log(`wrote ${outName} (${TOTAL}v · built ${BUILT}) — ${(Buffer.byteLength(html) / 1048576).toFixed(2)}MB · sha256 ${sha.slice(0, 16)}…`);
