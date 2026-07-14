/* ============================================================
   Lineage — Atom feeds from the built site artifacts
   ------------------------------------------------------------
   Usage:
     node site/scripts/build-feed.js
   Runs LAST in the build chain — consumes the already-built
   site/public/data.js, changelog-data.js and changelog-zh.js
   (never the corpus directly, so delta/changelog logic stays
   single-sourced) and emits:
     site/public/feed.xml        (English)
     site/public/feed.zh-CN.xml  (Chinese)
   Contract:
   - Entries are post-baseline versions only (> FEED_EPOCH),
     newest CAP at most — the baseline was captured on a single
     day, so feeding it to readers would be a wall of same-date
     entries with zero notification value. The epoch is a VERSION
     boundary, not a date comparison, so re-capturing a baseline
     version can never leak it into the feed.
   - Entry ids are stable, language-scoped tag URIs; a sample
     replacement updates the entry in place (<updated> = new
     captured_at), never adds a new entry.
   - All timestamps are day-precision (sanitize policy).
   - Deterministic: no wall-clock reads; same inputs → same bytes.
   ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const FEED_EPOCH = "2.1.201";   // last baseline version — entries start after it
const CAP = 50;                  // newest entries kept per feed
const SITE = "https://api-requests.cc";
const PUB = path.join(__dirname, "..", "public");

/* ---- load built artifacts ---- */
function loadGlobals(files) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  for (const f of files) {
    const p = path.join(PUB, f);
    if (!fs.existsSync(p)) { console.error(`missing ${p} — run its builder first`); process.exit(1); }
    vm.runInContext(fs.readFileSync(p, "utf8"), sandbox, { filename: f });
  }
  return sandbox.window;
}
const W = loadGlobals(["data.js", "changelog-data.js", "changelog-zh.js"]);
const DATA = W.LINEAGE_DATA, CHANGELOG = W.LINEAGE_CHANGELOG, CHANGELOG_ZH = W.LINEAGE_CHANGELOG_ZH;

/* ---- helpers ---- */
const semver = (v) => v.split(".").map(Number);
const vcmp = (a, b) => { const A = semver(a), B = semver(b); for (let i = 0; i < 3; i++) if (A[i] !== B[i]) return A[i] - B[i]; return 0; };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const displayModel = (id) => id.replace(/^claude-/, "").replace(/-1m$/, "[1m]");

const STR = {
  en: {
    feedTitle: "Claude Code API Requests",
    subtitle: "New Claude Code CLI versions as they land in the corpus — the request delta plus the official changelog.",
    captured: "captured", tools: "tools", variants: "variants",
    reqChanges: "Request changes", noChanges: "No request changes.",
    axis: (m) => `${m} axis`, changelog: "Changelog",
    noChangelog: "Changelog: not yet published upstream.",
    viewRequest: "View request", diffVs: (p) => `Diff vs ${p}`, timeline: "Timeline",
    colon: ": ", join: "; ",
    d: {
      toolsAdded: (a) => `new tool${a.length > 1 ? "s" : ""} ${a.join(", ")}`,
      toolsRemoved: (a) => `removed tool${a.length > 1 ? "s" : ""} ${a.join(", ")}`,
      toolsModified: (a) => `${a.join(", ")} description${a.length > 1 ? "s" : ""} updated`,
      betasAdded: (a) => `+beta ${a.join(", ")}`,
      betasRemoved: (a) => `−beta ${a.join(", ")}`,
      model: (c) => `default model ${c.from} → ${c.to}`,
      maxTokens: (c) => `max_tokens ${c.from} → ${c.to}`,
      effort: (c) => `effort ${c.from ?? "unset"} → ${c.to ?? "unset"}`,
      thinking: (c) => `thinking ${c.from} → ${c.to}`,
      systemChars: (n) => `system prompt ${n > 0 ? "+" : ""}${n} chars`,
      contextBody: "injected context changed",
      other: (k) => k.replace(/_/g, " "),
    },
  },
  zh: {
    feedTitle: "Claude Code API Requests",
    subtitle: "新版本入库即更新——请求变化加官方 changelog。",
    captured: "采集于", tools: "个工具", variants: "变体",
    reqChanges: "请求变化", noChanges: "请求无变化。",
    axis: (m) => `${m} 轴`, changelog: "Changelog",
    noChangelog: "Changelog：上游尚未发布。",
    viewRequest: "查看请求", diffVs: (p) => `对比 ${p}`, timeline: "时间线",
    colon: "：", join: "；",
    d: {
      toolsAdded: (a) => `新增工具 ${a.join("、")}`,
      toolsRemoved: (a) => `移除工具 ${a.join("、")}`,
      toolsModified: (a) => `${a.join("、")} 描述更新`,
      betasAdded: (a) => `新增 beta ${a.join("、")}`,
      betasRemoved: (a) => `移除 beta ${a.join("、")}`,
      model: (c) => `默认模型 ${c.from} → ${c.to}`,
      maxTokens: (c) => `max_tokens ${c.from} → ${c.to}`,
      effort: (c) => `effort ${c.from ?? "未设"} → ${c.to ?? "未设"}`,
      thinking: (c) => `thinking ${c.from} → ${c.to}`,
      systemChars: (n) => `系统提示 ${n > 0 ? "+" : ""}${n} 字符`,
      contextBody: "注入上下文变化",
      other: (k) => k.replace(/_/g, " "),
    },
  },
};

