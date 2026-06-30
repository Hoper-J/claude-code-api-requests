/* ============================================================
   Lineage — corpus ingest pipeline (Node script — run with `node`)
   Rebuilds ../public/data.js from a capture corpus.

   Usage:
     node scripts/build-data.js <corpusDir> [outFile]

   <corpusDir> layout (the version-matrix output):
     manifest.json
     versions/<v>/full.json
     versions/<v>/status.json
     versions/<v>/variants/<id>.json          (optional, pinned-model captures)
     versions/<v>/variants/<id>.status.json

   What it does (mirrors the rules used to build the shipped data.js):
   1. SANITIZE  — home paths → <homedir>, emails → <email>, sk-ant → <token>;
                  metadata.user_id fields → <name>(N chars).
   2. HEADERS   — denylist+mask, not whitelist: drop volatile/infra headers,
                  mask auth to <masked>(N chars), ship everything else verbatim.
   3. EXTRACT   — system blocks / tools / messages (deduped into shared pools),
                  message shape (system-reminder kinds, probe, cache breaks),
                  params (max_tokens, temperature, stream, effort, thinking,
                  context_management, diagnostics, fallbacks), betas, the full
                  top-level body_keys set (catch-all so a NEW request field surfaces),
                  response usage / reply / stop_reason / model echo,
                  regime from status.json.
   4. DELTAS    — vs previous MAIN version (aux versions never become baseline):
                  tools, betas, reminders, probe, effort, system chars,
                  max_tokens, model, thinking, regime, temperature, stream,
                  context_management, diagnostics, injected-context body,
                  body_keys add/remove (sentinel — fires only for an UNTRACKED new
                  field, nothing today), system block count.
   5. VARIANTS  — pinned-model captures attach under VERSIONS[v].variants with
                  the curated model_axis_diff from their status.json.
   6. PII GATE  — after serialization, scan for raw home paths / emails /
                  sk-ant tokens; exit(1) loudly if anything survived.

   The UI is fully data-driven: regenerate data.js and every view (timeline,
   explorer, compare, search, counts) picks the new versions up automatically.
   ============================================================ */

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`usage: node site/scripts/build-data.js <corpusDir> [outFile] [--emit-json <dir>]

  Builds site/public/data.js (window.LINEAGE_DATA) from the corpus, then
  re-scans its own output for PII and exits 1 on any hit (built-in gate).
  --emit-json <dir>  also emit the static JSON API (v/<version>[-<variant>].json
                     + index.json + latest.json)`);
  process.exit(0);
}
let emitDir = null;
const emitIdx = args.indexOf("--emit-json");
if (emitIdx >= 0) { emitDir = args[emitIdx + 1]; args.splice(emitIdx, 2); }
const [corpusDir, outArg] = args;
if (!corpusDir) { console.error("usage: node site/scripts/build-data.js <corpusDir> [outFile] [--emit-json <dir>]  (--help for details)"); process.exit(1); }
const OUT = outArg || path.join(__dirname, "..", "public", "data.js");

/* ---------- sanitize ----------
   Shape-identical to the corpus-level scrubber (../../sanitize/sanitize.js).
   Change either side and you MUST sync the other; the guarded invariant is
   that data.js built before and after corpus sanitization is byte-identical.
   - home paths: operator's real home only (corpus-authored examples like
     "/Users/name/My Documents" in the Bash quoting demo stay verbatim);
     only the identifying prefix is replaced with `~` — the tail is kept
   - emails: operator only; @anthropic.com is corpus content
   - dates: "Today's date …" masked only when the value equals the version's
     capture day (CAP_DAY) — constant corpus examples like 2025-07-01 stay */
const os = require("os");
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const RE_OP_HOME = new RegExp(reEsc(os.homedir()) + "(?=/|\\b)", "g");
let CAP_DAY = null; // capture day of the version being parsed; set by the walk
/* capDay ±1 day: the injected local "today" can differ from the UTC capture
   stamp by a calendar day when a capture straddles midnight (shape-identical to
   captureDays() in ../../sanitize/sanitize.js — keep both in sync). */
