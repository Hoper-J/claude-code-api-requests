/* ============================================================
   sanitize — in-place corpus PII scrubbing (node, no deps)

   Usage:
     node sanitize/sanitize.js            # sanitize corpus/ in place (idempotent)
     node sanitize/sanitize.js --check    # scan only; exit(1) on any residual PII
     node sanitize/sanitize.js --corpus <dir>   # corpus dir (default ../corpus)

   Targets (the files git tracks):
     versions/<v>/full.json
     versions/<v>/status.json
     versions/<v>/variants/*.json + *.status.json
     manifest.json
   Not touched (stay gitignored): install.log / capture.stderr /
     claude-wrapper.sh / _cache/ / _workdir/ / run.log.

   Rules (shape-identical to the sanitize() in the site pipeline,
   site/scripts/build-data.js — change either side and you MUST sync
   the other; the guarded invariant is that data.js built before and
   after corpus sanitization is byte-identical):
   1. Every string value: /Users/<…> paths → <homedir>; emails → <email>;
      real sk-ant tokens → <token> (ccwrap's ‹redacted› markers untouched).
   2. request.body.metadata.user_id → same-shape mask, preserving original
      length and key order:
      - unparseable string        → "<user_id>(159 chars)"
      - JSON-string object        → each value "<key>(N chars)", re-stringified
   3. Request headers X-Claude-Code-Session-Id / X-Client-Request-Id
      (session/request uuids) → <masked>(N chars). The display pipeline
      DROPs them anyway.
   4. TLS: **pseudonymized, not dropped** (keeps the grouping structure;
      the UI never displays TLS by project decision):
      - ja3 / ja4 / peetprint (6 distinct values each across the corpus =
        6 stack groups) → stable group labels <ja3#1>…, numbered by first
        appearance in semver order; full.json tls.*, status.json top-level
        ja3/ja4, and manifest.tls_groups keys share one mapping.
      - clienthello_hex (raw ClientHello bytes; contains per-connection
        client random / key shares — 217 captures, 217 distinct values)
        → <clienthello_hex>(N chars).
      - The raw-value → label mapping is stored in sanitize/.tls-map.json
        (gitignored, machine-local) so incremental captures keep stable
        numbering; if the map is lost, new values just get fresh numbers.

   Idempotent: already-masked values (placeholders/labels) pass through;
   a second run rewrites 0 files.
   ============================================================ */

const fs = require("fs");
const path = require("path");
const os = require("os");

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`usage: node sanitize/sanitize.js [--check] [--corpus <dir>]

  (no flags)      sanitize the corpus in place (idempotent; safe to re-run)
  --check         scan only, write nothing; exit 1 on any residual PII
                  (state scan over versions/ + manifest — the pre-commit/CI gate)
  --corpus <dir>  corpus directory (default: ../corpus)`);
  process.exit(0);
}
const CHECK = args.includes("--check");
const ci = args.indexOf("--corpus");
const CORPUS = ci >= 0 ? args[ci + 1] : path.join(__dirname, "..", "corpus");
const MAP_PATH = path.join(__dirname, ".tls-map.json");

/* ---- string scrubbing, shape-identical to build-data.js ---- */
/* Operator home dir ONLY (the capturing user's real home, resolved at
   runtime). A generic /Users/<any> rule would also swallow corpus-authored
   documentation examples like the Bash quoting demo `cd "/Users/name/My
   Documents"` — those must stay verbatim. Only the identifying PREFIX is
   replaced (with the shell convention `~`); the path tail under it is
   non-sensitive and teaching-relevant (e.g. the memory dir layout), so it
   stays. */
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const RE_HOME = new RegExp(reEsc(os.homedir()) + "(?=/|\\b)", "g");
/* Operator emails only — @anthropic.com addresses are corpus-authored content
   (e.g. the commit-trailer "Co-Authored-By: … <noreply@anthropic.com>" in the
   Bash tool description) and must stay verbatim. */