/* Turn a computeDelta() object into human phrases. Unknown keys fall through
   verbatim so future delta axes never vanish silently. */
function deltaPhrases(delta, S) {
  if (!delta) return [];
  const out = [];
  const d = S.d;
  for (const [k, v] of Object.entries(delta)) {
    if (k === "tools_added" && v.length) out.push(d.toolsAdded(v));
    else if (k === "tools_removed" && v.length) out.push(d.toolsRemoved(v));
    else if (k === "tools_modified" && v.length) out.push(d.toolsModified(v));
    else if (k === "betas_added" && v.length) out.push(d.betasAdded(v));
    else if (k === "betas_removed" && v.length) out.push(d.betasRemoved(v));
    /* from/to pairs are guarded inside the branch: computeDelta can emit
       equal-value pairs (seen live: thinking adaptive→adaptive at 2.1.198),
       and an unguarded predicate would fall through to the raw-key branch. */
    else if (k === "model_changed") { if (v.from !== v.to) out.push(d.model(v)); }
    else if (k === "max_tokens_changed") { if (v.from !== v.to) out.push(d.maxTokens(v)); }
    else if (k === "effort_changed") { if (v.from !== v.to) out.push(d.effort(v)); }
    else if (k === "thinking_changed") { if (v.from !== v.to) out.push(d.thinking(v)); }
    else if (k === "system_chars_delta" && v) out.push(d.systemChars(v));
    else if (k === "context_body_changed" && v) out.push(d.contextBody);
    else if (!["tools_added", "tools_removed", "tools_modified", "betas_added", "betas_removed", "system_chars_delta", "context_body_changed"].includes(k)) out.push(d.other(k));
  }
  return out;
}

/* Axis-unique delta: what a variant axis changed that the canonical didn't.
   Array keys are set-diffed; scalar/object keys count when values differ. */
function axisExtras(axisDelta, canonDelta) {
  const extra = {};
  const canon = canonDelta || {};
  for (const [k, v] of Object.entries(axisDelta || {})) {
    if (Array.isArray(v)) {
      const base = new Set(canon[k] || []);
      const diff = v.filter((x) => !base.has(x));
      if (diff.length) extra[k] = diff;
    } else if (JSON.stringify(v) !== JSON.stringify(canon[k])) {
      extra[k] = v;
    }
  }
  return extra;
}

/* ---- collect entries (INDEX is newest-first) ---- */
const rows = DATA.INDEX.filter((r) => r.result === "ok" && vcmp(r.version, FEED_EPOCH) > 0).slice(0, CAP);