function captureDays(capDay) {
  const base = Date.parse(capDay + "T00:00:00Z");
  return new Set([-1, 0, 1].map((n) => new Date(base + n * 86400000).toISOString().slice(0, 10)));
}
function sanitize(s) {
  if (s == null) return s;
  let out = String(s)
    .replace(RE_OP_HOME, "~")
    .replace(/[A-Za-z0-9._%+-]+@(?!anthropic\.com\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "<email>")
    .replace(/sk-ant-[A-Za-z0-9_\-]+/g, "<token>");
  if (CAP_DAY) { const days = captureDays(CAP_DAY); out = out.replace(/(Today's date(?: is|:)) (20\d\d-\d\d-\d\d)/g, (m, p1, d) => days.has(d) ? `${p1} <date>` : m); }
  return out;
}
function sanitizeJSON(obj) { return obj == null ? null : JSON.parse(sanitize(JSON.stringify(obj))); }
function maskIdNamed(name, v) { const s = String(v); if (/^<[^>]+>(\(\d+ chars\))?$/.test(s)) return s; /* already masked by corpus-level sanitize — pass through */ const m = s.length; return m > 10 ? `<${name}>(${m} chars)` : `<${name}>`; }
function sanitizeMetadata(md) {
  if (!md) return null;
  let uid = md.user_id;
  if (typeof uid === "string") {
    try { const o = JSON.parse(uid); const out = {}; for (const k of Object.keys(o)) out[k] = maskIdNamed(k, o[k]); return { user_id: out }; }
    catch (e) { return { user_id: maskIdNamed("user_id", uid) }; }
  }
  if (uid && typeof uid === "object") { const out = {}; for (const k of Object.keys(uid)) out[k] = maskIdNamed(k, uid[k]); return { user_id: out }; }
  return sanitizeJSON(md);
}

/* ---------- headers: denylist + mask ---------- */
const HDR_DROP = /^(request-id|date|x-request-id|anthropic-ratelimit-|cf-ray|x-client-request-id|x-claude-code-session-id|content-length|host|connection|accept-encoding)/i;
const HDR_MASK = /^(authorization|x-api-key|cookie|proxy-authorization)$/i;
function cleanHeaders(hsrc) {
  const out = {};
  for (const k of Object.keys(hsrc || {})) {
    if (HDR_DROP.test(k)) continue;
    const v = Array.isArray(hsrc[k]) ? hsrc[k][0] : hsrc[k];
    if (HDR_MASK.test(k)) { const s = String(v); out[k] = /</.test(s) ? s : `<masked>(${s.length} chars)`; continue; }
    out[k] = sanitize(v);
  }
  return out;
}

/* ---------- message shape ---------- */
function blockKinds(text) {
  const k = []; const has = re => re.test(text);
  if (has(/# claudeMd/)) k.push("claude-md");
  if (has(/auto-memory|MEMORY\.md/)) k.push("auto-memory");
  if (has(/# userEmail/)) k.push("user-email");
  if (has(/# currentDate/)) k.push("current-date");
  if (has(/# gitStatus|This is the git status/)) k.push("git-status");
  if (has(/# directoryStructure/)) k.push("directory-structure");
  if (has(/SessionStart|Session note:/)) k.push("session-start-hook");
  if (has(/skills are available|user-invocable skills|<available-skills>|following skills are available/i)) k.push("available-skills");
  if (has(/deferred tools|available-deferred-tools|via ToolSearch/i)) k.push("deferred-tools");
  if (has(/important-instruction-reminders/)) k.push("instruction-reminders");
  if (has(/ultracode|ultrareview/i)) k.push("ultracode-status");
  return k;
}
function classifyProbe(text) {
  if (/Reply with the single word:\s*ping/i.test(text)) return "ping";
  if (/\bWarmup\b/i.test(text)) return "warmup";
  return "other";
}
function messageShape(msgs) {
  const blocks = []; const allKinds = new Set(); let probe = null, cacheBreaks = 0;
  msgs.forEach(m => (m.content || []).forEach(c => {
    const text = c.text || "";
    const wrapped = /<system-reminder>/.test(text);
    const kinds = blockKinds(text); kinds.forEach(k => allKinds.add(k));
    if (kinds.length === 0 && !wrapped) { const p = classifyProbe(text); if (p && !probe) probe = p; }
    if (c.cache) cacheBreaks++;
    blocks.push({ role: m.role, wrapper: wrapped ? "system-reminder" : null, kinds, cache: c.cache || null });
  }));
  return { message_count: msgs.length, block_count: blocks.length, blocks, reminder_kinds: [...allKinds], probe: probe || "none", cache_breaks: cacheBreaks };
}
function injectedBodyOf(msgs) {
  const parts = [];
  msgs.forEach(m => (m.content || []).forEach(c => {
    const text = c.text || "";
    if (/<system-reminder>/.test(text) || blockKinds(text).length) parts.push(text);
  }));
  return parts.join("\n\u0000\n");
}

/* ---------- response parsing (sse or json body) ---------- */
function respText(resp) { if (!resp) return ""; return typeof resp.body === "string" ? resp.body : JSON.stringify(resp.body || ""); }
function parseUsage(resp) {
  const text = respText(resp); if (!text) return null;
  const num = re => { const m = text.match(re); return m ? Number(m[1]) : null; };
  const str = re => { const m = text.match(re); return m ? m[1] : null; };
  const u = {
    input_tokens: num(/"input_tokens":(\d+)/), output_tokens: num(/"output_tokens":(\d+)/),
    cache_read_input_tokens: num(/"cache_read_input_tokens":(\d+)/), cache_creation_input_tokens: num(/"cache_creation_input_tokens":(\d+)/),
    "cache_creation.ephemeral_5m_input_tokens": num(/"ephemeral_5m_input_tokens":(\d+)/),
    "cache_creation.ephemeral_1h_input_tokens": num(/"ephemeral_1h_input_tokens":(\d+)/),
    thinking_tokens: num(/"thinking_tokens":(\d+)/),
    service_tier: str(/"service_tier":"([^"]*)"/), inference_geo: str(/"inference_geo":"([^"]*)"/),
  };
  Object.keys(u).forEach(k => { if (u[k] == null) delete u[k]; });
  const ae = text.match(/"applied_edits":\[([^\]]*)\]/);
  if (ae) u["context_management.applied_edits"] = ae[1].trim() ? (ae[1].match(/\{/g) || []).length : 0;
  return Object.keys(u).length ? u : null;
}
function parseReply(resp) {
  const text = respText(resp); if (!text) return { reply: null, stop_reason: null };
  const deltas = [...text.matchAll(/"type":"text_delta","text":"((?:[^"\\]|\\.)*)"/g)].map(m => m[1]);
  let reply = deltas.join("");
  if (reply) { try { reply = JSON.parse('"' + reply + '"'); } catch (e) {} }
  const stop = (text.match(/"stop_reason":"([^"]+)"/) || [])[1] || null;
  return { reply: sanitize(reply) || null, stop_reason: stop };
}
function parseRespModel(resp) {
  const text = respText(resp); if (!text) return null;
  const ri = text.indexOf('"response"'); // body may itself be the response payload
  const seg = ri >= 0 ? text.slice(ri) : text;
  const m = seg.match(/\\?"model\\?"\s*:\s*\\?"([A-Za-z0-9.\-\[\]]+)\\?"/);
  return m ? m[1] : null;
}

/* ---------- dedupe pools ---------- */
const BLOCKS = {}, blockMap = new Map(); let bId = 0;
const TOOLDEFS = {}, toolMap = new Map(); let dId = 0;
const MESSAGES = {}, msgMap = new Map(); let mId = 0;
const blockId = t => { let id = blockMap.get(t); if (!id) { id = "b" + bId++; blockMap.set(t, id); BLOCKS[id] = t; } return id; };
const toolId = o => { const k = JSON.stringify(o); let id = toolMap.get(k); if (!id) { id = "d" + dId++; toolMap.set(k, id); TOOLDEFS[id] = o; } return id; };
const msgId = a => { const k = JSON.stringify(a); let id = msgMap.get(k); if (!id) { id = "m" + mId++; msgMap.set(k, id); MESSAGES[id] = a; } return id; };

/* ---------- per-capture parse ---------- */
function parseCapture(j, regime) {
  const body = (j.request && j.request.body) || {};
  const sysArr = (body.system || []).map(b => sanitize(b.text || ""));
  const blocks = sysArr.map(blockId);
  const system_chars = sysArr.reduce((a, t) => a + t.length, 0);
  const toolsArr = (body.tools || []).map(tl => ({ name: tl.name, description: sanitize(tl.description || ""), schema: sanitizeJSON(tl.input_schema || null) }));
  const toolIds = toolsArr.map(toolId);
  const toolNames = {}; toolsArr.forEach((t, i) => { toolNames[t.name] = toolIds[i]; });
  const msgs = (body.messages || []).map(m => ({
    role: m.role,
    content: (Array.isArray(m.content) ? m.content : [{ type: "text", text: String(m.content) }]).map(c => {
      const cc = c.cache_control ? { type: c.cache_control.type || "ephemeral", ...(c.cache_control.ttl ? { ttl: c.cache_control.ttl } : {}) } : null;
      return { text: sanitize(c.text != null ? c.text : JSON.stringify(c)), cache: cc };
    }),
  }));
  const shape = messageShape(msgs);
  // MCP async-connect race (2.1.153+): when the server hadn't finished connecting
  // at first-request build, mcp__* is replaced by a "still connecting" notice. This
  // is a capture-time state, not a version property — flag it so the UI can mark it.
  const mcp_connecting = msgs.some(m => m.content.some(c => /still connecting/i.test(c.text || "")));
  const hsrc = (j.request && j.request.headers) || {};
  const headers = cleanHeaders(hsrc);
  const betas = (headers["Anthropic-Beta"] || "").split(",").map(s => s.trim()).filter(Boolean);
  const rep = parseReply(j.response);
  return {
    result: "ok", model: body.model, http_status: (j.response && j.response.status) || null, regime, aux: false,
    system_chars, tools_count: toolIds.length, blocks, tools: toolIds, headers, betas,
    body_keys: Object.keys(body).sort(),
    max_tokens: body.max_tokens != null ? body.max_tokens : null,
    temperature: body.temperature != null ? body.temperature : null,
    stream: body.stream != null ? body.stream : null,
    effort: (body.output_config && body.output_config.effort) || null,
    thinking: body.thinking ? sanitizeJSON(body.thinking) : null,
    diagnostics: body.diagnostics ? sanitizeJSON(body.diagnostics) : null,
    metadata: sanitizeMetadata(body.metadata),
    context_management: body.context_management ? sanitizeJSON(body.context_management) : null,
    fallbacks: body.fallbacks ? sanitizeJSON(body.fallbacks) : null,
    usage: parseUsage(j.response),
    messagesId: msgs.length ? msgId(msgs) : null,
    msg_shape: shape,
    ...(mcp_connecting ? { mcp_connecting: true } : {}),
    reply: rep.reply, stop_reason: rep.stop_reason,
    response_model: parseRespModel(j.response),
    _toolNames: toolNames, _injectedBody: injectedBodyOf(msgs),
  };
}

/* ---------- read corpus ---------- */
const manifest = JSON.parse(fs.readFileSync(path.join(corpusDir, "manifest.json"), "utf8"));
const failSet = new Set((manifest.failed || []).map(f => f.version));
const AUX = new Set((manifest.auxiliary_captures || []).map(a => a.version));
const skey = v => v.split(".").map(Number);
const cmpV = (a, b) => { const x = skey(a), y = skey(b); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; };
const versions = [...new Set(manifest.versions || [])].sort(cmpV);

const VERSIONS = {}, parsed = {};
for (const v of versions) {
  if (failSet.has(v)) { VERSIONS[v] = { result: "fail", error: "no-capture" }; continue; }
  const dir = path.join(corpusDir, "versions", v);
  let full, status = {};
  try { full = JSON.parse(fs.readFileSync(path.join(dir, "full.json"), "utf8")); }
  catch (e) { VERSIONS[v] = { result: "fail", error: "missing-capture" }; continue; }
  try { status = JSON.parse(fs.readFileSync(path.join(dir, "status.json"), "utf8")); } catch (e) {}
  CAP_DAY = (String(status.captured_at || "").match(/^20\d\d-\d\d-\d\d/) || [null])[0];
  const rec = parseCapture(full, status.regime || "js");
  rec.aux = AUX.has(v);
  rec.captured_at = CAP_DAY;   // capture day — lets the UI flag diffs that span a capture-date seam (server-side drift, not a version change)
  /* variants (pinned-model captures) */
  const vdir = path.join(dir, "variants");
  if (fs.existsSync(vdir)) {
    rec.variants = [];
    for (const f of fs.readdirSync(vdir).filter(n => n.endsWith(".json") && !n.endsWith(".status.json")).sort()) {
      const id = f.replace(/\.json$/, "");
      let vfull, vstatus = {};
      try { vfull = JSON.parse(fs.readFileSync(path.join(vdir, f), "utf8")); } catch (e) { continue; }
      try { vstatus = JSON.parse(fs.readFileSync(path.join(vdir, id + ".status.json"), "utf8")); } catch (e) {}
      CAP_DAY = (String(vstatus.captured_at || status.captured_at || "").match(/^20\d\d-\d\d-\d\d/) || [null])[0];
      const det = parseCapture(vfull, status.regime || "js");
      det.captured_at = CAP_DAY;
      delete det._toolNames; delete det._injectedBody;
      const ax = vstatus.model_axis_diff || {};
      rec.variants.push({
        id, pinned_model: vstatus.pinned_model || null, model_in_request: vstatus.model_in_request || det.model,
        axis: { vs: ax.vs || null, changed: ax.changed || [], identical: ax.identical || [], note: ax.note || null },
        detail: det,
      });
    }
    if (!rec.variants.length) delete rec.variants;
  }
  parsed[v] = rec;
  VERSIONS[v] = rec;
}

/* ---------- deltas vs previous main ---------- */
// body_keys is a SENTINEL for genuinely new/untracked request fields: each key
// below is already surfaced by its own extraction + specific delta, so exclude
// them — body_keys_added/removed fires ONLY for a field we don't otherwise handle
// (today that's nothing; it lights up the day an unnamed param appears).
const KNOWN_BODY_KEYS = new Set(["model","system","tools","messages","max_tokens","temperature","stream","thinking","diagnostics","metadata","context_management","output_config","fallbacks"]);
const j = x => JSON.stringify(x ?? null);
const deltas = {};
let prevMain = null;
for (const v of versions) {
  const cur = parsed[v]; if (!cur) continue;
  if (!prevMain) { deltas[v] = null; }
  else {
    const d = {};
    const pN = Object.keys(prevMain._toolNames), cN = Object.keys(cur._toolNames);
    const pSet = new Set(pN), cSet = new Set(cN);
    const ta = cN.filter(n => !pSet.has(n)); if (ta.length) d.tools_added = ta;
    const tr = pN.filter(n => !cSet.has(n)); if (tr.length) d.tools_removed = tr;
    const tm = cN.filter(n => pSet.has(n) && prevMain._toolNames[n] !== cur._toolNames[n]); if (tm.length) d.tools_modified = tm;
    const pB = new Set(prevMain.betas), cB = new Set(cur.betas);
    const ba = cur.betas.filter(x => !pB.has(x)); if (ba.length) d.betas_added = ba;
    const br = prevMain.betas.filter(x => !cB.has(x)); if (br.length) d.betas_removed = br;
    const pR = new Set(prevMain.msg_shape.reminder_kinds), cR = new Set(cur.msg_shape.reminder_kinds);
    const ra = cur.msg_shape.reminder_kinds.filter(x => !pR.has(x)); if (ra.length) d.reminders_added = ra;
    const rr = prevMain.msg_shape.reminder_kinds.filter(x => !cR.has(x)); if (rr.length) d.reminders_removed = rr;
    if (!ra.length && !rr.length && prevMain._injectedBody !== cur._injectedBody) d.context_body_changed = true;
    if (prevMain.msg_shape.probe !== cur.msg_shape.probe) d.probe_changed = { from: prevMain.msg_shape.probe, to: cur.msg_shape.probe };
    if ((prevMain.effort || null) !== (cur.effort || null)) d.effort_changed = { from: prevMain.effort || null, to: cur.effort || null };
    if (j(prevMain.thinking) !== j(cur.thinking)) d.thinking_changed = { from: prevMain.thinking ? prevMain.thinking.type : null, to: cur.thinking ? cur.thinking.type : null };
    if (prevMain.regime !== cur.regime) d.regime_changed = { from: prevMain.regime, to: cur.regime };
    if (j(prevMain.temperature) !== j(cur.temperature)) d.temperature_changed = { from: prevMain.temperature ?? null, to: cur.temperature ?? null };
    if (j(prevMain.stream) !== j(cur.stream)) d.stream_changed = { from: prevMain.stream ?? null, to: cur.stream ?? null };
    if (j(prevMain.context_management) !== j(cur.context_management)) d.context_management_changed = { from: prevMain.context_management, to: cur.context_management };
    if (j(prevMain.diagnostics) !== j(cur.diagnostics)) d.diagnostics_changed = { from: prevMain.diagnostics, to: cur.diagnostics };
    const scd = cur.system_chars - prevMain.system_chars; if (scd) d.system_chars_delta = scd;
    if (prevMain.blocks.length !== cur.blocks.length) d.system_blocks_changed = { from: prevMain.blocks.length, to: cur.blocks.length };
    const pBK = new Set(prevMain.body_keys || []), cBK = new Set(cur.body_keys || []);
    const bka = (cur.body_keys || []).filter(x => !pBK.has(x) && !KNOWN_BODY_KEYS.has(x)); if (bka.length) d.body_keys_added = bka;
    const bkr = (prevMain.body_keys || []).filter(x => !cBK.has(x) && !KNOWN_BODY_KEYS.has(x)); if (bkr.length) d.body_keys_removed = bkr;
    if (prevMain.max_tokens !== cur.max_tokens) d.max_tokens_changed = { from: prevMain.max_tokens, to: cur.max_tokens };
    if (prevMain.model !== cur.model) d.model_changed = { from: prevMain.model, to: cur.model };
    deltas[v] = d;
  }
  if (!cur.aux) prevMain = cur;
}

/* ---------- index (newest first) ---------- */
const INDEX = [...versions].sort((a, b) => cmpV(b, a)).map(v => {
  const rec = parsed[v];
  if (!rec) return { version: v, result: "fail" };
  const row = { version: v, result: "ok", model: rec.model, tools_count: rec.tools_count, system_chars: rec.system_chars, aux: rec.aux, delta: deltas[v] };
  if (rec.variants) row.variants = rec.variants.map(x => x.id);
  return row;
});
for (const v of versions) { const r = parsed[v]; if (r) { delete r._toolNames; delete r._injectedBody; } }
const mains = versions.filter(v => parsed[v] && !parsed[v].aux).length;
const COUNTS = { total: versions.length, ok: mains, aux: AUX.size, fail: failSet.size };

/* ---------- serialize + PII gate ---------- */
const out = { COUNTS, BLOCKS, TOOLDEFS, MESSAGES, VERSIONS, INDEX };
const json = JSON.stringify(out);
const leaks = [];
for (const [name, re] of [
  ["home path", new RegExp(reEsc(os.homedir()))], // operator home only; /Users/name examples are corpus content
  ["raw email", /[A-Za-z0-9._%+-]+@(?!anthropic\.com\b)[A-Za-z0-9-]+\.[A-Za-z]{2,}/], // @anthropic.com is corpus content
  ["sk-ant token", /sk-ant-[A-Za-z0-9_-]+/],
]) {
  const m = json.match(re);
  if (m && m[0] !== "<email>") leaks.push(`${name}: …${json.slice(Math.max(0, m.index - 40), m.index + 60)}…`);
}
if (leaks.length) { console.error("PII GATE FAILED:\n" + leaks.join("\n")); process.exit(1); }

fs.writeFileSync(OUT, "/* Lineage — generated by scripts/build-data.js. Verbatim corpus, light sanitize, newest-first. */\nwindow.LINEAGE_DATA = " + json + ";\n");
console.log(`wrote ${OUT}`);
console.log(`versions=${COUNTS.total} main=${COUNTS.ok} aux=${COUNTS.aux} fail=${COUNTS.fail} blocks=${bId} tooldefs=${dId} messages=${mId} bytes=${json.length}`);

/* ---------- --emit-json: stable per-version JSON for curl/jq users ----------
   dist layout:
     <dir>/v/<version>.json                 immutable (version == content hash)
     <dir>/v/<version>-<variantId>.json     immutable
     <dir>/index.json                       short-cache alias (version list)
     <dir>/latest.json                      short-cache alias (newest main capture)
   Pair with _headers:
     /data/v/*        Cache-Control: public, max-age=31536000, immutable
     /data/index.json Cache-Control: public, max-age=300
     /data/latest.json Cache-Control: public, max-age=300                  */
if (emitDir) {
  const vDir = path.join(emitDir, "v");
  fs.mkdirSync(vDir, { recursive: true });
  const captureJSON = (rec, version, variantId) => {
    const det = variantId ? rec.variants.find(x => x.id === variantId).detail : rec;
    const body = {
      model: det.model,
      ...(det.max_tokens != null ? { max_tokens: det.max_tokens } : {}),
      ...(det.temperature != null ? { temperature: det.temperature } : {}),
      ...(det.stream != null ? { stream: det.stream } : {}),
      ...(det.thinking ? { thinking: det.thinking } : {}),
      ...(det.effort != null ? { output_config: { effort: det.effort } } : {}),
      ...(det.context_management ? { context_management: det.context_management } : {}),
      ...(det.diagnostics ? { diagnostics: det.diagnostics } : {}),
      ...(det.metadata ? { metadata: det.metadata } : {}),
      ...(det.fallbacks ? { fallbacks: det.fallbacks } : {}),
      system: (det.blocks || []).map(id => ({ type: "text", text: BLOCKS[id] })),
      tools: (det.tools || []).map(id => ({ name: TOOLDEFS[id].name, description: TOOLDEFS[id].description, input_schema: TOOLDEFS[id].schema })),
      messages: det.messagesId != null ? MESSAGES[det.messagesId].map(m => ({ role: m.role, content: m.content.map(c => ({ type: "text", text: c.text, ...(c.cache ? { cache_control: c.cache } : {}) })) })) : [],
    };
    return JSON.stringify({
      version, capture: variantId || "default", sanitized: true,
      request: { method: "POST", host: "api.anthropic.com", path: "/v1/messages?beta=true", headers: det.headers || {}, body },
      response: {
        status: det.http_status,
        body: {
          ...(det.response_model ? { model: det.response_model } : {}),
          ...(det.stop_reason ? { stop_reason: det.stop_reason } : {}),
          ...(det.usage ? { usage: det.usage } : {}),
          ...(det.reply != null ? { reply_text: det.reply } : {}),
        },
      },
      meta: { regime: det.regime, source: "claude-code-api-requests" },
    }, null, 2);
  };
  let emitted = 0;
  for (const v of versions) {
    const rec = parsed[v]; if (!rec) continue;
    fs.writeFileSync(path.join(vDir, `${v}.json`), captureJSON(rec, v, null)); emitted++;
    for (const va of rec.variants || []) {
      fs.writeFileSync(path.join(vDir, `${v}-${va.id}.json`), captureJSON(rec, v, va.id)); emitted++;
    }
  }
  const newestMain = INDEX.find(r => r.result === "ok" && !r.aux);
  fs.writeFileSync(path.join(emitDir, "index.json"), JSON.stringify({
    counts: COUNTS,
    latest: newestMain ? newestMain.version : null,
    versions: INDEX.map(r => ({ version: r.version, result: r.result, ...(r.aux ? { aux: true } : {}), ...(r.variants ? { variants: r.variants } : {}) })),
  }, null, 2));
  if (newestMain) fs.copyFileSync(path.join(vDir, `${newestMain.version}.json`), path.join(emitDir, "latest.json"));
  console.log(`emitted ${emitted} capture files + index.json + latest.json -> ${emitDir}`);
}
