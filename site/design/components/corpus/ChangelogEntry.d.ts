import * as React from "react";

/** Per-category bullet counts, generated at build time by leading-verb
 *  classification (site/scripts/build-changelog.js). */
export interface ChangelogCounts {
  /** "Added …", "New …", "Introducing …" */
  add: number;
  /** "Fixed …" */
  fix: number;
  /** "Improved …", "Reduced …", "Faster …" */
  imp: number;
  /** "Changed …", "Removed …", "… now does Y" */
  chg: number;
  /** unclassified */
  oth: number;
}

export interface ChangelogLabels {
  added?: string; fixed?: string; improved?: string; changed?: string; other?: string;
  /** Missing-state title, e.g. "No changelog entry for this version". */
  missing?: string;
  /** Missing-state body line. States the entry is absent — never claims
   *  WHY (the snapshot can't know whether upstream skipped or simply
   *  hasn't published yet). */
  missingBody?: string;
  /** Prefix before the source link, e.g. "Quoted verbatim from". */
  source?: string;
  /** Optional footnote shown under the bullets (zh uses this to state
   *  the originals are untranslated / translations are reviewed).
   *  Null hides it. */
  verbatimNote?: string | null;
  /** Digest term order: false ⇒ "3 added" (en), true ⇒ "新增 3" (zh). @default false */
  wordFirst?: boolean;
}

/**
 * ChangelogEntry — one version's official release notes, quoted
 * verbatim from the Claude Code CHANGELOG. English originals are
 * authoritative; the zh locale may pass reviewed build-time
 * translations as `bullets` (untranslated bullets stay English).
 * The digest line is generated from `counts` and localized via
 * `labels`. Pass empty/missing bullets to get the calm "no entry"
 * state.
 */
export interface ChangelogEntryProps {
  /** Bullets for this version (verbatim EN, or reviewed zh with EN fallback mixed in). Null/empty ⇒ missing state. */
  bullets?: string[] | null;
  /** Build-generated category counts; omit to hide the digest line. */
  counts?: ChangelogCounts | null;
  /** Locale label pack (defaults to English). */
  labels?: ChangelogLabels;
  /** Source attribution link, e.g. { name: "anthropics/claude-code", url: "https://…" }. */
  source?: { name: string; url: string } | null;
  /** Optional control slot rendered in the meta row (right side, before the
   *  source link). The site uses it for the zh 译文/原文 view toggle so the
   *  control lives with the entry's chrome instead of floating above it. */
  actions?: React.ReactNode;
  style?: React.CSSProperties;
}

export function ChangelogEntry(props: ChangelogEntryProps): JSX.Element;

/** Inline renderer for changelog bullets: `code`, **bold**, links, bare URLs. */
export function renderChangelogInline(text: string): React.ReactNode[];

export const ChangelogLabelsEN: Required<ChangelogLabels>;
