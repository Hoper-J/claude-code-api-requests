#!/usr/bin/env node
/* Lineage — merge a freshly fetched upstream CHANGELOG.md into the committed snapshot.

   usage:
     node site/scripts/merge-changelog.js <upstream.md> [snapshot.md] [--dry-run] [--json]
       snapshot defaults to corpus/changelog/CHANGELOG.md and is rewritten in place.

   Why a merge rather than a copy: the snapshot is the build source for the
   site's Changelog tab across every corpus version, while upstream only keeps
   its recent history (on 2026-10-21 the file was cut at ~994 KB, dropping every
   section before 2.1.8 and truncating 2.1.7 mid-line). Rules, per `## x.y.z`
   section:
     - a section only upstream has (a new release) is taken from upstream;
     - a section both have is taken from upstream unless upstream's copy has
       fewer bullets than the snapshot's (a prune or a truncation), in which case
       the snapshot's copy is kept;
     - a section only the snapshot has is kept.
   Sections are written newest-first: upstream's order first, then the
   snapshot-only sections in their own order (they are the older ones).
   The merge is idempotent; the exit code is 0 on success, 2 on a bad input. */
"use strict";
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const files = args.filter((a) => !a.startsWith("--"));
if (!files[0] || flags.has("--help")) {
  console.log("usage: node site/scripts/merge-changelog.js <upstream.md> [snapshot.md] [--dry-run] [--json]");
  process.exit(files[0] ? 0 : 2);
}
const upstreamPath = files[0];
const snapshotPath = files[1] || path.join(__dirname, "..", "..", "corpus", "changelog", "CHANGELOG.md");

function split(text) {
  // { preamble: [lines before the first "## " heading], sections: Map(version -> lines incl. heading) }
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const preamble = [];
  const sections = new Map();
  let cur = null;
  for (const line of lines) {
    const m = /^## (\S+)\s*$/.exec(line);
    if (m) { cur = m[1]; sections.set(cur, [line]); continue; }
    if (cur === null) preamble.push(line); else sections.get(cur).push(line);
  }
  return { preamble, sections };
}
const bullets = (lines) => lines.filter((l) => /^- /.test(l)).length;
const trimTail = (lines) => { const out = lines.slice(); while (out.length && out[out.length - 1].trim() === "") out.pop(); return out; };

const upText = fs.readFileSync(upstreamPath, "utf8");
if (!upText.trim() || !/^## \S+/m.test(upText)) { console.error(`merge-changelog: ${upstreamPath} has no "## version" sections — refusing`); process.exit(2); }
const snapText = fs.existsSync(snapshotPath) ? fs.readFileSync(snapshotPath, "utf8") : "";
const up = split(upText);
const snap = split(snapText);

const report = { added: [], updated: [], kept_snapshot: [], kept_only_in_snapshot: 0, upstream_sections: up.sections.size, snapshot_sections: snap.sections.size };
const out = [];
for (const [v, lines] of up.sections) {
  const old = snap.sections.get(v);
  if (!old) { report.added.push(v); out.push(trimTail(lines)); continue; }
  if (bullets(lines) < bullets(old)) { report.kept_snapshot.push(v); out.push(trimTail(old)); continue; }
  if (trimTail(lines).join("\n") !== trimTail(old).join("\n")) report.updated.push(v);
  out.push(trimTail(lines));
}
for (const [v, lines] of snap.sections) {
  if (up.sections.has(v)) continue;
  report.kept_only_in_snapshot++;
  out.push(trimTail(lines));
}
const preamble = trimTail(up.preamble.length ? up.preamble : snap.preamble);
const merged = [...preamble, "", ...out.flatMap((s) => [...s, ""])].join("\n");
report.merged_sections = out.length;
report.changed = merged !== snapText;

if (!flags.has("--dry-run") && report.changed) fs.writeFileSync(snapshotPath, merged);
if (flags.has("--json")) console.log(JSON.stringify(report));
else {
  const kept = report.kept_snapshot.length ? ` · kept snapshot copy (upstream shorter): ${report.kept_snapshot.join(", ")}` : "";
  console.log(`merge-changelog: ${report.merged_sections} sections (${report.upstream_sections} upstream + ${report.kept_only_in_snapshot} snapshot-only) · added ${report.added.join(", ") || "none"} · updated ${report.updated.join(", ") || "none"}${kept}${flags.has("--dry-run") ? " · dry run" : report.changed ? ` · wrote ${path.relative(process.cwd(), snapshotPath)}` : " · unchanged"}`);
}