const RE_MAIL = /[A-Za-z0-9._%+-]+@(?!anthropic\.com\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const RE_SKANT = /sk-ant-[A-Za-z0-9_-]{8,}/g;
/* Harness-injected capture date: "Today's date …" whose VALUE equals the
   version's capture day (read from the sibling status.json). The phrase
   anchor alone is not enough — old prompts contain a constant corpus-authored
   example ("…if <env> says \"Today's date is 2025-07-01\"…") that must stay.
   Masking real capture dates also kills false context_body_changed deltas
   between versions captured on different days. */
const RE_TODAY = /(Today's date(?: is|:)) (20\d\d-\d\d-\d\d)/g;
/* The injected "today" is the operator's LOCAL date, while capDay comes from the
   UTC capture stamp (status.captured_at). A capture that straddles midnight can
   leave them one calendar day apart, so mask capDay AND its two neighbours —
   corpus-authored example dates (e.g. 2025-07-01) are years off and stay. */
function captureDays(capDay) {
  const base = Date.parse(capDay + "T00:00:00Z");
  return new Set([-1, 0, 1].map((n) => new Date(base + n * 86400000).toISOString().slice(0, 10)));
}
function sanitizeStr(s, capDay) {
  let out = s.replace(RE_HOME, "~").replace(RE_MAIL, "<email>").replace(RE_SKANT, "<token>");
  if (capDay) { const days = captureDays(capDay); out = out.replace(RE_TODAY, (m, p1, d) => days.has(d) ? `${p1} <date>` : m); }
  return out;
}
const MASKED = /^<[^>]+>(\(\d+ chars\))?$/;
function maskNamed(name, v) {
  const s = String(v);
  if (MASKED.test(s)) return s;
  return s.length > 10 ? `<${name}>(${s.length} chars)` : `<${name}>`;
}

/* ---- TLS pseudonymization ---- */
const TLS_GROUP_FIELDS = ["ja3", "ja4", "peetprint"];
const TLS_LABEL = /^<(ja3|ja4|peetprint)#(\d+)>$/;
let tlsMap = { ja3: {}, ja4: {}, peetprint: {} };   // raw -> "<field#N>"
const tlsUsed = { ja3: 0, ja4: 0, peetprint: 0 };   // highest number in use
try {
  const loaded = JSON.parse(fs.readFileSync(MAP_PATH, "utf8"));
  for (const f of TLS_GROUP_FIELDS) Object.assign(tlsMap[f], loaded[f] || {});
} catch (e) { /* first run — no map yet */ }
function seedUsed(label) { const m = TLS_LABEL.exec(label); if (m) tlsUsed[m[1]] = Math.max(tlsUsed[m[1]], Number(m[2])); }
for (const f of TLS_GROUP_FIELDS) Object.values(tlsMap[f]).forEach(seedUsed);
function tlsLabel(field, v) {
  if (v == null) return v;
  const s = String(v);
  if (TLS_LABEL.test(s) || MASKED.test(s)) { seedUsed(s); return s; }
  if (!(s in tlsMap[field])) { tlsUsed[field] += 1; tlsMap[field][s] = `<${field}#${tlsUsed[field]}>`; }
  return tlsMap[field][s];
}
/* Machine timestamps → day precision: keeps dataset provenance, drops the
   operator's second-level activity pattern. Applies to the known top-level
   fields of status.json / manifest.json. */
const DATE_FIELDS = ["captured_at", "generated_at", "started_at"];
function dateTransform(j) {
  for (const k of DATE_FIELDS) {
    if (typeof j[k] === "string" && /^20\d\d-\d\d-\d\dT/.test(j[k])) j[k] = j[k].slice(0, 10);
  }
  return j;
}

/* TLS fields wherever they appear in a parsed object:
   full.json tls.* / status.json top level / manifest.tls_groups keys */
function tlsTransform(j) {
  if (j.tls && typeof j.tls === "object") {
    for (const f of TLS_GROUP_FIELDS) if (j.tls[f] != null) j.tls[f] = tlsLabel(f, j.tls[f]);
    if (j.tls.clienthello_hex != null && !MASKED.test(String(j.tls.clienthello_hex)))
      j.tls.clienthello_hex = maskNamed("clienthello_hex", j.tls.clienthello_hex);
  }
  for (const f of TLS_GROUP_FIELDS) if (typeof j[f] === "string") j[f] = tlsLabel(f, j[f]);
  if (j.tls_groups && typeof j.tls_groups === "object") {
    /* A fresh engine checkpoint keys new captures by RAW ja3 while older
       versions are already labelled, so a raw key can map to a label that
       is also present as a key — merge those groups, never overwrite.
       Members re-sorted lexicographically (= the engine's glob order) and
       keys by label ordinal, so output is stable across runs. */
    const merged = {};
    for (const k of Object.keys(j.tls_groups)) {
      const lk = tlsLabel("ja3", k);
      merged[lk] = (merged[lk] || []).concat(j.tls_groups[k]);
    }
    const ord = (k) => { const m = TLS_LABEL.exec(k); return m ? Number(m[2]) : Infinity; };
    const out = {};
    for (const k of Object.keys(merged).sort((a, b) => ord(a) - ord(b) || (a < b ? -1 : 1)))
      out[k] = merged[k].sort();
    j.tls_groups = out;
  }
  return j;
}

/* ---- deep walk: scrub every string VALUE (never the serialized JSON,
   so escape sequences are safe) ---- */
function deepSanitize(x, capDay) {
  if (typeof x === "string") return sanitizeStr(x, capDay);
  if (Array.isArray(x)) return x.map(y => deepSanitize(y, capDay));
  if (x && typeof x === "object") {
    const out = {};
    for (const k of Object.keys(x)) out[k] = deepSanitize(x[k], capDay);
    return out;
  }
  return x;
}

/* ---- metadata.user_id: same-shape mask (key order + lengths kept) ---- */
function maskMetadata(md) {
  if (!md || md.user_id == null) return md;
  const uid = md.user_id;
  if (typeof uid === "string") {
    if (MASKED.test(uid)) return md;
    try {
      const o = JSON.parse(uid);
      if (o && typeof o === "object") {
        const out = {};
        for (const k of Object.keys(o)) out[k] = maskNamed(k, o[k]);
        return { ...md, user_id: JSON.stringify(out) };
      }
    } catch (e) { /* not JSON — fall through */ }
    return { ...md, user_id: maskNamed("user_id", uid) };
  }
  if (typeof uid === "object") {
    const out = {};
    for (const k of Object.keys(uid)) out[k] = maskNamed(k, uid[k]);
    return { ...md, user_id: out };
  }
  return md;
}

/* ---- one capture file (full.json / variants/<id>.json) ---- */
const HDR_SESSION = /^(x-claude-code-session-id|x-client-request-id)$/i;
function sanitizeCapture(j, capDay) {
  if (j.request) {
    if (j.request.body && j.request.body.metadata) {
      j.request.body.metadata = maskMetadata(j.request.body.metadata);
    }
    const h = j.request.headers || {};
    for (const k of Object.keys(h)) {
      if (HDR_SESSION.test(k)) {
        const v = Array.isArray(h[k]) ? h[k][0] : h[k];
        if (!MASKED.test(String(v))) h[k] = maskNamed("masked", v);
      }
    }
  }
  return deepSanitize(j, capDay);
}

/* ---- residual scan (shared by --check and the post-write gate) ----
   Note: use matchAll / fresh regexes here — a /g regex reused with .test()
   carries lastIndex across calls and silently skips matches. */
function findLeaks(str, file, capDay) {
  const leaks = [];
  for (const m of str.matchAll(RE_MAIL)) if (m[0] !== "<email>") leaks.push(`${file}: email ${m[0].slice(0, 3)}…@${m[0].split("@")[1]}`);
  for (const _ of str.matchAll(RE_HOME)) { leaks.push(`${file}: operator home path`); break; }
  for (const _ of str.matchAll(RE_SKANT)) { leaks.push(`${file}: sk-ant token`); break; }
  for (const m of str.matchAll(/"(user_id|account_uuid|device_id|session_id)"\s*:\s*"(?![<{])/g)) leaks.push(`${file}: raw ${m[1]} value`);
  for (const m of str.matchAll(/"(X-Claude-Code-Session-Id|X-Client-Request-Id)"\s*:\s*"(?!<)/gi)) leaks.push(`${file}: raw ${m[1]} header`);
  for (const m of str.matchAll(/"(ja3|ja4|peetprint|clienthello_hex)"\s*:\s*"(?!<)/g)) leaks.push(`${file}: raw tls ${m[1]}`);
  if (/"tls_groups"\s*:\s*\{\s*"(?!<)/.test(str)) leaks.push(`${file}: raw tls_groups key`);
  if (capDay) for (const d of captureDays(capDay)) {
    if (str.includes(`Today's date is ${d}`)) leaks.push(`${file}: unmasked capture date`);
    if (str.includes(`Today's date: ${d}`)) leaks.push(`${file}: unmasked capture date`);
  }
  for (const m of str.matchAll(/"(captured_at|generated_at|started_at)"\s*:\s*"20\d\d-\d\d-\d\dT/g)) leaks.push(`${file}: full-precision ${m[1]}`);
  return leaks;
}

/* Capture day for a capture file, from its sibling status.json
   (variants/<id>.json → <id>.status.json, falling back to the version's). */
function dayOf(p) {
  const dir = path.dirname(p);
  const cands = [];
  if (path.basename(dir) === "variants") {
    cands.push(p.replace(/\.json$/, ".status.json"));
    cands.push(path.join(dir, "..", "status.json"));
  } else {
    cands.push(path.join(dir, "status.json"));
  }
  for (const c of cands) {
    try {
      const d = String(JSON.parse(fs.readFileSync(c, "utf8")).captured_at || "").slice(0, 10);
      if (/^20\d\d-\d\d-\d\d$/.test(d)) return d;
    } catch (e) { /* try next */ }
  }
  return null;
}

/* ---- walk (semver order, so TLS group numbering is deterministic) ---- */
const cmpV = (a, b) => { const x = a.split(".").map(Number), y = b.split(".").map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; };
const targets = [];
const vroot = path.join(CORPUS, "versions");
const vdirs = fs.readdirSync(vroot).filter(v => fs.statSync(path.join(vroot, v)).isDirectory()).sort(cmpV);
for (const v of vdirs) {
  const dir = path.join(vroot, v);
  for (const f of ["full.json", "status.json"]) {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) targets.push(p);
  }
  const vdir = path.join(dir, "variants");
  if (fs.existsSync(vdir)) for (const f of fs.readdirSync(vdir).sort()) if (f.endsWith(".json")) targets.push(path.join(vdir, f));
}
targets.push(path.join(CORPUS, "manifest.json"));

let changed = 0;
const allLeaks = [];
for (const p of targets) {
  const raw = fs.readFileSync(p, "utf8");
  const rel = path.relative(CORPUS, p);
  const isCapture = /\/full\.json$|variants\/(?!.*\.status\.).*\.json$/.test(p.replace(/\\/g, "/"));
  const capDay = isCapture ? dayOf(p) : null;
  if (CHECK) { allLeaks.push(...findLeaks(raw, rel, capDay)); continue; }
  let j;
  try { j = JSON.parse(raw); } catch (e) { console.error(`SKIP unparseable: ${rel}: ${e.message}`); continue; }
  const before = JSON.stringify(j);
  j = dateTransform(tlsTransform(j));
  const clean = isCapture ? sanitizeCapture(j, capDay) : deepSanitize(j, null);
  if (before !== JSON.stringify(clean)) {
    fs.writeFileSync(p, JSON.stringify(clean, null, 1));
    changed++;
  }
  allLeaks.push(...findLeaks(JSON.stringify(clean), rel, capDay));
}

if (!CHECK) {
  try { fs.writeFileSync(MAP_PATH, JSON.stringify(tlsMap, null, 1)); } catch (e) { /* noop */ }
}

if (allLeaks.length) {
  console.error(`PII GATE FAILED — ${allLeaks.length} leak(s):\n` + allLeaks.slice(0, 20).join("\n"));
  process.exit(1);
}
console.log(CHECK
  ? `check ok: ${targets.length} files, 0 leaks`
  : `sanitized in place: ${changed}/${targets.length} files rewritten, 0 leaks remain; tls groups: ja3=${Object.keys(tlsMap.ja3).length} ja4=${Object.keys(tlsMap.ja4).length} peetprint=${Object.keys(tlsMap.peetprint).length}`);