function buildEntry(row, lang) {
  const S = STR[lang];
  const v = row.version;
  const ver = DATA.VERSIONS[v];
  const day = String(ver.captured_at).slice(0, 10);   // corpus dates are day-precision; slice defends unsanitized local runs
  const idx = DATA.INDEX.findIndex((r) => r.version === v);
  const prev = DATA.INDEX[idx + 1] ? DATA.INDEX[idx + 1].version : null;
  const url = `${SITE}/#/${lang}/v/${v}`;
  const phrases = deltaPhrases(row.delta, S);
  const title = `${v} — ${phrases.length ? (phrases.length > 2 ? phrases.slice(0, 2).join(S.join) + " …" : phrases.join(S.join)) : S.noChanges.replace(/[.。]$/, "")}`;

  /* axis-unique deltas */
  const axisLines = [];
  for (const fam of Object.keys(DATA.LENSES || {})) {
    const ax = (DATA.LENSES[fam] || []).find((r) => r.version === v && r.sample && r.sample !== "canonical");
    if (!ax || ax.handover) continue;
    const extras = deltaPhrases(axisExtras(ax.delta, row.delta), S);
    if (extras.length) axisLines.push(`${S.axis(displayModel(ax.sample))}${S.colon}${extras.join(S.join)}`);
  }

  /* changelog bullets (zh falls back to the English original per bullet) */
  const cl = CHANGELOG.entries && CHANGELOG.entries[v];
  const clZh = CHANGELOG_ZH.entries && CHANGELOG_ZH.entries[v];
  let bullets = null;
  if (cl && cl.b && cl.b.length) bullets = lang === "zh" && clZh ? cl.b.map((b, i) => clZh[i] || b) : cl.b;

  const html = [];
  const metaBits = [`${S.captured} ${day}`, row.model, `${row.tools_count} ${S.tools}`];
  if (row.variants && row.variants.length) metaBits.push(`${S.variants}: ${row.variants.map(displayModel).join(" · ")}`);
  html.push(`<p>${esc(metaBits.join(" · "))}</p>`);
  if (phrases.length) html.push(`<p><strong>${esc(S.reqChanges)}${esc(S.colon.trim())}</strong></p><ul>${phrases.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>`);
  else html.push(`<p>${esc(S.noChanges)}</p>`);
  for (const line of axisLines) html.push(`<p>${esc(line)}</p>`);
  if (bullets) html.push(`<p><strong>${esc(S.changelog)}${esc(S.colon.trim())}</strong></p><ul>${bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`);
  else html.push(`<p>${esc(S.noChangelog)}</p>`);
  const links = [`<a href="${esc(url)}">${esc(S.viewRequest)}</a>`];
  if (prev) links.push(`<a href="${esc(`${SITE}/#/${lang}/diff/${prev}/${v}`)}">${esc(S.diffVs(prev))}</a>`);
  links.push(`<a href="${esc(`${SITE}/#/${lang}`)}">${esc(S.timeline)}</a>`);
  html.push(`<p>${links.join(" · ")}</p>`);

  return [
    `  <entry>`,
    /* lang-scoped id: the en and zh feeds carry different renditions of the
       same event — a shared id would let global-dedup readers drop one. */
    `    <id>tag:api-requests.cc,2026:${lang}/version/${esc(v)}</id>`,
    `    <title>${esc(title)}</title>`,
    `    <updated>${esc(day)}T00:00:00Z</updated>`,
    `    <link rel="alternate" type="text/html" href="${esc(url)}"/>`,
    `    <content type="html">${esc(html.join("\n"))}</content>`,
    `  </entry>`,
  ].join("\n");
}

function buildFeed(lang, selfFile) {
  const S = STR[lang];
  const entries = rows.map((r) => buildEntry(r, lang));
  /* feed-level <updated> = the latest change across entries, not the newest
     version: a replacement bumps an OLDER entry's captured_at past the tip. */
  const newest = rows.length
    ? rows.map((r) => String(DATA.VERSIONS[r.version].captured_at).slice(0, 10)).sort().at(-1)
    : "2026-07-06";
  return [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${lang === "zh" ? "zh-CN" : "en"}">`,
    `  <id>tag:api-requests.cc,2026:feed/${lang}</id>`,
    `  <title>${esc(S.feedTitle)}</title>`,
    `  <subtitle>${esc(S.subtitle)}</subtitle>`,
    `  <updated>${esc(newest)}T00:00:00Z</updated>`,
    `  <link rel="self" type="application/atom+xml" href="${SITE}/${selfFile}"/>`,
    `  <link rel="alternate" type="text/html" href="${SITE}/#/${lang}"/>`,
    `  <icon>${SITE}/assets/lineage-mark.svg</icon>`,
    `  <author><name>api-requests.cc</name></author>`,
    entries.join("\n"),
    `</feed>`,
    ``,
  ].join("\n");
}

for (const [lang, file] of [["en", "feed.xml"], ["zh", "feed.zh-CN.xml"]]) {
  const xml = buildFeed(lang, file);
  const out = path.join(PUB, file);
  fs.writeFileSync(out, xml);
  console.log(`wrote ${path.relative(process.cwd(), out)} — ${rows.length} entries, ${(xml.length / 1024).toFixed(1)}KB`);
}
